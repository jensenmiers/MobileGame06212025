"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { gameUiDetailsMap } from "@/lib/game-utils";
import { tournamentService } from "@/lib/tournament-service";
import { LeaderboardEntry, Tournament, CommunityFavorite } from "@/types/tournament";
import { supabase } from "@/lib/supabase";

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return <span className="text-2xl sm:text-3xl">🥇</span>;
    case 2: return <span className="text-2xl sm:text-3xl">🥈</span>;
    case 3: return <span className="text-2xl sm:text-3xl">🥉</span>;
    default: return (
      <span className="text-gray-200 text-lg sm:text-xl md:text-2xl">
        {rank}
      </span>
    );
  }
};

const getRankColor = (rank: number) => {
  return "bg-gray-900/50 hover:bg-gray-800/50";
};

// Helper function to get favorite position styling
const getFavoriteRankColor = (rank: number) => {
  switch (rank) {
    case 1: return "bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border-yellow-500/50";
    case 2: return "bg-gradient-to-r from-gray-600/20 to-gray-500/20 border-gray-400/50";
    case 3: return "bg-gradient-to-r from-amber-700/20 to-amber-600/20 border-amber-500/50";
    case 4: return "bg-gradient-to-r from-blue-600/20 to-blue-500/20 border-blue-400/50";
    default: return "bg-gray-900/50 border-gray-700/50";
  }
};

