"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ParticipantModal from "./ParticipantModal";
import { Player } from "@/types/tournament";

interface SlotsProps {
  predictions: string[];
  onSlotFill: (slotIndex: number, player: string) => void;
  onSlotSwap: (fromSlotIndex: number, toSlotIndex: number, player: string) => void;
  onSlotClear: (slotIndex: number) => void;
  availablePlayers: string[];
  bracketReset?: 'upper_no_reset' | 'upper_with_reset' | 'lower_bracket' | null;
  onBracketResetChange: (value: 'upper_no_reset' | 'upper_with_reset' | 'lower_bracket' | null) => void;
  grandFinalsScore?: 'score_3_0' | 'score_3_1' | 'score_3_2' | null;
  onGrandFinalsScoreChange: (value: 'score_3_0' | 'score_3_1' | 'score_3_2' | null) => void;
  winnersFinalScore?: 'score_3_0' | 'score_3_1' | 'score_3_2' | null;
  onWinnersFinalScoreChange: (value: 'score_3_0' | 'score_3_1' | 'score_3_2' | null) => void;
  losersFinalScore?: 'score_3_0' | 'score_3_1' | 'score_3_2' | null;
  onLosersFinalScoreChange: (value: 'score_3_0' | 'score_3_1' | 'score_3_2' | null) => void;
  readonly?: boolean;
  players?: Player[]; // Add players prop for modal
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

const positionPoints = [300, 220, 160, 100];

export default function Slots({ predictions, onSlotFill, onSlotSwap, onSlotClear, availablePlayers, bracketReset, onBracketResetChange, grandFinalsScore, onGrandFinalsScoreChange, winnersFinalScore, onWinnersFinalScoreChange, losersFinalScore, onLosersFinalScoreChange, readonly = false, players = [] }: SlotsProps) {
  const [bonusExpanded, setBonusExpanded] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  const handleSlotClick = (index: number) => {
    if (readonly) return;
    setActiveSlotIndex(index);
    setModalOpen(true);
  };

  const handleParticipantSelect = (participant: Player) => {
    if (activeSlotIndex !== null) {
      onSlotFill(activeSlotIndex, participant.name);
    }
  };

  const handleParticipantSwap = (participant: Player, fromPosition: string, toPosition: string) => {
    if (activeSlotIndex === null) return;
    
    // Find the slot indices for both positions
    const fromSlotIndex = slotLabels.findIndex(label => label === fromPosition);
    const toSlotIndex = slotLabels.findIndex(label => label === toPosition);
    
    if (fromSlotIndex !== -1 && toSlotIndex !== -1) {
      // Use the dedicated swap function
      onSlotSwap(fromSlotIndex, toSlotIndex, participant.name);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Main Position Predictions */}
      {slotLabels.map((label, index) => (
        <div
          key={index}
          className={`
            p-2 border-2 transition-all duration-200 min-h-[48px] flex items-center rounded-lg
            ${predictions[index] ? slotColors[index] : 'border-gray-600 bg-gray-800/50'}
            ${readonly ? 'opacity-80' : 'hover:brightness-110'}
          `}
        >
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-3 w-[5.5rem] min-w-[5.5rem] justify-start">
              <span className="text-2xl">{positionIcons[index]}</span>
              <div className="flex flex-col">
                <div className="text-xl font-bold text-white">
                  {label}
                </div>
                <div className="text-xs text-gray-300 font-medium">
                  {positionPoints[index]} pts
                </div>
              </div>
            </div>
            
            <button
              onClick={() => handleSlotClick(index)}
              disabled={readonly}
              className={`w-full min-w-[160px] bg-gray-800/80 border-2 text-white h-14 transition-all duration-300 rounded-lg flex items-center justify-between px-4 ${
                readonly ? 'cursor-not-allowed opacity-70' : 'hover:bg-gray-700/90 cursor-pointer'
              }`}
            >
              <span className="text-base truncate block w-full text-left">
                {predictions[index] ? (
                  <span className="text-lg font-bold text-white truncate block w-full">
                    {predictions[index]}
                  </span>
                ) : (
                  <span className="text-gray-300 text-base truncate block w-full">
                    {readonly ? 'No prediction made' : 'Select a player...'}
                  </span>
                )}
              </span>
              {!readonly && (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            
          </div>
        </div>
      ))}

      {/* Bonus Picks Section */}
      <div className="mt-6 border-2 border-purple-500/30 bg-purple-900/10 rounded-lg overflow-hidden">
        <button
          onClick={() => setBonusExpanded(!bonusExpanded)}
          className={`w-full p-3 flex items-center justify-between transition-colors ${
            readonly ? 'cursor-default' : 'hover:bg-purple-900/20'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <div className="text-lg font-bold text-white">Bonus Picks</div>
          </div>
          <div className="flex items-center gap-2">
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
            <div className="mb-1 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-white m-0 p-0">Grand Finals</h4>
                  <span className="text-xs text-purple-300 font-medium">+48 pts</span>
                </div>
              {bracketReset && !readonly && (
                <button
                  onClick={() => onBracketResetChange(null)}
                  className="ml-2 px-2 py-0.5 text-xs text-purple-300 bg-transparent border border-purple-300 rounded hover:bg-purple-900/20 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-1">
              <label className={`flex items-center gap-2 p-2 rounded transition-colors ${
                readonly ? 'cursor-default opacity-70' : 'hover:bg-purple-900/20 cursor-pointer'
              }`}>
                <input
                  type="radio"
                  name="bracket-reset"
                  value="upper_no_reset"
                  checked={bracketReset === 'upper_no_reset'}
                  onChange={(e) => onBracketResetChange(e.target.value as 'upper_no_reset')}
                  disabled={readonly}
                  className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500"
                />
                <span className="text-base">👑</span>
                <span className="text-sm text-white">Upper bracket winner (no reset)</span>
              </label>

              <label className={`flex items-center gap-2 py-1 px-2 rounded transition-colors ${
                readonly ? 'cursor-default opacity-70' : 'hover:bg-purple-900/20 cursor-pointer'
              }`}>
                <input
                  type="radio"
                  name="bracket-reset"
                  value="upper_with_reset"
                  checked={bracketReset === 'upper_with_reset'}
                  onChange={(e) => onBracketResetChange(e.target.value as 'upper_with_reset')}
                  disabled={readonly}
                  className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500"
                />
                <span className="text-base">🔄</span>
                <span className="text-sm text-white">Upper bracket winner (with reset)</span>
              </label>

              <label className={`flex items-center gap-2 py-1 px-2 rounded transition-colors ${
                readonly ? 'cursor-default opacity-70' : 'hover:bg-purple-900/20 cursor-pointer'
              }`}>
                <input
                  type="radio"
                  name="bracket-reset"
                  value="lower_bracket"
                  checked={bracketReset === 'lower_bracket'}
                  onChange={(e) => onBracketResetChange(e.target.value as 'lower_bracket')}
                  disabled={readonly}
                  className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500"
                />
                <span className="text-base">⚡</span>
                <span className="text-sm text-white">Lower bracket winner</span>
              </label>
            </div>

            {/* Grand Finals Score Section */}
            <div className="mt-6 pt-4 border-t border-purple-500/20">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-white m-0 p-0">Grand Final Score</h4>
                  <span className="text-xs text-purple-300 font-medium">+42 pts</span>
                </div>
                {grandFinalsScore && !readonly && (
                  <button
                    onClick={() => onGrandFinalsScoreChange(null)}
                    className="ml-2 px-2 py-0.5 text-xs text-purple-300 bg-transparent border border-purple-300 rounded hover:bg-purple-900/20 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <label className={`flex items-center gap-2 py-1 px-2 rounded transition-colors ${
                  readonly ? 'cursor-default opacity-70' : 'hover:bg-purple-900/20 cursor-pointer'
                }`}>
                  <input
                    type="radio"
                    name="grand-finals-score"
                    value="score_3_0"
                    checked={grandFinalsScore === 'score_3_0'}
                    onChange={(e) => onGrandFinalsScoreChange(e.target.value as 'score_3_0')}
                    disabled={readonly}
                    className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-white">3-0</span>
                </label>

                <label className={`flex items-center gap-2 py-1 px-2 rounded transition-colors ${
                  readonly ? 'cursor-default opacity-70' : 'hover:bg-purple-900/20 cursor-pointer'
                }`}>
                  <input
                    type="radio"
                    name="grand-finals-score"
                    value="score_3_1"
                    checked={grandFinalsScore === 'score_3_1'}
                    onChange={(e) => onGrandFinalsScoreChange(e.target.value as 'score_3_1')}
                    disabled={readonly}
                    className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-white">3-1</span>
                </label>

                <label className={`flex items-center gap-2 py-1 px-2 rounded transition-colors ${
                  readonly ? 'cursor-default opacity-70' : 'hover:bg-purple-900/20 cursor-pointer'
                }`}>
                  <input
                    type="radio"
                    name="grand-finals-score"
                    value="score_3_2"
                    checked={grandFinalsScore === 'score_3_2'}
                    onChange={(e) => onGrandFinalsScoreChange(e.target.value as 'score_3_2')}
                    disabled={readonly}
                    className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-white">3-2</span>
                </label>
              </div>
            </div>

            {/* Winners Final Score Section */}
            <div className="mt-6 pt-4 border-t border-purple-500/20">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-white m-0 p-0">Winners Final Score</h4>
                  <span className="text-xs text-purple-300 font-medium">+16 pts</span>
                </div>
                {winnersFinalScore && !readonly && (
                  <button
                    onClick={() => onWinnersFinalScoreChange(null)}
                    className="ml-2 px-2 py-0.5 text-xs text-purple-300 bg-transparent border border-purple-300 rounded hover:bg-purple-900/20 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <label className={`flex items-center gap-2 py-1 px-2 rounded transition-colors ${
                  readonly ? 'cursor-default opacity-70' : 'hover:bg-purple-900/20 cursor-pointer'
                }`}>
                  <input
                    type="radio"
                    name="winners-final-score"
                    value="score_3_0"
                    checked={winnersFinalScore === 'score_3_0'}
                    onChange={(e) => onWinnersFinalScoreChange(e.target.value as 'score_3_0')}
                    disabled={readonly}
                    className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-white">3-0</span>
                </label>

                <label className={`flex items-center gap-2 py-1 px-2 rounded transition-colors ${
                  readonly ? 'cursor-default opacity-70' : 'hover:bg-purple-900/20 cursor-pointer'
                }`}>
                  <input
                    type="radio"
                    name="winners-final-score"
                    value="score_3_1"
                    checked={winnersFinalScore === 'score_3_1'}
                    onChange={(e) => onWinnersFinalScoreChange(e.target.value as 'score_3_1')}
                    disabled={readonly}
                    className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-white">3-1</span>
                </label>

                <label className={`flex items-center gap-2 py-1 px-2 rounded transition-colors ${
                  readonly ? 'cursor-default opacity-70' : 'hover:bg-purple-900/20 cursor-pointer'
                }`}>
                  <input
                    type="radio"
                    name="winners-final-score"
                    value="score_3_2"
                    checked={winnersFinalScore === 'score_3_2'}
                    onChange={(e) => onWinnersFinalScoreChange(e.target.value as 'score_3_2')}
                    disabled={readonly}
                    className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-white">3-2</span>
                </label>
              </div>
            </div>

            {/* Losers Final Score Section */}
            <div className="mt-6 pt-4 border-t border-purple-500/20">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-white m-0 p-0">Losers Final Score</h4>
                  <span className="text-xs text-purple-300 font-medium">+14 pts</span>
                </div>
                {losersFinalScore && !readonly && (
                  <button
                    onClick={() => onLosersFinalScoreChange(null)}
                    className="ml-2 px-2 py-0.5 text-xs text-purple-300 bg-transparent border border-purple-300 rounded hover:bg-purple-900/20 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <label className={`flex items-center gap-2 py-1 px-2 rounded transition-colors ${
                  readonly ? 'cursor-default opacity-70' : 'hover:bg-purple-900/20 cursor-pointer'
                }`}>
                  <input
                    type="radio"
                    name="losers-final-score"
                    value="score_3_0"
                    checked={losersFinalScore === 'score_3_0'}
                    onChange={(e) => onLosersFinalScoreChange(e.target.value as 'score_3_0')}
                    disabled={readonly}
                    className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-white">3-0</span>
                </label>

                <label className={`flex items-center gap-2 py-1 px-2 rounded transition-colors ${
                  readonly ? 'cursor-default opacity-70' : 'hover:bg-purple-900/20 cursor-pointer'
                }`}>
                  <input
                    type="radio"
                    name="losers-final-score"
                    value="score_3_1"
                    checked={losersFinalScore === 'score_3_1'}
                    onChange={(e) => onLosersFinalScoreChange(e.target.value as 'score_3_1')}
                    disabled={readonly}
                    className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-white">3-1</span>
                </label>

                <label className={`flex items-center gap-2 py-1 px-2 rounded transition-colors ${
                  readonly ? 'cursor-default opacity-70' : 'hover:bg-purple-900/20 cursor-pointer'
                }`}>
                  <input
                    type="radio"
                    name="losers-final-score"
                    value="score_3_2"
                    checked={losersFinalScore === 'score_3_2'}
                    onChange={(e) => onLosersFinalScoreChange(e.target.value as 'score_3_2')}
                    disabled={readonly}
                    className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-white">3-2</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Participant Selection Modal */}
      {modalOpen && activeSlotIndex !== null && players.length > 0 && (
        <ParticipantModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setActiveSlotIndex(null);
          }}
          participants={players}
          onSelect={handleParticipantSelect}
          onSwap={handleParticipantSwap}
          title={`Select ${slotLabels[activeSlotIndex]} Place`}
          selectedParticipant={predictions[activeSlotIndex] ? players.find(p => p.name === predictions[activeSlotIndex]) || null : null}
          usedParticipants={predictions.map((pred, idx) => {
            if (idx === activeSlotIndex || !pred) return null;
            return players.find(p => p.name === pred) || null;
          }).filter(Boolean) as Player[]}
          usedParticipantPositions={predictions.reduce((acc, pred, idx) => {
            if (idx === activeSlotIndex || !pred) return acc;
            const player = players.find(p => p.name === pred);
            if (player) {
              acc[player.id] = slotLabels[idx];
            }
            return acc;
          }, {} as { [participantId: string]: string })}
          currentPosition={slotLabels[activeSlotIndex]}
        />
      )}
    </div>
  );
}