"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Slots from "@/components/Prediction/Slots";

// Player data for Guilty Gear Strive
const ALL_PLAYERS = [
  "Sol Badguy", "Ky Kiske", "May", "Axl Low", "Chipp Zanuff",
  "Potemkin", "Faust", "Millia Rage", "Zato-1", "Ramlethal",
  "Leo Whitefang", "Nagoriyuki", "Giovanna", "Anji Mito", "I-No",
  "Goldlewis Dickinson", "Jack-O'", "Happy Chaos", "Baiken", "Testament"
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
    alert("Predictions submitted successfully!");
  };

  const availablePlayers = ALL_PLAYERS.filter(
    (player) => !predictions.includes(player)
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-black">
      {/* Background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        <div className="absolute -left-40 -top-40 w-96 h-96 bg-blue-500/10 filter blur-3xl animate-pulse"></div>
        <div className="absolute -right-40 -bottom-40 w-96 h-96 bg-green-500/10 filter blur-3xl animate-pulse animation-delay-2000"></div>
      </div>
      
      {/* Back Button */}
      <div className="w-full max-w-4xl mx-auto mb-6">
        <Link 
          href={`/?game=ggst`}
          className="inline-flex items-center text-gray-300 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>

      <div className="w-full max-w-2xl mb-8 text-center">
        <div className="w-full">
          <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text gradient-rotate mb-2 mx-auto" 
            style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>
            Bracket Master
          </h1>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-4 w-full">
          Guilty Gear Strive
        </h2>
        <p className="text-xl text-gray-300 mb-8 w-full">
          Predict the top 4 players!
        </p>
      </div>

      {/* Prediction Slots */}
      <div className="w-full max-w-2xl mb-8">
        <Slots 
          predictions={predictions}
          onSlotFill={handleSlotFill}
          onSlotClear={handleSlotClear}
          availablePlayers={availablePlayers}
        />
      </div>

      {/* Submit Button */}
      <div className="w-full max-w-2xl mb-12">
        <Button
          onClick={handleSubmit}
          disabled={!isComplete}
          className={`relative w-full py-6 text-2xl font-bold overflow-hidden transition-all duration-300 transform gradient-rotate ${
            isComplete 
              ? 'hover:scale-[1.02] hover:shadow-2xl' 
              : 'opacity-50 cursor-not-allowed'
          }`}
          style={{
            boxShadow: isComplete 
              ? '0 10px 25px -5px rgba(0, 172, 78, 0.4)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
            {isComplete ? (
              <>
                <span>Submit Predictions</span>
                <span className="text-yellow-300">🏆</span>
              </>
            ) : (
              'Select All Players to Continue'
            )}
          </span>
          {isComplete && (
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          )}
        </Button>
      </div>

      {/* Available Players */}
      <div className="w-full max-w-2xl">
        <div className="bg-black/70 backdrop-blur-sm p-6 border border-gray-800 rounded-none">
          <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text gradient-rotate" 
            style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>
            Available Players
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {availablePlayers.length > 0 ? (
              availablePlayers.map((player, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const firstEmptyIndex = predictions.findIndex(p => p === "");
                    if (firstEmptyIndex !== -1) {
                      handleSlotFill(firstEmptyIndex, player);
                    }
                  }}
                  className="px-4 py-2 bg-gray-900/80 hover:bg-gray-800/80 text-base text-white font-medium shadow-sm transition-colors border border-gray-800 rounded-none"
                >
                  {player}
                </button>
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
