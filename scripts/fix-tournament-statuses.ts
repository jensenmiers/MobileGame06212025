#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'

// Database configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

// Helper function to calculate tournament status
async function calculateTournamentStatus(tournamentId: string, cutoffTime: string): Promise<'upcoming' | 'active' | 'completed'> {
  // Check if tournament has results
  const { data: results, error: resultsError } = await supabase
    .from('results')
    .select('id')
    .eq('tournament_id', tournamentId)
    .limit(1)

  if (!resultsError && results && results.length > 0) {
    return 'completed'
  }

  // Calculate based on cutoff time
  const now = new Date()
  const cutoff = new Date(cutoffTime)
  
  if (cutoff > now) {
    return 'upcoming'  // Predictions still open
  } else {
    return 'active'    // Predictions closed, waiting for results
  }
}

async function fixTournamentStatuses() {
  console.log('🔧 Fixing tournament statuses...')
  
  try {
    // Get all tournaments
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('id, name, cutoff_time, status')
      .order('created_at')

    if (tournamentsError) {
      throw tournamentsError
    }

    if (!tournaments || tournaments.length === 0) {
      console.log('ℹ️ No tournaments found')
      return
    }

    console.log(`📊 Found ${tournaments.length} tournaments to process`)

    let updatedCount = 0
    let unchangedCount = 0

    for (const tournament of tournaments) {
      const correctStatus = await calculateTournamentStatus(tournament.id, tournament.cutoff_time)
      
      if (tournament.status !== correctStatus) {
        console.log(`🔄 Updating "${tournament.name}": ${tournament.status} → ${correctStatus}`)
        
        const { error: updateError } = await supabase
          .from('tournaments')
          .update({ 
            status: correctStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', tournament.id)

        if (updateError) {
          console.error(`❌ Failed to update ${tournament.name}:`, updateError)
        } else {
          updatedCount++
        }
      } else {
        console.log(`✅ "${tournament.name}" status is already correct: ${correctStatus}`)
        unchangedCount++
      }
    }

    console.log('🎉 Fix complete!')
    console.log(`✅ Updated: ${updatedCount} tournaments`)
    console.log(`✅ Already correct: ${unchangedCount} tournaments`)

  } catch (error) {
    console.error('❌ Error fixing tournament statuses:', error)
    process.exit(1)
  }
}

// Run the script
fixTournamentStatuses() 