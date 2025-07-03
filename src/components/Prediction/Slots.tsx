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
  // 1st - Gold with subtle styling
  "border-yellow-400 bg-yellow-500/10",
  // 2nd - Silver
  "border-gray-400 bg-gray-500/10",
  // 3rd - Bronze
  "border-amber-600 bg-amber-600/10",
  // 4th
  "border-blue-400 bg-blue-500/10"
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
            p-4 border-2 transition-all duration-200 min-h-[70px] flex items-center rounded-lg
            ${predictions[index] ? slotColors[index] : 'border-gray-600 bg-gray-800/50'}
            hover:brightness-110
          `}
        >
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{positionIcons[index]}</span>
              <div className="text-xl font-bold text-white">
                {label}
              </div>
            </div>
            
            <Select
              value={predictions[index] || ""}
              onValueChange={(value: string) => value && value !== "clear" ? onSlotFill(index, value) : onSlotClear(index)}
            >
              <SelectTrigger 
                className="flex-1 bg-gray-800/80 border-2 hover:bg-gray-700/90 text-white h-14 transition-all duration-300 rounded-lg"
              >
                <SelectValue 
                  placeholder={
                    <span className="text-gray-300 text-base">
                      Select a player...
                    </span>
                  } 
                >
                  {predictions[index] && (
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-white">
                        {predictions[index]}
                      </span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-base rounded-lg">
                {availablePlayers.map((player) => (
                  <SelectItem 
                    key={player} 
                    value={player}
                    disabled={!predictions[index] && predictions.includes(player)}
                    className={`text-base ${
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