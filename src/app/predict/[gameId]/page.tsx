'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { getTournamentById } from '@/lib/tournament-utils';
import type { Tournament, Player } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Using inline Badge component to avoid import issues
const Badge = ({ className, variant, children, ...props }: any) => (
  <span 
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    {...props}
  >
    {children}
  </span>
);

interface PageProps {
  params: {
    gameId: string;
  };
}

export default function PredictionPage({ params }: PageProps) {
  const tournament = getTournamentById(params.gameId);
  
  if (!tournament) {
    notFound();
  }

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlayer) {
      const player = tournament.players?.find(p => p.id === selectedPlayer);
      if (player) {
        alert(`Prediction submitted for ${player.name}!`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-4xl mx-auto p-4">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-gray-300 hover:text-white transition-colors group">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 mr-2 group-hover:-translate-x-1 transition-transform" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-green-600">
            {tournament.name} Predictions
          </h1>
          <p className="text-gray-300">Make your predictions for the {tournament.name} tournament</p>
        </div>

        <Card className="bg-black/50 backdrop-blur-sm border border-gray-800 shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-gray-700/50 bg-gradient-to-r from-gray-900/50 to-black/30">
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-green-500">🏆 Select Winners</span>
              <Badge variant="outline" className="bg-green-900/20 border-green-800/50 text-green-300">
                Round 1 of 4
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Predict the winner for each match-up
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="space-y-4">
              {tournament.players?.map((player, index: number) => (
                <div 
                  key={player.id} 
                  className={`
                    flex items-center p-4 rounded-lg transition-all duration-200
                    ${selectedPlayer === player.id 
                      ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/20 border-l-4 border-green-500' 
                      : 'bg-gray-900/50 hover:bg-gray-800/50 border-l-4 border-transparent'}
                  `}
                  onClick={() => setSelectedPlayer(player.id === selectedPlayer ? null : player.id)}
                >
                  <div className="w-10 text-gray-400 font-mono font-bold text-lg">
                    {index + 1}.
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{player.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-gray-800/50 border-gray-700 text-gray-300">
                        Seed #{player.seed}
                      </Badge>
                      {selectedPlayer === player.id && (
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                          Your Pick
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-800 text-gray-300">
                      {Math.floor(Math.random() * 30) + 70}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-800 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                {selectedPlayer ? (
                  <span>Selected: <span className="text-green-400 font-medium">
                    {tournament.players?.find(p => p.id === selectedPlayer)?.name}
                  </span></span>
                ) : (
                  <span>Select a player to predict the winner</span>
                )}
              </div>
              <Button 
                onClick={handleSubmit}
                disabled={!selectedPlayer}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg font-medium transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-green-500/20 disabled:opacity-50 disabled:pointer-events-none"
              >
                Submit Prediction
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
