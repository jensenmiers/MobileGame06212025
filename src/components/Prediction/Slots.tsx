"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SlotsProps {
  predictions: string[];
  onSlotFill: (slotIndex: number, player: string) => void;
  onSlotClear: (slotIndex: number) => void;
  availablePlayers: string[];
  bracketReset?: 'upper_no_reset' | 'upper_with_reset' | 'lower_bracket' | null;
  onBracketResetChange: (value: 'upper_no_reset' | 'upper_with_reset' | 'lower_bracket' | null) => void;
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

export default function Slots({ predictions, onSlotFill, onSlotClear, availablePlayers, bracketReset, onBracketResetChange }: SlotsProps) {
  const [bonusExpanded, setBonusExpanded] = useState(false);

  const handleValueChange = (value: string, index: number) => {
    if (value === "clear") {
      onSlotClear(index);
    } else {
      onSlotFill(index, value);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Main Position Predictions */}
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

      {/* Bonus Picks Section */}
      <div className="mt-6 border-2 border-purple-500/30 bg-purple-900/10 rounded-lg overflow-hidden">
        <button
          onClick={() => setBonusExpanded(!bonusExpanded)}
          className="w-full p-3 flex items-center justify-between hover:bg-purple-900/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <div className="text-lg font-bold text-white">Bonus Picks</div>
          </div>
          <div className="flex items-center gap-2">
            {bracketReset && (
              <span className="text-xs bg-purple-600/30 px-2 py-1 rounded text-purple-200">
                {bracketReset === 'upper_no_reset' ? '👑' : 
                 bracketReset === 'upper_with_reset' ? '🔄' : 
                 bracketReset === 'lower_bracket' ? '⚡' : ''}
              </span>
            )}
            <svg 
              className={`w-5 h-5 text-purple-300 transition-transform ${bonusExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {bonusExpanded && (
          <div className="border-t border-purple-500/20 p-3 bg-purple-900/5">
            <div className="mb-3">
              <h4 className="text-base font-semibold text-white">Grand Finals Bracket Reset</h4>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 p-2 rounded hover:bg-purple-900/20 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="bracket-reset"
                  value="upper_no_reset"
                  checked={bracketReset === 'upper_no_reset'}
                  onChange={(e) => onBracketResetChange(e.target.value as 'upper_no_reset')}
                  className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500"
                />
                <span className="text-base">👑</span>
                <span className="text-sm text-white">Upper bracket winner (no reset)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded hover:bg-purple-900/20 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="bracket-reset"
                  value="upper_with_reset"
                  checked={bracketReset === 'upper_with_reset'}
                  onChange={(e) => onBracketResetChange(e.target.value as 'upper_with_reset')}
                  className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500"
                />
                <span className="text-base">🔄</span>
                <span className="text-sm text-white">Upper bracket winner (with reset)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded hover:bg-purple-900/20 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="bracket-reset"
                  value="lower_bracket"
                  checked={bracketReset === 'lower_bracket'}
                  onChange={(e) => onBracketResetChange(e.target.value as 'lower_bracket')}
                  className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500"
                />
                <span className="text-base">⚡</span>
                <span className="text-sm text-white">Lower bracket winner</span>
              </label>

              {bracketReset && (
                <button
                  onClick={() => onBracketResetChange(null)}
                  className="text-xs text-purple-300 hover:text-purple-200 underline mt-2"
                >
                  Clear selection
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}