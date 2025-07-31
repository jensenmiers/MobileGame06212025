'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import ParticipantModal from './ParticipantModal';

// Sample participant data
const sampleParticipants = [
  { id: '1', name: 'FSP | Deus' },
  { id: '2', name: 'FSP | DJ Nova' },
  { id: '3', name: 'Bracket Demons | sleepnsheep' },
  { id: '4', name: 'EnzoTheHokage' },
  { id: '5', name: 'Chef Dchong' },
  { id: '6', name: 'MYES | FoHamr' },
  { id: '7', name: 'airjordan43' },
  { id: '8', name: 'icecream' },
  { id: '9', name: 'Sisig' },
  { id: '10', name: 'Pride' },
  { id: '11', name: 'Bromez' },
  { id: '12', name: 'GilbsSkills' },
  { id: '13', name: 'Daikon' },
  { id: '14', name: 'Ghost' },
  // Add more participants to simulate a larger tournament
  { id: '15', name: 'Alpha | Shadow' },
  { id: '16', name: 'Beta | Lightning' },
  { id: '17', name: 'Gamma | Thunder' },
  { id: '18', name: 'Delta | Storm' },
  { id: '19', name: 'Echo | Wind' },
  { id: '20', name: 'Foxtrot | Rain' },
  { id: '21', name: 'Golf | Snow' },
  { id: '22', name: 'Hotel | Frost' },
  { id: '23', name: 'India | Ice' },
  { id: '24', name: 'Juliet | Fire' },
  { id: '25', name: 'Kilo | Flame' },
  { id: '26', name: 'Lima | Blaze' },
  { id: '27', name: 'Mike | Inferno' },
  { id: '28', name: 'November | Phoenix' },
  { id: '29', name: 'Oscar | Dragon' },
  { id: '30', name: 'Papa | Wyvern' },
  { id: '31', name: 'Quebec | Griffin' },
  { id: '32', name: 'Romeo | Hydra' },
  { id: '33', name: 'Sierra | Kraken' },
  { id: '34', name: 'Tango | Leviathan' },
  { id: '35', name: 'Uniform | Behemoth' },
  { id: '36', name: 'Victor | Titan' },
  { id: '37', name: 'Whiskey | Giant' },
  { id: '38', name: 'Xray | Colossus' },
  { id: '39', name: 'Yankee | Goliath' },
  { id: '40', name: 'Zulu | Atlas' },
  { id: '41', name: 'Ace | Champion' },
  { id: '42', name: 'King | Monarch' },
  { id: '43', name: 'Queen | Empress' },
  { id: '44', name: 'Jack | Noble' },
  { id: '45', name: 'Ten | Warrior' },
  { id: '46', name: 'Nine | Knight' },
  { id: '47', name: 'Eight | Paladin' },
  { id: '48', name: 'Seven | Mage' },
  { id: '49', name: 'Six | Archer' },
  { id: '50', name: 'Five | Rogue' },
  { id: '51', name: 'Four | Cleric' },
  { id: '52', name: 'Three | Wizard' },
  { id: '53', name: 'Two | Sorcerer' },
  { id: '54', name: 'One | Warlock' },
  { id: '55', name: 'Zero | Necromancer' },
  { id: '56', name: 'Star | Astral' },
  { id: '57', name: 'Moon | Lunar' },
  { id: '58', name: 'Sun | Solar' },
  { id: '59', name: 'Earth | Terra' },
  { id: '60', name: 'Mars | Ares' },
  { id: '61', name: 'Jupiter | Zeus' },
  { id: '62', name: 'Saturn | Cronus' },
  { id: '63', name: 'Uranus | Ouranos' },
  { id: '64', name: 'Neptune | Poseidon' },
];

interface PredictionSlot {
  id: number;
  position: string;
  participant: any;
}

