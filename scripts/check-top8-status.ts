/**
 * Script to check the current status of top 8 seeds across all tournaments
 */

import { database } from '../src/lib/database';

// Top 8 players data with start.gg entrant IDs (from search results)
const TOP8_IMPORT_DATA = {
  'Mortal Kombat 1': [
    { name: 'SonicFox', startgg_entrant_id: 19215814, seed: 1 },
    { name: 'ONi | Kanimani', startgg_entrant_id: 20525683, seed: 2 },
    { name: 'RBT/T7G | Nicolas', startgg_entrant_id: 20367422, seed: 3 },
    { name: 'PAR | Rewind', startgg_entrant_id: 19490080, seed: 4 },
    { name: 'RBT/T7G | Scorpionprocs', startgg_entrant_id: 20367543, seed: 5 },
    { name: 'Grr', startgg_entrant_id: 19578805, seed: 6 },
    { name: 'STG | Onlinecale213', startgg_entrant_id: 20342926, seed: 7 },
    { name: '2Game | SnakeDoe', startgg_entrant_id: 20368055, seed: 8 }
  ],
  'Tekken 8': [
    { name: 'Yamasa | Nobi', startgg_entrant_id: 20546937, seed: 8 }
  ],
  'Street Fighter 6': [
    { name: 'WBG RB | MenaRD', startgg_entrant_id: 20642179, seed: 4 },
    { name: 'REJECT | Fuudo', startgg_entrant_id: 20555368, seed: 5 },
    { name: 'Chapmanly', startgg_entrant_id: 20546719, seed: 6 },
    { name: 'MOUZ | EndingWalker', startgg_entrant_id: 20529509, seed: 7 },
    { name: 'Aeroblazer', startgg_entrant_id: 20554304, seed: 8 }
  ],
  'Guilty Gear Strive': [
    { name: 'PAR | Daru_I-No', startgg_entrant_id: 20354852, seed: 1 },
    { name: 'tatuma', startgg_entrant_id: 20562927, seed: 3 },
    { name: 'Fly | NitroNY', startgg_entrant_id: 20668803, seed: 4 },
    { name: 'PAR | Jack', startgg_entrant_id: 20361279, seed: 5 },
    { name: 'Kshuewhatdamoo', startgg_entrant_id: 20568667, seed: 6 },
    { name: 'TSM | Leffen', startgg_entrant_id: 20361308, seed: 7 }
  ],
  'Under Night In Birth II': [
    { name: 'Senaru', startgg_entrant_id: 20089096, seed: 1 },
    { name: 'BBB | Defiant', startgg_entrant_id: 20267027, seed: 2 },
    { name: 'PAR | BigBlack', startgg_entrant_id: 20338465, seed: 3 },
    { name: 'BNP | knotts', startgg_entrant_id: 19493587, seed: 4 },
    { name: '2GB Combo', startgg_entrant_id: 20309760, seed: 5 },
    { name: 'BBB | OmniDeag', startgg_entrant_id: 20545121, seed: 7 },
    { name: 'Ugly_ | Shaly', startgg_entrant_id: 20470451, seed: 8 }
  ],
  'Fatal Fury: City of the Wolves': [
    { name: 'DFM/PWS | GO1', startgg_entrant_id: 20336929, seed: 2 },
    { name: 'Falcons | Kindevu', startgg_entrant_id: 20555311, seed: 5 },
    { name: 'T1 | ZJZ', startgg_entrant_id: 20370525, seed: 6 },
    { name: 'ONIC | NYChrisG', startgg_entrant_id: 20371869, seed: 7 },
    { name: 'AG | Reynald', startgg_entrant_id: 20552498, seed: 8 }
  ],
  'Samurai Shodown': [
    { name: 'WATANABE SHACHOU', startgg_entrant_id: 20323514, seed: 2 },
    { name: 'XBF | Maki', startgg_entrant_id: 20370528, seed: 4 },
    { name: 'bubba000', startgg_entrant_id: 19497904, seed: 5 },
    { name: 'royalpsycho', startgg_entrant_id: 20549021, seed: 6 },
    { name: 'BBBoySonicX', startgg_entrant_id: 20177592, seed: 7 },
    { name: 'Healing Vision', startgg_entrant_id: 20350949, seed: 8 }
  ],
  'THE KING OF FIGHTERS XV': [
    { name: 'GHZ | TheGio', startgg_entrant_id: 20562800, seed: 1 },
    { name: 'LEV | Layec', startgg_entrant_id: 20369380, seed: 2 },
    { name: 'QAD | Wero Asamiya', startgg_entrant_id: 20582800, seed: 3 },
    { name: 'Liquid | ViolentKain', startgg_entrant_id: 19455413, seed: 4 },
    { name: 'Falcon | Tamago', startgg_entrant_id: 19498430, seed: 5 },
    { name: 'Comitê | PiterErn', startgg_entrant_id: 20553115, seed: 6 },
    { name: 'LEV | PAKO', startgg_entrant_id: 20229890, seed: 7 }
  ]
};

