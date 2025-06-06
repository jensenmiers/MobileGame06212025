"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholder data for the leaderboard - will be replaced with Supabase data in Phase 3
const leaderboardData = [
  { username: "ProGamer2024", points: 85, rank: 1 },
  { username: "BracketMaster", points: 78, rank: 2 },
  { username: "PredictionKing", points: 72, rank: 3 },
  { username: "GameChanger", points: 68, rank: 4 },
  { username: "TourneyPro", points: 65, rank: 5 },
  { username: "SkillzGamer", points: 61, rank: 6 },
  { username: "ElitePlayer", points: 58, rank: 7 },
  { username: "ChampionX", points: 55, rank: 8 },
  { username: "VictorySeeker", points: 52, rank: 9 },
  { username: "TopTierGamer", points: 49, rank: 10 }
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return "🥇";
    case 2: return "🥈";
    case 3: return "🥉";
    default: return `#${rank}`;
  }
};

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1: return "bg-yellow-500/20 border-yellow-400";
    case 2: return "bg-gray-400/20 border-gray-300";
    case 3: return "bg-orange-500/20 border-orange-400";
    default: return "bg-blue-500/20 border-blue-400";
  }
};

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
          <p className="text-gray-400">See how you rank against other bracket masters</p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              🏆 Top Players
              <span className="text-sm text-gray-400 font-normal">(Live Rankings)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {leaderboardData.map((player) => (
                <li
                  key={player.rank}
                  className={`
                    flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200
                    ${getRankColor(player.rank)}
                    hover:scale-[1.02] hover:shadow-lg
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl min-w-[3rem] text-center">
                      {getRankIcon(player.rank)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-white">
                        {player.username}
                      </h3>
                      <p className="text-sm text-gray-300">
                        Rank #{player.rank}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {player.points}
                    </div>
                    <div className="text-sm text-gray-300">
                      points
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            
            <div className="mt-8 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
              <p className="text-sm text-gray-300 text-center">
                🔄 Leaderboard updates automatically after each tournament round
              </p>
              <p className="text-xs text-gray-400 text-center mt-1">
                Data will be fetched from Supabase in Phase 3
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 