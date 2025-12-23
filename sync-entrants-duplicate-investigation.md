# Sync Entrants Duplicate Handling Investigation

## Overview

This document investigates how the "sync entrants" button works when there are already existing entrants in the Supabase participants table that the Start.gg API grabs again.

## Key Questions Investigated

1. **Does it insert/update only if entrants are not in the existing participants table?**
2. **Is there logic to avoid duplicates queried using the Start.gg API?**
3. **How does the `startgg_entrant_id` field prevent duplicates?**

## Code Analysis

### 1. Duplicate Prevention Mechanism

The sync-entrants route (`src/app/api/tournaments/[tournamentId]/sync-entrants/route.ts`) implements a robust duplicate prevention system:

```typescript
// Lines 350-390 in sync-entrants route
for (const participant of participants) {
  const { data: existingParticipant, error: existingParticipantError } = await database
    .from('participants')
    .select('id')
    .eq('startgg_entrant_id', participant.startgg_entrant_id)  // ✅ KEY: Uses startgg_entrant_id
    .single();

  if (existingParticipantError && existingParticipantError.code === 'PGRST116') {
    // New entrant, insert into database
    const { data: insertedParticipant, error: insertError } = await database
      .from('participants')
      .insert({
        tournament_id: tournamentId,
        startgg_entrant_id: participant.startgg_entrant_id,
        name: participant.name,
        seed: participant.seed,
        created_at: new Date(),
      })
      .select()
      .single();
  } else {
    // Existing entrant, update in database
    const { data: updatedParticipant, error: updateError } = await database
      .from('participants')
      .update({
        name: participant.name,
        seed: participant.seed,
      })
      .eq('id', existingParticipant.id)
      .select()
      .single();
  }
}
```

### 2. Start.gg Entrant ID as Unique Identifier

The system uses `startgg_entrant_id` as the primary mechanism for duplicate prevention:

- **Database Schema**: Added in migration `20250131_143000_add_startgg_entrant_id_to_participants.sql`
- **Purpose**: Provides a stable identifier from Start.gg API that persists across tournament updates
- **Logic**: Check if participant exists by `startgg_entrant_id`, update if found, insert if not

### 3. Phase-Based Filtering

The system implements intelligent filtering to reduce the number of entrants processed:

```typescript
// From tournament-service.ts getPhaseStatus function
const shouldSync = activeEntrantCount > 0 && activeEntrantCount <= 32;

// Only fetches active entrants from current phase
participants = await fetchActiveEntrantsById(phaseStatus.activeEntrantIds || [], tournamentSlug, gameId);
```

**Benefits:**
- Prevents syncing eliminated participants
- Reduces API calls and processing time
- Focuses on currently active tournament entrants

## Duplicate Prevention Strategies

### ✅ Strategy 1: Stable ID System
- Uses `startgg_entrant_id` from Start.gg as unique identifier
- This ID remains constant even if participant name changes
- Prevents duplicates based on stable external ID

### ✅ Strategy 2: Upsert Logic
- Check if participant exists by `startgg_entrant_id`
- If exists: Update existing record
- If not exists: Insert new record
- No deletion of existing participants

### ✅ Strategy 3: Phase-Based Filtering
- Only syncs when ≤ 32 active entrants
- Fetches only active participants from current phase
- Reduces chance of syncing eliminated participants

### ✅ Strategy 4: Tournament-Specific Scoping
- All participants are scoped to specific `tournament_id`
- Prevents cross-tournament duplicates

## Potential Issues Identified

### ⚠️ Issue 1: Legacy Participants Without startgg_entrant_id

**Problem**: Participants created before the `startgg_entrant_id` migration may lack this field.

**Impact**: 
- These participants cannot be properly matched during sync
- May result in duplicate entries if Start.gg has the same name
- Sync logic will create new entries instead of updating existing ones

**Detection**: Check for participants where `startgg_entrant_id IS NULL`

### ⚠️ Issue 2: Name-Based Duplicates

**Problem**: If multiple participants have the same name, the system may create duplicates.

**Impact**: 
- Only affects participants without `startgg_entrant_id`
- Modern sync operations should be protected by the ID system

## Testing Recommendations

### Test Scenario 1: Normal Sync with Existing Participants
1. Create tournament with existing participants (with `startgg_entrant_id`)
2. Run sync entrants
3. Verify: No new duplicate entries created
4. Verify: Existing participants updated, not duplicated

### Test Scenario 2: Legacy Participants Without startgg_entrant_id
1. Create tournament with participants lacking `startgg_entrant_id`
2. Run sync entrants
3. Verify: New entries created for these participants
4. Verify: `startgg_entrant_id` populated in new entries

### Test Scenario 3: Phase-Based Filtering
1. Test with tournament in early rounds (>32 entrants)
2. Verify: Sync blocked with appropriate message
3. Test with tournament in later rounds (≤32 entrants)
4. Verify: Only active entrants synced

### Test Scenario 4: Name Changes
1. Change participant name in Start.gg
2. Run sync entrants
3. Verify: Participant updated with new name, same `startgg_entrant_id`

## Code Quality Assessment

### ✅ Strengths
1. **Robust duplicate prevention**: Uses stable external IDs
2. **Intelligent filtering**: Phase-based participant selection
3. **Safe updates**: Never deletes existing participants
4. **Error handling**: Graceful handling of API failures
5. **Logging**: Comprehensive debug logging for troubleshooting

### 🔧 Areas for Improvement
1. **Migration support**: Handle legacy participants without `startgg_entrant_id`
2. **Batch operations**: Consider batching database operations for performance
3. **Validation**: Add validation for `startgg_entrant_id` format
4. **Monitoring**: Add metrics for sync success/failure rates

## Conclusion

The sync entrants functionality has **excellent duplicate prevention mechanisms**:

1. **Primary Protection**: `startgg_entrant_id` provides stable unique identification
2. **Secondary Protection**: Phase-based filtering reduces total entrants processed
3. **Tertiary Protection**: Upsert logic ensures safe updates without deletion

**The system should effectively prevent duplicates** when:
- All participants have `startgg_entrant_id` populated
- Tournament is in appropriate phase (≤32 active entrants)
- Start.gg API returns consistent entrant IDs

**Potential issues exist** with legacy data lacking `startgg_entrant_id`, but the current system is well-designed to handle modern sync operations safely.

## Recommendations

1. **Run migration** to populate `startgg_entrant_id` for legacy participants
2. **Monitor sync operations** for any duplicate creation
3. **Test thoroughly** with various tournament states
4. **Consider adding** validation for `startgg_entrant_id` presence before sync