async function checkTop8Status() {
  console.log('📊 Checking Top 8 Seeds Status Across All Tournaments\n');
  console.log('=' .repeat(80));

  const results: any[] = [];

  for (const [tournamentName, expectedPlayers] of Object.entries(TOP8_IMPORT_DATA)) {
    try {
      // Get the tournament ID from database
      const { data: tournament, error: tournamentError } = await database
        .from('tournaments')
        .select('id, name')
        .eq('name', tournamentName)
        .single();

      if (tournamentError || !tournament) {
        console.log(`❌ ${tournamentName}: Tournament not found in database`);
        results.push({
          tournament: tournamentName,
          status: 'NOT_FOUND',
          expected: expectedPlayers.length,
          found: 0,
          missing: expectedPlayers.length
        });
        continue;
      }

      // Get current participants for this tournament
      const { data: currentParticipants, error: participantsError } = await database
        .from('participants')
        .select('id, name, startgg_entrant_id')
        .eq('tournament_id', tournament.id);

      if (participantsError) {
        console.log(`❌ ${tournamentName}: Error fetching participants`);
        continue;
      }

      // Check which expected players are found
      const foundPlayers: any[] = [];
      const missingPlayers: any[] = [];

      expectedPlayers.forEach(expectedPlayer => {
        const found = currentParticipants?.find(p => p.startgg_entrant_id === expectedPlayer.startgg_entrant_id);
        if (found) {
          foundPlayers.push(expectedPlayer);
        } else {
          missingPlayers.push(expectedPlayer);
        }
      });

      const status = foundPlayers.length === expectedPlayers.length ? 'COMPLETE' : 'INCOMPLETE';
      
      console.log(`${status === 'COMPLETE' ? '✅' : '⚠️'} ${tournamentName}: ${foundPlayers.length}/${expectedPlayers.length} players`);
      
      if (missingPlayers.length > 0) {
        console.log(`   Missing: ${missingPlayers.map(p => p.name).join(', ')}`);
      }

      results.push({
        tournament: tournamentName,
        status,
        expected: expectedPlayers.length,
        found: foundPlayers.length,
        missing: missingPlayers.length,
        missingPlayers: missingPlayers.map(p => p.name)
      });

    } catch (error) {
      console.error(`❌ Error checking ${tournamentName}:`, error);
    }
  }

  // Summary
  console.log('\n' + '=' .repeat(80));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(80));

  const complete = results.filter(r => r.status === 'COMPLETE');
  const incomplete = results.filter(r => r.status === 'INCOMPLETE');
  const notFound = results.filter(r => r.status === 'NOT_FOUND');

  console.log(`✅ COMPLETE (${complete.length}):`);
  complete.forEach(result => {
    console.log(`   ${result.tournament}: ${result.found}/${result.expected} players`);
  });

  console.log(`\n⚠️  INCOMPLETE (${incomplete.length}):`);
  incomplete.forEach(result => {
    console.log(`   ${result.tournament}: ${result.found}/${result.expected} players`);
    if (result.missingPlayers) {
      console.log(`      Missing: ${result.missingPlayers.join(', ')}`);
    }
  });

  if (notFound.length > 0) {
    console.log(`\n❌ NOT FOUND (${notFound.length}):`);
    notFound.forEach(result => {
      console.log(`   ${result.tournament}`);
    });
  }

  console.log('\n' + '=' .repeat(80));
  console.log(`🎯 TOTAL: ${complete.length} complete, ${incomplete.length} incomplete, ${notFound.length} not found`);
  console.log('=' .repeat(80));

  return results;
}

async function main() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Database credentials not found');
    console.log('💡 Make sure your .env.local file contains:');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    console.log('   or');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
    return;
  }

  await checkTop8Status();
}

main().catch(console.error); 