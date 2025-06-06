"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AllPlayers from "@/components/Prediction/AllPlayers";
import Slots from "@/components/Prediction/Slots";

export default function PredictionPage() {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<string[]>(Array(8).fill(""));

  const handlePlayerSelect = (player: string) => {
    setSelectedPlayer(player);
  };

  const handleSlotFill = (slotIndex: number) => {
    if (selectedPlayer && !predictions[slotIndex]) {
      const newPredictions = [...predictions];
      newPredictions[slotIndex] = selectedPlayer;
      setPredictions(newPredictions);
      setSelectedPlayer(null);
    }
  };

  const handleSlotClear = (slotIndex: number) => {
    const newPredictions = [...predictions];
    newPredictions[slotIndex] = "";
    setPredictions(newPredictions);
  };

  const isSubmitEnabled = predictions.every(prediction => prediction !== "");

  const handleSubmit = () => {
    if (isSubmitEnabled) {
      console.log("Submitting predictions:", predictions);
      // TODO: Implement actual submission in Phase 4
      alert("Predictions submitted! (Backend integration coming in Phase 4)");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Make Your Predictions</h1>
          <p className="text-gray-400">Select players for each position in your bracket</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - All Players */}
          <div>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">All Players</CardTitle>
              </CardHeader>
              <CardContent>
                <AllPlayers 
                  selectedPlayer={selectedPlayer}
                  onPlayerSelect={handlePlayerSelect}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Your Predictions */}
          <div>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Your Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <Slots 
                  predictions={predictions}
                  onSlotFill={handleSlotFill}
                  onSlotClear={handleSlotClear}
                  selectedPlayer={selectedPlayer}
                />
                <div className="mt-6">
                  <Button 
                    onClick={handleSubmit}
                    disabled={!isSubmitEnabled}
                    className={`w-full py-3 text-lg font-semibold ${
                      isSubmitEnabled 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                  >
                    Submit Predictions ({predictions.filter(p => p !== "").length}/8)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 