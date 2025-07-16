# Tournament Visibility Feature

## Overview

This feature allows administrators to control which tournaments are visible to regular users. Tournaments can be hidden from the main page while remaining accessible to admins for management purposes.

## Database Changes

### New Field
- **`active`** (BOOLEAN, NOT NULL, DEFAULT true)
  - Controls tournament visibility
  - `true` = visible to regular users
  - `false` = hidden from regular users (admin only)

### Migration
- File: `supabase/migrations/20250201_130000_add_active_field_to_tournaments.sql`
- Sets all existing tournaments as active by default (backward compatibility)
- Adds index for performance

## API Changes

### Updated Endpoints

#### GET `/api/tournaments`
- **New Query Parameter**: `onlyActive`
  - `onlyActive=true` (default): Returns only active tournaments
  - `onlyActive=false`: Returns all tournaments (active and inactive)
- **Usage**: Frontend uses default (active only), admin uses `onlyActive=false`

#### PATCH `/api/admin/tournaments/[tournamentId]/toggle-visibility`
- **New Endpoint**: Toggles tournament visibility
- **Body**: `{ "active": boolean }`
- **Response**: Updated tournament object with success message

## Service Layer Changes

### `tournamentService.getTournaments(onlyActive?: boolean)`
- **Parameter**: `onlyActive` (default: `true`)
- **Behavior**: 
  - `true`: Returns only active tournaments (frontend default)
  - `false`: Returns all tournaments (admin use)

### `backendService.getTournaments(onlyActive?: boolean)`
- Updated to support the new parameter
- Passes `onlyActive` to API endpoint

## Frontend Changes

### Homepage (`src/app/page.tsx`)
- Now calls `tournamentService.getTournaments(true)` by default
- Only shows active tournaments to regular users

### Admin Page (`src/app/admin/page.tsx`)
- Calls `tournamentService.getTournaments(false)` to see all tournaments
- **New UI Elements**:
  - Visibility toggle buttons next to each tournament tab
  - Visual indicators for hidden tournaments (opacity, "(Hidden)" label)
  - Loading states during visibility updates

### Visual Indicators
- **Active tournaments**: Normal opacity, green eye icon (👁️)
- **Hidden tournaments**: Reduced opacity (0.5), monkey icon (🙈), "(Hidden)" in tooltip
- **Updating**: Loading indicator ("...")

## Usage Examples

### Hide a Tournament
1. Go to Admin Dashboard
2. Click the eye icon (👁️) next to the tournament tab
3. Tournament becomes hidden (🙈 icon appears)
4. Regular users no longer see this tournament on the homepage

### Show a Hidden Tournament
1. Go to Admin Dashboard
2. Click the monkey icon (🙈) next to the tournament tab
3. Tournament becomes visible (👁️ icon appears)
4. Regular users can now see this tournament on the homepage

## Backward Compatibility

- All existing tournaments are automatically set to `active = true`
- No existing functionality is broken
- API endpoints maintain backward compatibility

## Security Considerations

- Only admins can access the toggle functionality
- Regular users cannot see hidden tournaments
- Admin interface shows all tournaments regardless of visibility status

## Future Enhancements

### Potential Improvements
1. **Bulk Operations**: Toggle multiple tournaments at once
2. **Scheduled Visibility**: Automatically show/hide tournaments based on dates
3. **Audit Log**: Track who changed tournament visibility and when
4. **Game Title Management**: Dynamic UI mapping for new game titles

### Game Title Management
Currently, new game titles require manual addition to `gameUiDetailsMap`. Future improvements could include:
- Admin interface for managing game UI details
- Dynamic fallback UI for unmapped games
- Database-driven game configuration