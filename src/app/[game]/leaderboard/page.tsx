"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { gameUiDetailsMap } from "@/lib/game-utils";
import { tournamentService } from "@/lib/tournament-service";
import { LeaderboardEntry } from "@/types/tournament";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tournamentTitle, setTournamentTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const params = useParams();
  const gameSlug = params.game as string;

  const tournamentName = Object.keys(gameUiDetailsMap).find(
    key => gameUiDetailsMap[key].slug === gameSlug
  );

  const fetchLeaderboard = async () => {
    if (!tournamentName) return;

    try {
      const tournaments = await tournamentService.getTournaments();
      const currentTournament = tournaments.find(t => t.name === tournamentName);

      if (currentTournament) {
        const leaderboardData = await tournamentService.getLeaderboard(currentTournament.id);
        setLeaderboard(leaderboardData);
        setLastUpdated(new Date());
      } else {
        console.error(`${tournamentName} tournament not found.`);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!tournamentName) {
      return notFound();
    }
    setTournamentTitle(tournamentName);

    // Initial fetch
    fetchLeaderboard();

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);

    return () => clearInterval(interval);
  }, [gameSlug, tournamentName]);

  if (!tournamentName) {
    return null;
  }

  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  const getRankColorClass = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-100";
      case 2:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-gray-100";
      case 3:
        return "bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100";
      default:
        return "bg-gray-700 text-gray-200";
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-black">
      {/* Background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        <div className="absolute -left-40 -top-40 w-96 h-96 bg-purple-500/10 filter blur-3xl animate-pulse"></div>
        <div className="absolute -right-40 -bottom-40 w-96 h-96 bg-blue-500/10 filter blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Back Button */}
      <div className="w-full max-w-4xl mx-auto mb-6">
        <Link 
          href={`/?game=${gameSlug}`}
          className="inline-flex items-center text-gray-300 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>

      {/* Header */}
      <div className="w-full max-w-4xl mb-8 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text gradient-rotate mb-2"
          style={{
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
          Leaderboard
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          {tournamentTitle}
        </h2>
        
        {lastUpdated && (
          <p className="text-sm text-gray-400 mb-4">
            Last updated: {lastUpdated.toLocaleTimeString()}
            <span className="ml-2 text-xs opacity-70">(Updates every 30s)</span>
          </p>
        )}
      </div>

      {/* Leaderboard Content */}
      <div className="w-full max-w-4xl">
        <Card className="bg-black/70 backdrop-blur-sm border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-white">
              Tournament Rankings
            </CardTitle>
            <p className="text-center text-gray-400">
              Points are earned from predictions in both cutoff periods
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Results Yet</h3>
                <p className="text-gray-500">
                  The leaderboard will appear once tournament results are entered.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
                      entry.rank <= 3 
                        ? 'border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-transparent' 
                        : 'border-gray-700 bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${getRankColorClass(entry.rank)}`}>
                        {getRankDisplay(entry.rank)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {entry.username}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {entry.points} point{entry.points !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {entry.rank <= 3 && (
                        <div className="text-2xl">
                          {entry.rank === 1 && "👑"}
                          {entry.rank === 2 && "⭐"}
                          {entry.rank === 3 && "🎯"}
                        </div>
                      )}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">
                          {entry.points}
                        </div>
                        <div className="text-xs text-gray-500">
                          points
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="mt-8 bg-black/50 backdrop-blur-sm p-4 border border-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">Scoring System</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-yellow-400 font-bold text-lg">10 pts</div>
              <div className="text-gray-400">1st Place</div>
            </div>
            <div className="text-center">
              <div className="text-gray-300 font-bold text-lg">7 pts</div>
              <div className="text-gray-400">2nd Place</div>
            </div>
            <div className="text-center">
              <div className="text-amber-400 font-bold text-lg">5 pts</div>
              <div className="text-gray-400">3rd Place</div>
            </div>
            <div className="text-center">
              <div className="text-blue-400 font-bold text-lg">3 pts</div>
              <div className="text-gray-400">4th Place</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Points are awarded for each correct prediction in both cutoff periods
          </p>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link 
            href={`/${gameSlug}/prediction`}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Make Predictions
          </Link>
        </div>
      </div>
    </div>
  );
}
