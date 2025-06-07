"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Slots from '@/components/Prediction/Slots';

// Player data - this would typically come from an API
const ALL_PLAYERS = [
  "Alex Thunder", "Blaze Storm", "Cyber Knight", "Dragon Fire",
  "Echo Phantom", "Frost Bite", "Ghost Rider", "Hunter X",
  "Ice Phoenix", "Jet Stream", "King Cobra", "Lightning Bolt",
  "Mystic Wolf", "Nova Star", "Omega Force", "Phoenix Rising"
];

export default function PredictionPage() {
  const [predictions, setPredictions] = useState<string[]>(Array(4).fill(""));
  const isComplete = predictions.every(prediction => prediction !== "");

  const handleSlotFill = (slotIndex: number, player: string) => {
    const newPredictions = [...predictions];
    newPredictions[slotIndex] = player;
    setPredictions(newPredictions);
  };

  const handleSlotClear = (slotIndex: number) => {
    const newPredictions = [...predictions];
    newPredictions[slotIndex] = "";
    setPredictions(newPredictions);
  };

  const handleSubmit = () => {
    console.log("Submitting predictions:", predictions);
    alert("Predictions submitted successfully! ");
  };

  const availablePlayers = ALL_PLAYERS.filter(
    (player) => !predictions.includes(player)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute -left-20 -top-20 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-gradient-radial from-blue-400/10 to-transparent rounded-full"></div>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto py-12 px-4 sm:px-6">
        {/* Back Button */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center group transition-all duration-200 hover:bg-gray-800/50 rounded-lg px-4 py-2 -ml-4"
          >
            <div className="flex items-center text-gray-300 group-hover:text-white">
              <svg 
                className="w-6 h-6 mr-2 group-hover:-translate-x-1 transition-transform duration-200" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              <span className="text-lg font-medium">Back to Home</span>
            </div>
          </Link>
        </div>

        <div className="text-center mb-12 transform transition-all duration-500 hover:scale-105">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 sm:text-6xl mb-4">
            Predict the Winners
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Select your top 4 players in order of how you think they'll finish
          </p>
        </div>

        <div className="relative space-y-6 backdrop-blur-sm bg-gray-900/30 rounded-2xl p-6 border border-gray-700/50 shadow-xl">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
          
          <Slots 
            predictions={predictions}
            onSlotFill={handleSlotFill}
            onSlotClear={handleSlotClear}
            availablePlayers={availablePlayers}
          />

          <div className="mt-12 flex justify-center transform transition-transform duration-300 hover:scale-105">
            <button
              onClick={handleSubmit}
              disabled={!isComplete}
              className={`
                relative px-10 py-5 rounded-full text-xl font-bold transition-all duration-300 transform
                ${isComplete 
                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 hover:from-blue-600 hover:via-purple-600 hover:to-blue-700 hover:scale-110 shadow-2xl hover:shadow-blue-500/40' 
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border-2 border-dashed border-gray-700'}
                overflow-hidden group
              `}
            >
              <span className="relative z-10 flex items-center gap-2">
                {isComplete ? (
                  <>
                    <span className="text-white">Submit Predictions</span>
                    <span className="text-yellow-300">🏆</span>
                  </>
                ) : (
                  'Select All Players to Continue'
                )}
              </span>
              {isComplete && (
                <span className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-transparent to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              )}
            </button>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-gray-200">Available Players</h3>
          <div className="flex flex-wrap gap-3">
            {availablePlayers.length > 0 ? (
              availablePlayers.map((player, index) => (
                <span 
                  key={index}
                  className="px-4 py-2 bg-gray-700/70 rounded-md text-base text-white font-medium shadow-sm hover:bg-gray-600/70 transition-colors"
                >
                  {player}
                </span>
              ))
            ) : (
              <p className="text-gray-300 italic text-lg">All players have been placed in the bracket</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}