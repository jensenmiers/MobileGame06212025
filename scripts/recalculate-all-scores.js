// scripts/recalculate-all-scores.js
// This script will update all prediction scores for all tournaments using the admin recalculation endpoint.
// Usage: node scripts/recalculate-all-scores.js

const BASE_URL = 'http://localhost:3000'; // Changed to match running Next.js port

async function getAllTournaments() {
  const res = await fetch(`${BASE_URL}/api/tournaments`);
  if (!res.ok) throw new Error('Failed to fetch tournaments');
  const data = await res.json();
  // Try to support both { tournaments: [...] } and just [ ... ]
  return data.tournaments || data;
}

async function recalculateScoresForTournament(tournamentId) {
  const res = await fetch(`${BASE_URL}/api/admin/tournaments/${tournamentId}/recalculate-scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unknown error');
  return data;
}

(async () => {
  try {
    const tournaments = await getAllTournaments();
    if (!Array.isArray(tournaments) || tournaments.length === 0) {
      console.log('No tournaments found.');
      return;
    }
    for (const tournament of tournaments) {
      const id = tournament.id || tournament.tournament_id;
      if (!id) continue;
      process.stdout.write(`Recalculating scores for tournament ${id}... `);
      try {
        const result = await recalculateScoresForTournament(id);
        console.log('Done:', result.message || 'Success');
      } catch (err) {
        console.error('Failed:', err.message);
      }
    }
    console.log('All tournaments processed.');
  } catch (err) {
    console.error('Script failed:', err.message);
  }
})(); 