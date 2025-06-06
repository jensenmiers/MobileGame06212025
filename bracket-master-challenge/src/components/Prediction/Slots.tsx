"use client";

import { Button } from "@/components/ui/button";

interface SlotsProps {
  predictions: string[];
  onSlotFill: (slotIndex: number) => void;
  onSlotClear: (slotIndex: number) => void;
  selectedPlayer: string | null;
}

const slotLabels = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
const slotColors = [
  "border-yellow-400 bg-yellow-400/10", // 1st - Gold
  "border-gray-300 bg-gray-300/10",     // 2nd - Silver
  "border-orange-400 bg-orange-400/10", // 3rd - Bronze
  "border-blue-400 bg-blue-400/10",     // 4th-8th - Blue variants
  "border-purple-400 bg-purple-400/10",
  "border-green-400 bg-green-400/10",
  "border-red-400 bg-red-400/10",
  "border-pink-400 bg-pink-400/10"
];

export default function Slots({ predictions, onSlotFill, onSlotClear, selectedPlayer }: SlotsProps) {
  return (
    <div className="space-y-4">
      {slotLabels.map((label, index) => (
        <div
          key={index}
          onClick={() => selectedPlayer && onSlotFill(index)}
          className={`
            p-4 rounded-lg border-2 transition-all duration-200 min-h-[80px]
            ${predictions[index] 
              ? slotColors[index] 
              : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
            }
            ${selectedPlayer && !predictions[index] 
              ? 'cursor-pointer hover:bg-white/10' 
              : ''
            }
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xl font-bold text-white">{label}</div>
              {predictions[index] ? (
                <div>
                  <div className="font-semibold text-white">{predictions[index]}</div>
                  <div className="text-sm text-gray-300">Position {index + 1}</div>
                </div>
              ) : (
                <div className="text-gray-400">
                  {selectedPlayer ? "Click to place here" : "Select a player"}
                </div>
              )}
            </div>
            
            {predictions[index] && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSlotClear(index);
                }}
                variant="outline"
                size="sm"
                className="bg-red-600/20 border-red-500 text-red-300 hover:bg-red-600/40"
              >
                ✕ Remove
              </Button>
            )}
          </div>
          
          {selectedPlayer && !predictions[index] && (
            <div className="mt-2 text-xs text-blue-200 opacity-75">
              Click to place "{selectedPlayer}" in {label} position
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 