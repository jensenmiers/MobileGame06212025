'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTournamentById } from '@/lib/tournament-utils';
import type { Tournament } from '@/types/tournament';

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  rank: number;
  accuracy: number;
  predictions: number;
}

interface PageProps {
  params: {
    gameId: string;
  };
}

export default function LeaderboardPage({ params }: PageProps) {
  const tournament = getTournamentById(params.gameId);
  
  if (!tournament) {
    notFound();
  }

  // Mock leaderboard data - in a real app, this would come from your database
  const leaderboardData: LeaderboardEntry[] = [
    { 
      id: '1', 
      name: 'PlayerOne', 
      score: 1250, 
      rank: 1,
      accuracy: 92,
      predictions: 42
    },
    { 
      id: '2', 
      name: 'PredictionMaster', 
      score: 1175, 
      rank: 2,
      accuracy: 88,
      predictions: 38
    },
    { 
      id: '3', 
      name: 'ESportsFan42', 
      score: 1090, 
      rank: 3,
      accuracy: 85,
      predictions: 35
    },
    { 
      id: '4', 
      name: 'FightGamePro', 
      score: 980, 
      rank: 4,
      accuracy: 82,
      predictions: 31
    },
    { 
      id: '5', 
      name: 'TourneyChamp', 
      score: 875, 
      rank: 5,
      accuracy: 79,
      predictions: 28
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-4xl mx-auto p-4">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-gray-300 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
            {tournament.name} Leaderboard
          </h1>
          <p className="text-gray-300">Top predictors for the {tournament.name} tournament</p>
        </div>

        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Top Predictors</h2>
            <div className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
          
          <div className="space-y-4">
            {leaderboardData.map((entry) => (
              <div 
                key={entry.id} 
                className="flex items-center p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/80 transition-colors"
              >
                <div className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-full font-bold text-lg">
                  {entry.rank}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">{entry.name}</h3>
                  <p className="text-sm text-gray-400">Score: {entry.score}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">
                    Accuracy: {Math.min(95, 60 + Math.floor(Math.random() * 35))}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.floor(Math.random() * 50) + 10} predictions
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-800 text-center">
            <Link 
              href={`/predict/${tournament.id}`}
              className="inline-block px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-md font-medium transition-colors"
            >
              Make Your Predictions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