export default function ParticipantModalDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [predictions, setPredictions] = useState<PredictionSlot[]>([
    { id: 1, position: '1st', participant: null },
    { id: 2, position: '2nd', participant: null },
    { id: 3, position: '3rd', participant: null },
    { id: 4, position: '4th', participant: null },
  ]);

  const handleSlotClick = (slotId: number) => {
    setActiveSlot(slotId);
    setIsModalOpen(true);
  };

  const handleParticipantSelect = (participant: any) => {
    if (activeSlot !== null) {
      setPredictions(prev => 
        prev.map(slot => 
          slot.id === activeSlot 
            ? { ...slot, participant } 
            : slot
        )
      );
    }
  };

  const handleParticipantSwap = (participant: any, fromPosition: string, toPosition: string) => {
    // Find the slots for both positions
    const fromSlot = predictions.find(slot => slot.position === fromPosition);
    const toSlot = predictions.find(slot => slot.position === toPosition);
    
    if (fromSlot && toSlot) {
      setPredictions(prev => 
        prev.map(slot => {
          if (slot.position === fromPosition) {
            // Move the participant from fromPosition to toPosition
            return { ...slot, participant: toSlot.participant };
          } else if (slot.position === toPosition) {
            // Move the participant from toPosition to fromPosition
            return { ...slot, participant: participant };
          }
          return slot;
        })
      );
    }
  };

  const getMedalIcon = (position: string) => {
    switch (position) {
      case '1st': return '🥇';
      case '2nd': return '🥈';
      case '3rd': return '🥉';
      case '4th': return '🏅';
      default: return '🏅';
    }
  };

  // Get all used participants (excluding the current slot's selection)
  const getUsedParticipants = () => {
    return predictions
      .filter(slot => slot.participant && slot.id !== activeSlot)
      .map(slot => slot.participant);
  };

  // Get used participant positions mapping
  const getUsedParticipantPositions = () => {
    const positions: { [participantId: string]: string } = {};
    predictions.forEach(slot => {
      if (slot.participant && slot.id !== activeSlot) {
        positions[slot.participant.id] = slot.position;
      }
    });
    return positions;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-400 mb-2">Simplified Participant Selection</h1>
          <p className="text-gray-400">Click on any prediction slot to open the full-screen modal</p>
        </div>

        {/* Prediction Slots */}
        <div className="space-y-4">
          {predictions.map((slot) => (
            <Card
              key={slot.id}
              className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20 ${
                slot.participant 
                  ? 'border-green-500 bg-green-500/10' 
                  : 'border-gray-700 bg-gray-800/50 hover:border-green-500/50'
              }`}
              onClick={() => handleSlotClick(slot.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getMedalIcon(slot.position)}</span>
                    <span className="font-bold text-lg">{slot.position}</span>
                  </div>
                  
                  <div className="flex-1">
                    {slot.participant ? (
                      <div className="font-semibold text-white">{slot.participant.name}</div>
                    ) : (
                      <div className="text-gray-400 italic">Select a participant...</div>
                    )}
                  </div>
                  
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
          <h3 className="text-lg font-semibold text-green-400 mb-2">Tournament Info</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Total Participants:</span>
              <span className="text-white ml-2 font-semibold">{sampleParticipants.length}</span>
            </div>
            <div>
              <span className="text-gray-400">Selected:</span>
              <span className="text-white ml-2 font-semibold">
                {predictions.filter(p => p.participant).length}/4
              </span>
            </div>
          </div>
        </div>

        {/* Modal */}
        <ParticipantModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          participants={sampleParticipants}
          onSelect={handleParticipantSelect}
          onSwap={handleParticipantSwap}
          title={`Select ${activeSlot ? predictions.find(p => p.id === activeSlot)?.position : ''} Place`}
          selectedParticipant={activeSlot ? predictions.find(p => p.id === activeSlot)?.participant : null}
          usedParticipants={getUsedParticipants()}
          usedParticipantPositions={getUsedParticipantPositions()}
          currentPosition={activeSlot ? predictions.find(p => p.id === activeSlot)?.position : undefined}
        />
      </div>
    </div>
  );
} 