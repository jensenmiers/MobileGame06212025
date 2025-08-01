"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { gameUiDetailsMap } from "@/lib/game-utils";
import { tournamentService } from "@/lib/tournament-service";
import type { Participant, Prediction, Tournament, LeaderboardEntry, CommunityFavorite } from "@/types/tournament";
import { formatBonusPredictions } from "@/lib/utils";
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

// Helper to format a full name as 'First M. L.' (for privacy)
function formatNameShort(fullName: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]; // Single name
  const first = parts[0];
  const initials = parts.slice(1).map((n) => n[0]?.toUpperCase() + '.').join(' ');
  return `${first} ${initials}`.trim();
}

export default function LeaderboardPage() {
  const [tournamentTitle, setTournamentTitle] = useState<string>("");
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [communityFavorites, setCommunityFavorites] = useState<CommunityFavorite[]>([]);
  const [totalPredictions, setTotalPredictions] = useState<number>(0);
  const [hasResults, setHasResults] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [winnerPrediction, setWinnerPrediction] = useState<Prediction | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expandedRanks, setExpandedRanks] = useState<number[]>([]);
  const [userPredictions, setUserPredictions] = useState<Record<string, Prediction | null>>({});
  const [tournamentResult, setTournamentResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
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

  // Helper to toggle expanded/collapsed state for a card
  function toggleExpand(rank: number, userId?: string, username?: string) {
    setExpandedRanks((prev) =>
      prev.includes(rank) ? prev.filter((r) => r !== rank) : [...prev, rank]
    );
    // Fetch prediction if not already loaded
    if (userId && !userPredictions[userId]) {
      if (tournament?.id) {
        tournamentService.getUserPrediction(tournament.id, userId).then((pred) => {
          setUserPredictions((prev) => ({ ...prev, [userId]: pred }));
        });
      }
    } else if (!userId && username && !Object.values(userPredictions).find(p => p?.profiles?.display_name === username)) {
      if (tournament?.id) {
        tournamentService.getPredictionsForTournament(tournament.id).then((allPreds) => {
          const match = allPreds.find((p) => p.profiles && p.profiles.display_name === username);
          if (match) setUserPredictions((prev) => ({ ...prev, [username]: match }));
        });
      }
    }
  }

  // State for all predictions (for predictors list)
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);

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
        let tournamentResultLocal: any = null; // To store the actual results
        try {
          if (process.env.NEXT_PUBLIC_USE_BACKEND_API === 'true') {
            const response = await fetch(`/api/tournaments/${currentTournament.id}/results`);
            if (response.ok) {
              const resultsData = await response.json();
              tournamentHasResults = !!(resultsData.results && Object.keys(resultsData.results).length > 0);
              tournamentResultLocal = resultsData.results;
            }
          } else {
            const { data: results, error } = await supabase
              .from('results')
              .select('*')
              .eq('tournament_id', currentTournament.id)
              .limit(1);
            
            tournamentHasResults = !error && results && results.length > 0;
            if (results && results.length > 0) {
              tournamentResultLocal = results[0];
            }
          }
        } catch (error) {
          console.error('Error checking results:', error);
        }

        setHasResults(tournamentHasResults);
        setTournamentResult(tournamentResultLocal);

        // Fetch leaderboard data
        const leaderboardData = await tournamentService.getLeaderboard(currentTournament.id);
        setLeaderboard(leaderboardData);
        // Fetch all participants for mapping IDs to names
        const participantsData = await tournamentService.getTournamentParticipants(currentTournament.id);
        setParticipants(participantsData);
        // Fetch all predictions for predictors list
        const predictions = await tournamentService.getPredictionsForTournament(currentTournament.id);
        setAllPredictions(predictions);
        // Populate userPredictions for all leaderboard users (including 1st place)
        const userPreds: Record<string, Prediction | null> = {};
        for (const entry of leaderboardData) {
          let pred: Prediction | null = null;
          if (entry.userId) {
            pred = await tournamentService.getUserPrediction(currentTournament.id, entry.userId);
          }
          if (!pred && predictions.length > 0) {
            pred = predictions.find((p: Prediction) => p.profiles && p.profiles.display_name && p.profiles.display_name === entry.username) || null;
          }
          if (entry.userId) {
            userPreds[entry.userId] = pred;
          } else if (entry.username) {
            userPreds[entry.username] = pred;
          }
        }
        setUserPredictions(userPreds);

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

  // Helper to get participant name by ID
  function getParticipantName(id: string) {
    const p = participants.find((x: Participant) => x.id === id);
    return p ? p.name : "?";
  }

  // Helper to format full timestamp with month, day, and time
  function formatFullTimestamp(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  }

  // Helper to format time only (HH:mm:ss)
  function formatTimeOnly(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  }

  // Sort predictions by most recent submission (descending)
  const predictorsList = (tournament && isTournamentPending(tournament, hasResults))
    ? allPredictions
        .filter(p => p && p.created_at)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white px-2 py-4">
      <div className="max-w-6xl mx-auto">
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
        
        <div className="mb-6 text-center">
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] font-black font-quicksand gradient-rotate gradient-text-fix leading-tight whitespace-nowrap drop-shadow-[0_0_10px_rgba(0,172,78,0.8)] mb-0 text-green-400">Leaderboard</h1>
          <h2 className="text-2xl font-bold mb-2 text-white -mt-2">{tournamentTitle}</h2>
        </div>

        {/* Community Favorites Section (Pending Phase Only) */}
        {showCommunityFavorites && (
          <Card className="bg-black/70 border-yellow-600/50 rounded-lg shadow-xl overflow-hidden mb-6">
            <CardHeader className="border-b border-yellow-700/50 py-3">
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

        {/* Predictors List for Results Pending State */}
        {tournament && isTournamentPending(tournament, hasResults) ? (
          <Card className="bg-black/70 border-gray-800 rounded-lg shadow-xl overflow-hidden">
            <CardHeader className="border-b border-gray-700/50 py-3">
              <CardTitle className="text-white w-full flex justify-center items-center">
                <span className="text-green-400 text-xl font-bold text-center w-full block">Predictors</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-3 px-2">
              {isLoading ? (
                <div className="text-center py-10 text-lg text-gray-400">Loading Predictors...</div>
              ) : predictorsList.length > 0 ? (
                <ol className="space-y-2">
                  {predictorsList.map((prediction, idx) => {
                    const displayName = prediction.profiles?.display_name || "";
                    const isExpanded = expandedRanks.includes(idx);
                    return (
                      <li
                        key={prediction.id || idx}
                        className={
                          isExpanded
                            ? `grid grid-cols-[1fr_auto] items-center w-full pl-1 pr-1 py-3 mb-2 transition-all duration-200 rounded-lg border-2 border-green-400 bg-green-900/10 shadow-lg cursor-pointer`
                            : `grid grid-cols-[1fr_auto] items-center w-full pl-1 pr-1 py-2 transition-all duration-200 rounded-lg bg-gray-900/50 hover:bg-gray-800/70 hover:shadow-md border-l-4 border-l-green-400 cursor-pointer group`
                        }
                        onClick={() => setExpandedRanks((prev) => prev.includes(idx) ? prev.filter((r) => r !== idx) : [...prev, idx])}
                      >
                        <div className={isExpanded ? "flex items-center gap-4" : "flex items-center gap-2"}>
                          <div className="flex-shrink-0">
                            <h3 className={`font-bold ${isExpanded ? "text-xl sm:text-2xl md:text-3xl" : "text-lg sm:text-xl md:text-2xl"} truncate text-white`}>
                              {formatNameShort(displayName)}
                            </h3>
                          </div>
                        </div>
                        <div className="text-right min-w-[80px] flex items-center justify-end gap-2">
                          {!isExpanded && (
                            <span className="font-mono text-base text-gray-300">{formatTimeOnly(prediction.created_at)}</span>
                          )}
                          <svg 
                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        {isExpanded && (
                          <div className="col-span-2 flex-1 flex-col">
                            <div className="text-base md:text-lg mt-1 text-white flex flex-wrap items-center gap-x-1 gap-y-1">
                              <span className="whitespace-nowrap">{getParticipantName(prediction.slot_1_participant_id)}</span>
                              <span className="text-green-400 mx-1">&gt;</span>
                              <span className="whitespace-nowrap">{getParticipantName(prediction.slot_2_participant_id)}</span>
                              <span className="text-green-400 mx-1">&gt;</span>
                              <span className="whitespace-nowrap">{getParticipantName(prediction.slot_3_participant_id)}</span>
                              <span className="text-green-400 mx-1">&gt;</span>
                              <span className="whitespace-nowrap">{getParticipantName(prediction.slot_4_participant_id)}</span>
                              {formatBonusPredictions(prediction.bracket_reset, prediction.grand_finals_score, prediction.winners_final_score, prediction.losers_final_score) && (
                                <span className="text-green-400">{formatBonusPredictions(prediction.bracket_reset, prediction.grand_finals_score, prediction.winners_final_score, prediction.losers_final_score)}</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-2 font-mono">
                              Submitted: {formatFullTimestamp(prediction.created_at)}
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="text-center py-10 text-lg text-gray-400">
                  No predictions submitted yet.
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Default Leaderboard Section (after results) */
          <Card className="bg-black/70 border-gray-800 rounded-lg shadow-xl overflow-hidden">
            <CardHeader className="border-b border-gray-700/50 py-3">
              <CardTitle className="text-white w-full flex justify-center items-center">
                <span className="text-green-400 text-xl font-bold text-center w-full block">🏆 Top Predictors</span>
              </CardTitle>
              {/* Toggle button for actual results */}
              {hasResults && tournament && (
                <div className="w-full flex justify-center mt-2">
                  <button
                    className="px-3 py-1 rounded bg-gray-800 text-green-200 hover:bg-gray-700 transition text-sm font-medium border border-green-700"
                    onClick={() => setShowResults((prev) => !prev)}
                  >
                    {showResults ? "Hide Results" : "Show Results"}
                  </button>
                </div>
              )}
              {/* Show actual results if available */}
              {hasResults && tournament && showResults && (
                <div className="mt-2 text-base md:text-lg text-white flex flex-wrap items-center gap-x-1 gap-y-1">
                  {(() => {
                    // Find the participant names for the actual results
                    const getName = (id: string) => {
                      const p = participants.find((x) => x.id === id);
                      return p ? p.name : "?";
                    };
                    const ids = [
                      tournamentResult?.position_1_participant_id,
                      tournamentResult?.position_2_participant_id,
                      tournamentResult?.position_3_participant_id,
                      tournamentResult?.position_4_participant_id,
                    ].filter(Boolean);
                    const resultString = ids.map((id, idx) => (
                      <>
                        <span className="whitespace-nowrap" key={"result-"+id}>{getName(id as string)}</span>
                        {idx < ids.length - 1 && <span className="text-yellow-400 mx-1">&gt;</span>}
                      </>
                    ));
                    
                    // Add bonus information if available
                    const bonusString = formatBonusPredictions(
                      tournamentResult?.bracket_reset,
                      tournamentResult?.grand_finals_score,
                      tournamentResult?.winners_final_score,
                      tournamentResult?.losers_final_score
                    );
                    
                    return (
                      <>
                        {resultString}
                        {bonusString && (
                          <span className="text-yellow-400">{bonusString}</span>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </CardHeader>
            <CardContent className="py-3 px-2">
              {isLoading ? (
                <div className="text-center py-10 text-lg text-gray-400">Loading Leaderboard...</div>
              ) : leaderboard.length > 0 ? (
                <ol className="space-y-2">
                  {leaderboard.map((player) => {
                    const isExpanded = expandedRanks.includes(player.rank);
                    const userId = player.userId;
                    const username = player.username;
                    const prediction = userId ? userPredictions[userId] : userPredictions[username];
                    return (
                      <li
                        key={userId || username}
                        className={
                          isExpanded
                            ? `grid grid-cols-[1fr_auto] items-center w-full pl-1 pr-1 py-3 mb-2 transition-all duration-200 rounded-lg shadow-lg cursor-pointer border-l-8 ${player.rank === 1 ? 'border-l-yellow-400 border-t-yellow-400 border-r-yellow-400 border-b-yellow-400 border-2' : player.rank === 2 ? 'border-l-gray-300 border-t-gray-300 border-r-gray-300 border-b-gray-300 border-2' : player.rank === 3 ? 'border-l-amber-600 border-t-amber-600 border-r-amber-600 border-b-amber-600 border-2' : 'border-l-gray-700 border-t-gray-700 border-r-gray-700 border-b-gray-700 border-2'} bg-yellow-900/10`
                            : `grid grid-cols-[1fr_auto] items-center w-full pl-1 pr-1 py-2 transition-all duration-200 rounded-lg ${getRankColor(player.rank)} hover:bg-gray-800/70 hover:shadow-md border-l-8 ${player.rank === 1 ? 'border-l-yellow-400' : player.rank === 2 ? 'border-l-gray-300' : player.rank === 3 ? 'border-l-amber-600' : 'border-l-gray-700'} cursor-pointer group`
                        }
                        onClick={() => toggleExpand(player.rank, userId, username)}
                      >
                        <div className={isExpanded ? "flex items-center gap-4" : "flex items-center gap-2"}>
                          <div className={isExpanded ? "w-12 text-center flex items-center justify-center flex-shrink-0" : "w-10 text-center flex items-center justify-center flex-shrink-0"}>
                            {getRankIcon(player.rank)}
                          </div>
                          <div className={isExpanded ? "flex-shrink-0" : "flex-shrink-0"}>
                            <div className={isExpanded ? "flex items-center gap-2" : "flex items-center gap-1"}>
                              <h3 className={`font-bold ${isExpanded ? "text-xl sm:text-2xl md:text-3xl" : "text-lg sm:text-xl md:text-2xl"} truncate ${player.rank === 1 ? 'text-yellow-400' : player.rank === 2 ? 'text-gray-300' : player.rank === 3 ? 'text-amber-600' : 'text-white'}`}>
                                {formatNameShort(player.username)}
                              </h3>
                            </div>
                          </div>
                        </div>
                        <div className="text-right min-w-[80px] flex items-center justify-end gap-2">
                          <span className={`font-bold ${isExpanded ? "text-2xl" : "text-lg sm:text-xl md:text-2xl"} ${player.rank === 1 ? 'text-yellow-400' : player.rank === 2 ? 'text-gray-300' : player.rank === 3 ? 'text-amber-600' : 'text-white'}`}>{player.points}</span>
                          <span className={`ml-1 ${isExpanded ? "text-sm text-yellow-200" : "text-xs sm:text-sm " + (player.rank === 1 ? 'text-yellow-200' : player.rank === 2 ? 'text-gray-300' : player.rank === 3 ? 'text-amber-600' : 'text-gray-300')}`}>pts</span>
                          <svg 
                            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${player.rank === 1 ? 'text-yellow-400' : player.rank === 2 ? 'text-gray-300' : player.rank === 3 ? 'text-amber-600' : 'text-gray-400'}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        {isExpanded && (
                          <div className="col-span-2 flex-1 flex-col">
                            {prediction ? (
                              <>
                                <div className="text-base md:text-lg mt-1 text-white flex flex-wrap items-center gap-x-1 gap-y-1">
                                  <span className="whitespace-nowrap">{getParticipantName(prediction.slot_1_participant_id)}</span>
                                  <span className="text-yellow-400 mx-1">&gt;</span>
                                  <span className="whitespace-nowrap">{getParticipantName(prediction.slot_2_participant_id)}</span>
                                  <span className="text-yellow-400 mx-1">&gt;</span>
                                  <span className="whitespace-nowrap">{getParticipantName(prediction.slot_3_participant_id)}</span>
                                  <span className="text-yellow-400 mx-1">&gt;</span>
                                  <span className="whitespace-nowrap">{getParticipantName(prediction.slot_4_participant_id)}</span>
                                  {formatBonusPredictions(prediction.bracket_reset, prediction.grand_finals_score, prediction.winners_final_score, prediction.losers_final_score) && (
                                    <span className="text-yellow-400">{formatBonusPredictions(prediction.bracket_reset, prediction.grand_finals_score, prediction.winners_final_score, prediction.losers_final_score)}</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400 mt-2 font-mono">
                                  Submitted: {formatFullTimestamp(prediction.created_at)}
                                </div>
                              </>
                            ) : (
                              <div className="text-yellow-200 text-xs mt-1">Picks unavailable</div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="text-center py-10 text-lg text-gray-400">
                  {showCommunityFavorites 
                    ? "Leaderboard will appear once tournament results are posted!"
                    : "No leaderboard data available yet. Check back after the tournament is complete!"
                  }
                </div>
              )}
              
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
