/**
 * Script to check the actual top 8 status by looking at all participants in each tournament
 */

import { database } from '../src/lib/database';

// Complete top 8 players data for each tournament (from your original list)
const COMPLETE_TOP8_DATA = {
  'Mortal Kombat 1': [
    'SonicFox', 'ONi|Kanimani', 'RBT|Nicolas', 'PAR|Rewind', 
    'RBT|Scorpionprocs', 'Grr', 'STG|Onlinecale213', '2G|SnakeDoe'
  ],
  'Tekken 8': [
    'DRX|Knee', 'DNF|Ulsan', 'Falcons|Atif', 'DNF|Mulgold', 
    'TM|Arslan Ash', 'Varrel|Rangchu', 'Yamasa|Nobi', 'DRX|LowHigh'
  ],
  'Street Fighter 6': [
    'DRX|Leshar', 'Zeta|Kakeru', 'FLY|Punk', 'WBG|MenaRD', 
    'Reject|Fuudo', 'Falcons|NL', 'Mouz|EndingWalker', '2G|Blaz'
  ],
  'Guilty Gear Strive': [
    'PAR|Daru', 'RedDitto', 'Tatuma', 'FLY|Nitro', 
    'PAR|Jack', 'Kshuewhatdamoo', 'TSM|Leffen', 'Verix'
  ],
  'Under Night In Birth II': [
    'Senaru', 'BBB|Defiant', 'PAR|BigBlack', 'BNP|Knotts', 
    '2GB Combo', 'Chobi', 'BBB|OmniDeag', 'Ugly|Shaly'
  ],
  'Fatal Fury: City of the Wolves': [
    'KSG|Xiaohai', 'DFM|Go1', 'CAG|Fenrich', 'Saishunkan|Nemo', 
    'Falcons|Kindevu', 'T1|ZJZ', 'ONIC|NYChrisG', 'AG|Reynald'
  ],
  'Samurai Shodown': [
    'XBF|ScrubSaibot', 'Watanabe Shachou', 'Guppii', 'XBF|Maki', 
    'Bubba000', 'Royalpsycho', 'BBBoySonicX', 'Healing Vision'
  ],
  'THE KING OF FIGHTERS XV': [
    'GHZ|TheGio', 'Falcons|E.T.', 'LEV|Layec', 'QAD|Wero Asamiya', 
    'Liquid|ViolentKain', 'Falcons|Tamago', 'Comitê|PiterErn', 'LEV|Pako'
  ]
};

async function checkActualTop8Status() {
  console.log('📊 Checking Actual Top 8 Seeds Status Across All Tournaments\n');
  console.log('=' .repeat(80));

  const results: any[] = [];

  for (const [tournamentName, expectedTop8] of Object.entries(COMPLETE_TOP8_DATA)) {
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
          expected: expectedTop8.length,
          found: 0,
          missing: expectedTop8.length,
          totalParticipants: 0
        });
        continue;
      }

      // Get ALL current participants for this tournament
      const { data: allParticipants, error: participantsError } = await database
        .from('participants')
        .select('id, name')
        .eq('tournament_id', tournament.id);

      if (participantsError) {
        console.log(`❌ ${tournamentName}: Error fetching participants`);
        continue;
      }

      const totalParticipants = allParticipants?.length || 0;

      // Check which expected top 8 players are found
      const foundTop8: string[] = [];
      const missingTop8: string[] = [];

      expectedTop8.forEach(expectedPlayer => {
        // Check if any participant name contains the expected player name
        const found = allParticipants?.find(p => {
          const participantName = p.name.toLowerCase();
          const expectedName = expectedPlayer.toLowerCase();
          
          // Handle team prefixes and variations
          if (expectedName.includes('|')) {
            const [team, player] = expectedName.split('|');
            return participantName.includes(team) && participantName.includes(player);
          } else {
            return participantName.includes(expectedName);
          }
        });
        
        if (found) {
          foundTop8.push(expectedPlayer);
        } else {
          missingTop8.push(expectedPlayer);
        }
      });

      const status = foundTop8.length === expectedTop8.length ? 'COMPLETE' : 'INCOMPLETE';
      
      console.log(`${status === 'COMPLETE' ? '✅' : '⚠️'} ${tournamentName}: ${foundTop8.length}/${expectedTop8.length} top 8 players (${totalParticipants} total participants)`);
      
      if (missingTop8.length > 0) {
        console.log(`   Missing: ${missingTop8.join(', ')}`);
      }

      results.push({
        tournament: tournamentName,
        status,
        expected: expectedTop8.length,
        found: foundTop8.length,
        missing: missingTop8.length,
        missingPlayers: missingTop8,
        totalParticipants,
        foundPlayers: foundTop8
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
    console.log(`   ${result.tournament}: ${result.found}/${result.expected} top 8 players (${result.totalParticipants} total participants)`);
  });

  console.log(`\n⚠️  INCOMPLETE (${incomplete.length}):`);
  incomplete.forEach(result => {
    console.log(`   ${result.tournament}: ${result.found}/${result.expected} top 8 players (${result.totalParticipants} total participants)`);
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

  await checkActualTop8Status();
}

main().catch(console.error); 