"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Same player list as in the prediction component
const players = [
  "Alex Thunder", "Blaze Storm", "Cyber Knight", "Dragon Fire",
  "Echo Phantom", "Frost Bite", "Ghost Rider", "Hunter X",
  "Ice Phoenix", "Jet Stream", "King Cobra", "Lightning Bolt",
  "Mystic Wolf", "Nova Star", "Omega Force", "Phoenix Rising"
];

const positionLabels = ["1st Place", "2nd Place", "3rd Place", "4th Place", "5th Place", "6th Place", "7th Place", "8th Place"];

export default function AdminPage() {
  const [results, setResults] = useState<string[]>(Array(8).fill(""));
  
  // Mock cutoff timestamp - in real implementation this would come from the database
  const cutoffTimestamp = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
  const isCutoffPassed = Date.now() > cutoffTimestamp;
  
  const handlePositionChange = (position: number, player: string) => {
    const newResults = [...results];
    newResults[position] = player;
    setResults(newResults);
  };

  const handleSubmitResults = () => {
    const filledResults = results.filter(result => result !== "");
    if (filledResults.length === 8) {
      console.log("Submitting tournament results:", results);
      // TODO: Implement actual Supabase submission in Phase 4
      alert("Tournament results submitted! (Backend integration coming in Phase 4)");
    } else {
      alert("Please select a player for all 8 positions before submitting.");
    }
  };

  const isFormComplete = results.every(result => result !== "");

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
          <p className="text-gray-400">Enter the official tournament results</p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              🛠️ Tournament Results Entry
              {isCutoffPassed && (
                <span className="text-red-400 text-sm font-normal">(Submission Deadline Passed)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isCutoffPassed && (
              <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
                <p className="text-red-300 text-center">
                  ⚠️ The submission deadline has passed. Results can no longer be modified.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {positionLabels.map((label, index) => (
                <div key={index} className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    {label}
                  </label>
                  <select
                    value={results[index]}
                    onChange={(e) => handlePositionChange(index, e.target.value)}
                    disabled={isCutoffPassed}
                    className={`
                      w-full p-3 rounded-lg border-2 bg-gray-700 text-white
                      ${isCutoffPassed 
                        ? 'border-gray-600 opacity-50 cursor-not-allowed' 
                        : 'border-gray-600 hover:border-gray-500 focus:border-blue-400'
                      }
                      focus:outline-none focus:ring-2 focus:ring-blue-400/50
                    `}
                  >
                    <option value="">Select player for {label.toLowerCase()}</option>
                    {players.map((player, playerIndex) => (
                      <option key={playerIndex} value={player}>
                        {player}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-gray-700">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">
                    Progress: {results.filter(r => r !== "").length}/8 positions filled
                  </span>
                  <div className="w-48 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(results.filter(r => r !== "").length / 8) * 100}%` }}
                    />
                  </div>
                </div>
                
                <Button
                  onClick={handleSubmitResults}
                  disabled={!isFormComplete || isCutoffPassed}
                  className={`
                    w-full py-3 text-lg font-semibold
                    ${isFormComplete && !isCutoffPassed
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-gray-600 cursor-not-allowed'
                    }
                  `}
                >
                  {isCutoffPassed 
                    ? "Submission Deadline Passed" 
                    : isFormComplete 
                      ? "Submit Tournament Results" 
                      : `Submit Results (${results.filter(r => r !== "").length}/8 Complete)`
                  }
                </Button>
              </div>
            </div>

            <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
              <p className="text-blue-200 text-sm">
                💡 <strong>Note:</strong> Once submitted, these results will be used to calculate all player scores and update the leaderboard. 
                Make sure all positions are correct before submitting.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 