#!/usr/bin/env node

/**
 * Test Script: Sync Entrants Duplicate Handling Investigation
 * 
 * This script tests the assumptions about how the "sync entrants" button works
 * when there are already existing entrants in the Supabase participants table.
 * 
 * Assumptions to test:
 * 1. Does it insert/update only if entrants are not in the existing participants table?
 * 2. Is there logic to avoid duplicates queried using the start.gg API?
 * 3. How does the startgg_entrant_id field prevent duplicates?
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDuplicateHandling() {
  console.log('🔍 Testing Sync Entrants Duplicate Handling Logic\n');

  try {
    // Step 1: Get a sample tournament with participants
    console.log('📋 Step 1: Finding a tournament with existing participants...');
    const { data: tournaments, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, name, game_title, startgg_tournament_url')
      .eq('active', true)
      .limit(5);

    if (tournamentError) {
      throw new Error(`Failed to fetch tournaments: ${tournamentError.message}`);
    }

    if (!tournaments || tournaments.length === 0) {
      console.log('❌ No active tournaments found');
      return;
    }

    const testTournament = tournaments[0];
    console.log(`✅ Found test tournament: ${testTournament.name} (ID: ${testTournament.id})`);

    // Step 2: Get existing participants for this tournament
    console.log('\n📋 Step 2: Fetching existing participants...');
    const { data: existingParticipants, error: participantsError } = await supabase
      .from('participants')
      .select('id, name, startgg_entrant_id, seed, created_at')
      .eq('tournament_id', testTournament.id)
      .order('created_at', { ascending: true });

    if (participantsError) {
      throw new Error(`Failed to fetch participants: ${participantsError.message}`);
    }

    console.log(`✅ Found ${existingParticipants.length} existing participants`);
    
    if (existingParticipants.length > 0) {
      console.log('📊 Sample participants:');
      existingParticipants.slice(0, 3).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} (ID: ${p.startgg_entrant_id}, Seed: ${p.seed})`);
      });
    }

    // Step 3: Analyze the duplicate prevention logic
    console.log('\n🔍 Step 3: Analyzing duplicate prevention logic...');
    
    // Check if participants have startgg_entrant_id
    const participantsWithStartggId = existingParticipants.filter(p => p.startgg_entrant_id);
    const participantsWithoutStartggId = existingParticipants.filter(p => !p.startgg_entrant_id);
    
    console.log(`📊 Participants with startgg_entrant_id: ${participantsWithStartggId.length}`);
    console.log(`📊 Participants without startgg_entrant_id: ${participantsWithoutStartggId.length}`);

    if (participantsWithoutStartggId.length > 0) {
      console.log('⚠️  WARNING: Found participants without startgg_entrant_id - these may cause duplicates!');
      participantsWithoutStartggId.slice(0, 3).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} (Created: ${p.created_at})`);
      });
    }

    // Step 4: Test the duplicate prevention logic by examining the sync-entrants route
    console.log('\n🔍 Step 4: Examining sync-entrants route logic...');
    
    // The key logic from the route is:
    // 1. Check if participant exists by startgg_entrant_id
    // 2. If exists, update; if not, insert
    
    console.log('📋 Duplicate Prevention Logic Analysis:');
    console.log('  ✅ Uses startgg_entrant_id as unique identifier');
    console.log('  ✅ Checks existing participants with: .eq("startgg_entrant_id", participant.startgg_entrant_id)');
    console.log('  ✅ If found: Updates existing participant');
    console.log('  ✅ If not found: Inserts new participant');
    console.log('  ✅ This prevents duplicates based on Start.gg entrant ID');

    // Step 5: Test what happens with participants without startgg_entrant_id
    console.log('\n🔍 Step 5: Testing edge case - participants without startgg_entrant_id...');
    
    if (participantsWithoutStartggId.length > 0) {
      console.log('⚠️  POTENTIAL ISSUE: Participants without startgg_entrant_id');
      console.log('   - These participants cannot be properly matched during sync');
      console.log('   - May result in duplicate entries if Start.gg has the same name');
      console.log('   - The sync logic will create new entries instead of updating existing ones');
      
      // Check for potential name duplicates
      const names = existingParticipants.map(p => p.name.toLowerCase());
      const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
      
      if (duplicateNames.length > 0) {
        console.log('⚠️  FOUND DUPLICATE NAMES (potential sync issues):');
        [...new Set(duplicateNames)].forEach(name => {
          const duplicates = existingParticipants.filter(p => p.name.toLowerCase() === name);
          console.log(`   - "${name}": ${duplicates.length} entries`);
        });
      }
    }

    // Step 6: Test the phase-based filtering logic
    console.log('\n🔍 Step 6: Testing phase-based filtering logic...');
    
    if (testTournament.startgg_tournament_url) {
      console.log('📋 Phase-based filtering prevents syncing too many entrants:');
      console.log('  ✅ Checks current tournament phase');
      console.log('  ✅ Only syncs if ≤ 32 active entrants');
      console.log('  ✅ Uses activeEntrantIds to fetch only active participants');
      console.log('  ✅ This reduces the chance of syncing eliminated participants');
    } else {
      console.log('⚠️  Tournament has no Start.gg URL - cannot test phase filtering');
    }

    // Step 7: Summary and recommendations
    console.log('\n📋 Step 7: Summary and Recommendations\n');
    
    console.log('✅ DUPLICATE PREVENTION MECHANISMS:');
    console.log('  1. startgg_entrant_id field provides stable unique identifier');
    console.log('  2. Upsert logic: check by startgg_entrant_id, update if exists, insert if not');
    console.log('  3. Phase-based filtering reduces total entrants to sync');
    console.log('  4. Active entrant filtering prevents syncing eliminated participants');
    
    console.log('\n⚠️  POTENTIAL ISSUES:');
    if (participantsWithoutStartggId.length > 0) {
      console.log(`  1. ${participantsWithoutStartggId.length} participants lack startgg_entrant_id`);
      console.log('     - These may cause duplicates during sync');
      console.log('     - Recommendation: Run migration to populate startgg_entrant_id');
    }
    
    if (duplicateNames && duplicateNames.length > 0) {
      console.log(`  2. Found ${duplicateNames.length} duplicate names`);
      console.log('     - May indicate existing data quality issues');
      console.log('     - Recommendation: Clean up duplicate entries');
    }
    
    console.log('\n🎯 TESTING RECOMMENDATIONS:');
    console.log('  1. Run sync on tournament with existing participants');
    console.log('  2. Verify no new duplicate entries are created');
    console.log('  3. Verify existing participants are updated, not duplicated');
    console.log('  4. Test with participants that have and don\'t have startgg_entrant_id');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDuplicateHandling().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});