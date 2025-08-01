import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

// Top 8 players data with start.gg entrant IDs (from search results)
const TOP8_IMPORT_DATA: Record<string, Array<{ name: string; startgg_entrant_id: number; seed: number }>> = {
  'Mortal Kombat 1': [
    { name: 'SonicFox', startgg_entrant_id: 19215814, seed: 1 },
    { name: 'ONi | Kanimani', startgg_entrant_id: 20525683, seed: 2 },
    { name: 'RBT/T7G | Nicolas', startgg_entrant_id: 20367422, seed: 3 },
    { name: 'PAR | Rewind', startgg_entrant_id: 19490080, seed: 4 },
    { name: 'RBT/T7G | Scorpionprocs', startgg_entrant_id: 20367543, seed: 5 },
    { name: 'Grr', startgg_entrant_id: 19578805, seed: 6 },
    { name: '2Game | SnakeDoe', startgg_entrant_id: 20368055, seed: 7 },
    { name: 'STG | Onlinecale213', startgg_entrant_id: 20342926, seed: 8 }
  ],
  'Tekken 8': [
    { name: 'DRX | Knee', startgg_entrant_id: 19498207, seed: 1 },
    { name: 'DNF | ULSAN', startgg_entrant_id: 19497415, seed: 2 },
    { name: 'Falcons | ATIF', startgg_entrant_id: 19502162, seed: 3 },
    { name: 'DNF | Mulgold', startgg_entrant_id: 19496092, seed: 4 },
    { name: 'TM | RB | Arslan Ash', startgg_entrant_id: 20367697, seed: 5 },
    { name: 'VARREL | Rangchu', startgg_entrant_id: 19803901, seed: 6 },
    { name: 'DRX | LowHigh', startgg_entrant_id: 19497479, seed: 7 },
    { name: 'TeamYAMASA | NOBI', startgg_entrant_id: 20360365, seed: 8 }
  ],
  'Street Fighter 6': [
    { name: 'DRX | Leshar', startgg_entrant_id: 20456283, seed: 1 },
    { name: 'ZETA | Kakeru', startgg_entrant_id: 20354653, seed: 2 },
    { name: 'FLY | Punk', startgg_entrant_id: 20339658, seed: 3 },
    { name: 'WBG RB | MenaRD', startgg_entrant_id: 20642179, seed: 4 },
    { name: 'Falcons | NL', startgg_entrant_id: 19508078, seed: 5 },
    { name: 'REJECT | Fuudo', startgg_entrant_id: 20555368, seed: 6 },
    { name: 'MOUZ | EndingWalker', startgg_entrant_id: 20529509, seed: 7 },
    { name: '2Game | Blaz', startgg_entrant_id: 20368583, seed: 8 }
  ],
  'Guilty Gear Strive': [
    { name: 'PAR | Daru_I-No', startgg_entrant_id: 20354852, seed: 1 },
    { name: 'Ditto | RedDitto', startgg_entrant_id: 20203519, seed: 2 },
    { name: 'tatuma', startgg_entrant_id: 20562927, seed: 3 },
    { name: 'Fly | NitroNY', startgg_entrant_id: 20668803, seed: 4 },
    { name: 'Kshuewhatdamoo', startgg_entrant_id: 20568667, seed: 5 },
    { name: 'PAR | Jack', startgg_entrant_id: 20361279, seed: 6 },
    { name: 'TSM | Leffen', startgg_entrant_id: 20361308, seed: 7 },
    { name: 'Verix', startgg_entrant_id: 19989496, seed: 8 }
  ],
  'Under Night In Birth II': [
    { name: 'Senaru', startgg_entrant_id: 20089096, seed: 1 },
    { name: 'BBB | Defiant', startgg_entrant_id: 20267027, seed: 2 },
    { name: 'PAR | BigBlack', startgg_entrant_id: 20338465, seed: 3 },
    { name: 'BNP | knotts', startgg_entrant_id: 19493587, seed: 4 },
    { name: '2GB Combo', startgg_entrant_id: 20309760, seed: 5 },
    { name: 'ちょび/chobi', startgg_entrant_id: 19787395, seed: 6 },
    { name: 'Ugly_ | Shaly', startgg_entrant_id: 20470451, seed: 7 },
    { name: 'BBB | OmniDeag', startgg_entrant_id: 20545121, seed: 8 }
  ],
  'Fatal Fury: City of the Wolves': [
    { name: 'KSG | xiaohai', startgg_entrant_id: 20233344, seed: 1 },
    { name: 'DFM/PWS | GO1', startgg_entrant_id: 20336929, seed: 2 },
    { name: 'CAG | Fenritti', startgg_entrant_id: 20565913, seed: 3 },
    { name: 'SS熊本 | Nemo', startgg_entrant_id: 19497484, seed: 4 },
    { name: 'Falcons | Kindevu', startgg_entrant_id: 20555311, seed: 5 },
    { name: 'T1 | ZJZ', startgg_entrant_id: 20370525, seed: 6 },
    { name: 'AG | Reynald', startgg_entrant_id: 20552498, seed: 7 },
    { name: 'ONIC | NYChrisG', startgg_entrant_id: 20371869, seed: 8 }
  ],
  'Samurai Shodown': [
    { name: 'XBF | Scrub Saibot', startgg_entrant_id: 19508554, seed: 1 },
    { name: 'WATANABE SHACHOU', startgg_entrant_id: 20323514, seed: 2 },
    { name: 'ぐっぴー', startgg_entrant_id: 20538565, seed: 3 },
    { name: 'XBF | Maki', startgg_entrant_id: 20370528, seed: 4 },
    { name: 'bubba000', startgg_entrant_id: 19497904, seed: 5 },
    { name: 'royalpsycho', startgg_entrant_id: 20549021, seed: 6 },
    { name: 'Healing Vision', startgg_entrant_id: 20350949, seed: 7 },
    { name: 'BBoySonicX', startgg_entrant_id: 20177592, seed: 8 }
  ],
  'THE KING OF FIGHTERS XV': [
    { name: 'GHZ | TheGio', startgg_entrant_id: 20562800, seed: 1 },
    { name: 'Falcons ET', startgg_entrant_id: 20519342, seed: 2 },
    { name: 'LEV | Layec', startgg_entrant_id: 20369380, seed: 3 },
    { name: 'QAD | Wero Asamiya', startgg_entrant_id: 20582800, seed: 4 },
    { name: 'Falcon | Tamago', startgg_entrant_id: 19498430, seed: 5 },
    { name: 'Liquid | ViolentKain', startgg_entrant_id: 19455413, seed: 6 },
    { name: 'Comitê | PiterErn', startgg_entrant_id: 20553115, seed: 7 },
    { name: 'LEV | PAKO', startgg_entrant_id: 20229890, seed: 8 }
  ]
};

