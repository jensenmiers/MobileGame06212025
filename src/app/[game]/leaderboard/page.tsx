"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { gameUiDetailsMap } from "@/lib/game-utils";
import { tournamentService } from "@/lib/tournament-service";
import { LeaderboardEntry } from "@/types/tournament";

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return <span className="text-3xl">🥇</span>;
    case 2: return <span className="text-3xl">🥈</span>;
    case 3: return <span className="text-3xl">🥉</span>;
    default: return (
      <span className="text-gray-200 text-2xl">
        {rank}
      </span>
    );
  }
};

const getRankColor = (rank: number) => {
  return "bg-gray-900/50 hover:bg-gray-800/50";
};

export default function LeaderboardPage() {
  const [tournamentTitle, setTournamentTitle] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const gameSlug = params.game as string;

  const tournamentName = Object.keys(gameUiDetailsMap).find(
    key => gameUiDetailsMap[key].slug === gameSlug
  );

  useEffect(() => {
    if (!tournamentName) {
      return notFound();
    }
    setTournamentTitle(tournamentName);

    const fetchLeaderboard = async () => {
      setIsLoading(true);
      const tournaments = await tournamentService.getTournaments();
      const currentTournament = tournaments.find(t => t.name === tournamentName);

      if (currentTournament) {
        const data = await tournamentService.getLeaderboard(currentTournament.id);
        setLeaderboard(data);
      } else {
        console.error(`${tournamentName} tournament not found.`);
      }
      setIsLoading(false);
    };

    fetchLeaderboard();
  }, [gameSlug, tournamentName]);

  if (!tournamentName) {
    return null; // Should be handled by notFound()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="w-full mb-6">
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
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-green-600">Leaderboard</h1>
          <h2 className="text-2xl font-bold mb-2">{tournamentTitle}</h2>
                          <p className="text-gray-300">See how you rank against other bracket wizards</p>
        </div>

        <Card className="bg-black border border-gray-800 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-gray-700/50">
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-green-500">🏆 Top Players</span>
              <span className="text-sm text-green-200/80 font-normal">(Live Rankings)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-10 text-lg text-gray-400">Loading Leaderboard...</div>
            ) : leaderboard.length > 0 ? (
              <ol className="space-y-4">
                {leaderboard.map((player) => (
                  <li
                    key={player.userId}
                    className={`
                      flex items-center justify-between p-4 transition-all duration-200
                      ${getRankColor(player.rank)}
                      hover:bg-gray-800/70
                      border-l-4 ${
                        player.rank === 1 ? 'border-l-amber-400' : 
                        player.rank === 2 ? 'border-l-gray-300' :
                        player.rank === 3 ? 'border-l-amber-600' :
                        'border-l-gray-700'
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className="min-w-[3rem] text-center flex items-center justify-center">
                        {getRankIcon(player.rank)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold text-2xl ${player.rank === 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-green-500' : 'text-white'}`}>
                            {player.username}
                          </h3>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${player.rank === 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-green-500' : 'text-white'}`}>
                        {player.points}
                      </div>
                      <div className={`text-sm ${player.rank === 1 ? 'text-green-200' : 'text-gray-300'}`}>
                        points
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-center py-10 text-lg text-gray-400">No leaderboard data available yet. Check back after the tournament is complete!</div>
            )}
            
            <div className="mt-8 p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/10 border border-green-800/30 rounded-lg">
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
