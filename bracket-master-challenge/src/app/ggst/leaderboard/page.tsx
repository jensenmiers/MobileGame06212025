"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholder data for the GGST leaderboard
const leaderboardData = [
  { username: "SolBadguyMain", points: 95, rank: 1 },
  { username: "KyMainFTW", points: 88, rank: 2 },
  { username: "MayPlayer", points: 82, rank: 3 },
  { username: "AxlPlayer", points: 79, rank: 4 },
  { username: "ChippZanuff", points: 76, rank: 5 },
  { username: "PotemkinBuster", points: 73, rank: 6 },
  { username: "FaustMain", points: 70, rank: 7 },
  { username: "MilliaPlayer", points: 67, rank: 8 },
  { username: "ZatoPlayer", points: 64, rank: 9 },
  { username: "RamlethalMain", points: 61, rank: 10 }
];

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

const getMedalStyle = (rank: number) => {
  switch(rank) {
    case 1: 
      return 'brightness(0) saturate(100%) invert(83%) sepia(59%) saturate(1031%) hue-rotate(327deg) brightness(102%) contrast(97%)';
    case 2:
      return 'brightness(0) saturate(100%) invert(94%) sepia(0%) saturate(0%) hue-rotate(10deg) brightness(90%) contrast(90%)';
    case 3:
      return 'brightness(0) saturate(100%) invert(65%) sepia(60%) saturate(600%) hue-rotate(340deg) brightness(90%) contrast(90%)';
    default:
      return '';
  }
};

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="w-full mb-6">
          <Link 
            href="/?game=ggst" 
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
          <h2 className="text-2xl font-bold mb-2">Guilty Gear Strive</h2>
          <p className="text-gray-300">See how you rank against other bracket masters</p>
        </div>

        <Card className="bg-black border border-gray-800 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-gray-700/50">
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-green-500">🏆 Top Players</span>
              <span className="text-sm text-green-200/80 font-normal">(Live Rankings)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {leaderboardData.map((player) => (
                <li
                  key={player.rank}
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
                        {(player.rank === 1 || player.rank === 2 || player.rank === 3) && (
                          <div className="relative h-6 w-6">
                            <img 
                              src="/images/fullComboLogo.png" 
                              alt="" 
                              className="h-full w-full object-contain"
                              style={{
                                filter: getMedalStyle(player.rank),
                                transform: 'translateY(1px)'
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        Rank #{player.rank}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      player.rank === 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-green-500' : 
                      'text-white'
                    }`}>
                      {player.points}
                    </div>
                    <div className={`text-sm ${player.rank === 1 ? 'text-green-200' : 'text-gray-300'}`}>
                      points
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            
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
