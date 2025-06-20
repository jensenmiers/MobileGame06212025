"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SlotsProps {
  predictions: string[];
  onSlotFill: (slotIndex: number, player: string) => void;
  onSlotClear: (slotIndex: number) => void;
  availablePlayers: string[];
}

const slotLabels = ["1st", "2nd", "3rd", "4th"];
const slotColors = [
  // 1st - Gold with enhanced glow and green gradient
  "border-yellow-300 bg-gradient-to-r from-green-500/20 via-yellow-500/25 to-green-500/20 shadow-lg shadow-yellow-400/20 animate-pulse-slow",
  // 2nd - Silver
  "border-gray-300 bg-gradient-to-r from-gray-400/15 to-gray-500/10 shadow-lg shadow-gray-400/10",
  // 3rd - Bronze
  "border-amber-600 bg-gradient-to-r from-amber-700/15 to-amber-800/10 shadow-lg shadow-amber-600/10",
  // 4th
  "border-blue-400 bg-gradient-to-r from-blue-500/15 to-blue-600/10 shadow-lg shadow-blue-500/10"
];

const positionIcons = [
  "🥇", // 1st place
  "🥈", // 2nd place
  "🥉", // 3rd place
  "🏅"  // 4th place
];

export default function Slots({ predictions, onSlotFill, onSlotClear, availablePlayers }: SlotsProps) {
  const handleValueChange = (value: string, index: number) => {
    if (value === "clear") {
      onSlotClear(index);
    } else {
      onSlotFill(index, value);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {slotLabels.map((label, index) => (
        <div
          key={index}
          className={`
            p-3 sm:p-4 border-2 transition-all duration-200 min-h-[60px] sm:min-h-[70px] md:min-h-[80px] flex items-center
            ${predictions[index] ? slotColors[index] : 'border-gray-600 bg-gray-700/50'}
            hover:brightness-110
          `}
        >
          <div className="flex items-center justify-between w-full gap-3 sm:gap-4 md:gap-6 group">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <span className="text-xl sm:text-2xl md:text-3xl">{positionIcons[index]}</span>
              <div className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {label}
              </div>
            </div>
            
            <Select
              value={predictions[index] || ""}
              onValueChange={(value: string) => value && value !== "clear" ? onSlotFill(index, value) : onSlotClear(index)}
            >
              <SelectTrigger 
                className={`flex-1 bg-gray-800/80 backdrop-blur-sm border-2 hover:bg-gray-700/90 text-white h-12 sm:h-14 md:h-16 transition-all duration-300 group-hover:shadow-lg rounded-none ${!predictions[index] ? 'group-hover:border-blue-400' : ''}`}
              >
                <SelectValue 
                  placeholder={
                    <span className="text-gray-300 text-sm sm:text-base md:text-lg group-hover:text-white transition-colors">
                      Select a player...
                    </span>
                  } 
                >
                  {predictions[index] && (
                    <div className="flex items-center gap-3">
                      <span className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                        {predictions[index]}
                      </span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-sm sm:text-base md:text-lg rounded-none">
                {availablePlayers.map((player) => (
                  <SelectItem 
                    key={player} 
                    value={player}
                    disabled={!predictions[index] && predictions.includes(player)}
                    className={`text-sm sm:text-base md:text-lg ${
                      predictions.includes(player) && player !== predictions[index] 
                        ? 'text-gray-500 cursor-not-allowed' 
                        : 'text-white hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {player}
                  </SelectItem>
                ))}
                {predictions[index] && (
                  <SelectItem 
                    value="clear"
                    className="text-red-400 hover:bg-red-900/20"
                  >
                    Clear selection
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {predictions[index] && (
              <Button
                onClick={() => onSlotClear(index)}
                variant="outline"
                size="sm"
                className="ml-2 bg-red-600/30 border-red-500 text-white hover:bg-red-600/50 hover:text-white"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}