export default function LeaderboardPage() {
  const [tournamentTitle, setTournamentTitle] = useState<string>("");
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [communityFavorites, setCommunityFavorites] = useState<CommunityFavorite[]>([]);
  const [totalPredictions, setTotalPredictions] = useState<number>(0);
  const [hasResults, setHasResults] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const params = useParams();
  const gameSlug = params.game as string;

  const tournamentName = Object.keys(gameUiDetailsMap).find(
    key => gameUiDetailsMap[key].slug === gameSlug
  );

  // Helper function to check if tournament is in pending state
  const isTournamentPending = (tournament: Tournament, hasResults: boolean): boolean => {
    if (hasResults) return false; // Tournament completed
    
    const cutoffTime = new Date(tournament.cutoff_time);
    const now = new Date();
    
    return cutoffTime <= now; // Predictions closed but no results yet
  };

  useEffect(() => {
    if (!tournamentName) {
      return notFound();
    }
    setTournamentTitle(tournamentName);

    const fetchTournamentData = async () => {
      setIsLoading(true);
      const tournaments = await tournamentService.getTournaments();
      const currentTournament = tournaments.find(t => t.name === tournamentName);

      if (currentTournament) {
        setTournament(currentTournament);
        
        // Check if tournament has results
        let tournamentHasResults = false;
        try {
          if (process.env.NEXT_PUBLIC_USE_BACKEND_API === 'true') {
            const response = await fetch(`/api/tournaments/${currentTournament.id}/results`);
            if (response.ok) {
              const resultsData = await response.json();
              tournamentHasResults = !!(resultsData.results && Object.keys(resultsData.results).length > 0);
            }
          } else {
            const { data: results, error } = await supabase
              .from('results')
              .select('id')
              .eq('tournament_id', currentTournament.id)
              .limit(1);
            
            tournamentHasResults = !error && results && results.length > 0;
          }
        } catch (error) {
          console.error('Error checking results:', error);
        }

        setHasResults(tournamentHasResults);

        // Fetch leaderboard data
        const leaderboardData = await tournamentService.getLeaderboard(currentTournament.id);
        setLeaderboard(leaderboardData);

        // If tournament is pending, fetch community favorites
        if (isTournamentPending(currentTournament, tournamentHasResults)) {
          setIsLoadingFavorites(true);
          try {
            const favoritesData = await tournamentService.getCommunityFavorites(currentTournament.id);
            setCommunityFavorites(favoritesData.favorites);
            setTotalPredictions(favoritesData.total_predictions);
          } catch (error) {
            console.error('Error fetching community favorites:', error);
          } finally {
            setIsLoadingFavorites(false);
          }
        }
      } else {
        console.error(`${tournamentName} tournament not found.`);
      }
      setIsLoading(false);
    };

    fetchTournamentData();
  }, [gameSlug, tournamentName]);

  if (!tournamentName) {
    return null; // Should be handled by notFound()
  }

  const showCommunityFavorites = tournament && isTournamentPending(tournament, hasResults);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="w-full mb-6">
          <Link 
            href={`/?game=${gameSlug}`}
            className="inline-flex items-center text-gray-300 hover:text-white transition-colors bg-gray-800/50 hover:bg-gray-700/50 px-4 py-2 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
        
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-green-400">Leaderboard</h1>
          <h2 className="text-2xl font-bold mb-2 text-white">{tournamentTitle}</h2>
          <p className="text-gray-300">See how you rank against other bracket wizards</p>
        </div>

        {/* Community Favorites Section (Pending Phase Only) */}
        {showCommunityFavorites && (
          <Card className="bg-black/70 border-yellow-600/50 rounded-lg shadow-xl overflow-hidden mb-6">
            <CardHeader className="border-b border-yellow-700/50">
                             <CardTitle className="text-white flex items-center gap-2">
                 <span className="text-yellow-400">⭐ Community Favorites</span>
                 <span className="text-sm text-yellow-200 font-normal">
                   (Based on {totalPredictions} predictions)
                 </span>
               </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingFavorites ? (
                <div className="text-center py-6 text-lg text-gray-400">Loading community favorites...</div>
              ) : communityFavorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {communityFavorites.map((favorite, index) => {
                    // Calculate rating as percentage of theoretical maximum (total predictions × 8 points)
                    const maxPossiblePoints = totalPredictions * 8; // 8 points for being everyone's 1st pick
                    const baseRating = (favorite.total_points / maxPossiblePoints) * 100;
                    // Push rating closer to 100% by keeping only 1/3 of the distance from 100%
                    const rating = Math.round(100 - (100 - baseRating) / 3);
                    
                    return (
                      <div
                        key={favorite.participant_id}
                        className={`
                          flex items-center justify-between p-2 transition-all duration-200 rounded-lg border
                          ${getFavoriteRankColor(index + 1)}
                          hover:scale-[1.02] hover:shadow-lg
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 text-center flex items-center justify-center flex-shrink-0">
                            <span className="text-yellow-400 font-bold text-base">#{index + 1}</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-base text-white truncate">
                              {favorite.participant_name}
                            </h3>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-base font-bold text-yellow-400">
                            {rating}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-lg text-gray-400">
                  No predictions found yet. Be the first to make your picks!
                </div>
              )}
              

            </CardContent>
          </Card>
        )}

        {/* Leaderboard Section */}
        <Card className="bg-black/70 border-gray-800 rounded-lg shadow-xl overflow-hidden">
          <CardHeader className="border-b border-gray-700/50">
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-green-400">🏆 Top Players</span>
              <span className="text-sm text-gray-400 font-normal">
                {hasResults ? "(Final Results)" : "(Live Rankings)"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-10 text-lg text-gray-400">Loading Leaderboard...</div>
            ) : leaderboard.length > 0 ? (
              <ol className="space-y-4">
                {leaderboard.map((player) => (
                  <li
                    key={player.userId}
                    className={`
                      flex items-center justify-between pl-4 pr-6 py-4 transition-all duration-200 rounded-lg
                      ${getRankColor(player.rank)}
                      hover:bg-gray-800/70
                      border-l-4 ${
                        player.rank === 1 ? 'border-l-yellow-400' : 
                        player.rank === 2 ? 'border-l-gray-300' :
                        player.rank === 3 ? 'border-l-amber-600' :
                        'border-l-gray-700'
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 text-center flex items-center justify-center flex-shrink-0">
                        {getRankIcon(player.rank)}
                      </div>
                      <div className="w-[120px] sm:w-[150px] md:w-[200px] flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold text-lg sm:text-xl md:text-2xl truncate ${player.rank === 1 ? 'text-yellow-400' : 'text-white'}`}>
                            {player.username}
                          </h3>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg sm:text-xl md:text-2xl font-bold ${player.rank === 1 ? 'text-yellow-400' : 'text-white'}`}>
                        {player.points}
                      </div>
                      <div className={`text-xs sm:text-sm ${player.rank === 1 ? 'text-yellow-200' : 'text-gray-300'}`}>
                        points
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-center py-10 text-lg text-gray-400">
                {showCommunityFavorites 
                  ? "Leaderboard will appear once tournament results are posted!"
                  : "No leaderboard data available yet. Check back after the tournament is complete!"
                }
              </div>
            )}
            
            <div className="mt-8 p-4 bg-green-900/20 border border-green-800/30 rounded-lg">
              <p className="text-sm text-green-100 text-center">
                🔄 Leaderboard updates automatically after each tournament round
              </p>
              <p className="text-xs text-green-200/60 text-center mt-1">
                Powered by Supabase • Updates in real-time
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