export async function POST(
  request: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  try {
    const { tournamentId } = params;

    // Get the tournament to find its name
    const { data: tournament, error: tournamentError } = await database
      .from('tournaments')
      .select('id, name')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    const players = TOP8_IMPORT_DATA[tournament.name];
    if (!players || players.length === 0) {
      return NextResponse.json(
        { success: false, error: `No top 8 data available for ${tournament.name}` },
        { status: 400 }
      );
    }

    const addedParticipants: any[] = [];
    const skippedParticipants: any[] = [];
    let errorCount = 0;

    // Add each player
    for (const player of players) {
      try {
        // Check if player already exists
        const { data: existingPlayer, error: checkError } = await database
          .from('participants')
          .select('id, name')
          .eq('tournament_id', tournamentId)
          .eq('startgg_entrant_id', player.startgg_entrant_id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error(`Error checking existing player ${player.name}:`, checkError);
          errorCount++;
          continue;
        }

        if (existingPlayer) {
          console.log(`Skipping ${player.name} - already exists`);
          skippedParticipants.push({
            ...player,
            id: existingPlayer.id
          });
          continue;
        }

        // Insert new participant
        const { data: newParticipant, error: insertError } = await database
          .from('participants')
          .insert({
            tournament_id: tournamentId,
            name: player.name,
            seed: player.seed,
            startgg_entrant_id: player.startgg_entrant_id
          })
          .select('id, name, seed, startgg_entrant_id')
          .single();

        if (insertError) {
          console.error(`Error adding ${player.name}:`, insertError);
          errorCount++;
          continue;
        }

        console.log(`Added ${player.name} (ID: ${newParticipant.id}, Seed: ${player.seed})`);
        addedParticipants.push(newParticipant);

      } catch (error) {
        console.error(`Unexpected error adding ${player.name}:`, error);
        errorCount++;
      }
    }

    const message = `Imported ${addedParticipants.length} new participants, skipped ${skippedParticipants.length} existing participants${errorCount > 0 ? `, ${errorCount} errors` : ''}`;

    return NextResponse.json({
      success: true,
      message,
      data: {
        added: addedParticipants.length,
        skipped: skippedParticipants.length,
        errors: errorCount,
        total: addedParticipants.length + skippedParticipants.length
      }
    });

  } catch (error) {
    console.error('Error importing top 8 seeds:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 