'use client';

import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

import { Player } from "@/types/tournament";

interface ParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Player[];
  onSelect: (participant: Player) => void;
  onSwap?: (participant: Player, fromPosition: string, toPosition: string) => void;
  title: string;
  selectedParticipant?: Player | null;
  usedParticipants?: Player[];
  usedParticipantPositions?: { [participantId: string]: string };
  currentPosition?: string;
}

export default function ParticipantModal({
  isOpen,
  onClose,
  participants,
  onSelect,
  onSwap,
  title,
  selectedParticipant,
  usedParticipants = [],
  usedParticipantPositions = {},
  currentPosition
}: ParticipantModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter participants based on search term
  const filteredParticipants = useMemo(() => {
    return participants.filter(participant =>
      participant.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [participants, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Window */}
      <div className="relative w-full max-w-5xl max-h-[95vh] bg-gradient-to-br from-black via-gray-900 to-black border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="text-sm text-gray-400">
                {filteredParticipants.length} of {participants.length} participants
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-800 bg-gray-900/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20"
              autoFocus
            />
          </div>
        </div>

        {/* Participant List */}
        <div className="flex-1 overflow-y-auto max-h-[70vh]">
          {filteredParticipants.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-2">No participants found</div>
              <p className="text-sm text-gray-500">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="p-4">
              {filteredParticipants.map((participant) => {
                const isSelected = selectedParticipant?.id === participant.id;
                const isUsed = usedParticipants.some(p => p.id === participant.id);
                const usedPosition = usedParticipantPositions[participant.id];
                
                return (
                  <div
                    key={participant.id}
                    className={`py-2 px-4 cursor-pointer transition-colors border-b border-gray-800 last:border-b-0 ${
                      isSelected
                        ? 'bg-green-500/20 text-green-400 border-l-4 border-l-green-500'
                        : isUsed
                        ? 'text-gray-500 hover:bg-gray-800/30'
                        : 'text-white hover:bg-gray-800/50'
                    }`}
                    onClick={() => {
                      if (isUsed && usedPosition && onSwap && currentPosition) {
                        // Handle swap
                        onSwap(participant, usedPosition, currentPosition);
                        onClose();
                      } else if (!isUsed) {
                        // Handle normal selection
                        onSelect(participant);
                        onClose();
                      }
                    }}
                  >
                    <div className="font-medium text-lg">
                      {participant.name}
                      {isSelected && (
                        <span className="ml-2 text-green-400 text-base">(Selected)</span>
                      )}
                      {isUsed && !isSelected && usedPosition && (
                        <span className="ml-2 text-gray-500 text-base">(swap for {usedPosition})</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 