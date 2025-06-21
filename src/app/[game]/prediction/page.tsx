"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Slots from "@/components/Prediction/Slots";
import { tournamentService } from "@/lib/tournament-service";
import { Player } from "@/types/tournament";
import { gameUiDetailsMap } from "@/lib/game-utils";
import { useAuth } from "@/context/AuthContext";
import { syncUserProfile } from "@/lib/tournament-service";

export default function PredictionPage() {
  const { session } = useAuth();
  const [predictions, setPredictions] = useState<(Player | null)[]>(Array(4).fill(null));
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [tournamentTitle, setTournamentTitle] = useState<string>("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const isComplete = predictions.every(prediction => prediction !== null);
  const params = useParams();
  const gameSlug = params.game as string;

  const tournamentName = Object.keys(gameUiDetailsMap).find(
    key => gameUiDetailsMap[key].slug === gameSlug
  );

  useEffect(() => {
    if (!tournamentName) {
      return notFound();
    }
    setTournamentTitle(tournamentName);

    const fetchTournamentData = async () => {
      const tournaments = await tournamentService.getTournaments();
      const currentTournament = tournaments.find(t => t.name === tournamentName);

      if (currentTournament) {
        setTournamentId(currentTournament.id);
        const participantData = await tournamentService.getTournamentParticipants(currentTournament.id);
        setPlayers(participantData);
      } else {
        console.error(`${tournamentName} tournament not found.`);
      }
    };

    fetchTournamentData();
  }, [gameSlug, tournamentName]);

  // Sync user profile when component loads and user is authenticated
  useEffect(() => {
    if (session?.user) {
      syncUserProfile(session.user.id).catch(error => {
        console.error('Profile sync failed on prediction page load:', error);
        // Don't show error to user, as this is background sync
      });
    }
  }, [session?.user]);

  if (!tournamentName) {
    return null;
  }

  const handleSlotFill = (slotIndex: number, player: Player) => {
    const newPredictions = [...predictions];
    if (newPredictions.some(p => p?.id === player.id)) return;
    newPredictions[slotIndex] = player;
    setPredictions(newPredictions);
    setSubmissionMessage(null);
  };

  const handleSlotClear = (slotIndex: number) => {
    const newPredictions = [...predictions];
    newPredictions[slotIndex] = null;
    setPredictions(newPredictions);
    setSubmissionMessage(null);
  };

  const handleSubmit = async () => {
    if (!isComplete || !tournamentId || isSubmitting) return;

    if (!session?.user) {
      setSubmissionMessage({ type: 'error', text: 'You must be logged in to submit a prediction.' });
      return;
    }

    const predictionData = {
      user_id: session.user.id,
      tournament_id: tournamentId,
      slot_1_participant_id: predictions[0]!.id,
      slot_2_participant_id: predictions[1]!.id,
      slot_3_participant_id: predictions[2]!.id,
      slot_4_participant_id: predictions[3]!.id,
    };

    // Debug logging for production issues
    console.log('🔍 Debug: Submitting prediction with data:', {
      ...predictionData,
      user_email: session.user.email,
      session_valid: !!session,
      predictions_selected: predictions.map(p => ({ id: p?.id, name: p?.name }))
    });

    setIsSubmitting(true);
    setSubmissionMessage(null);

    try {
      await tournamentService.submitPrediction(predictionData);
      setSubmissionMessage({ type: 'success', text: 'Prediction submitted successfully! You can update it until the tournament starts.' });
    } catch (error) {
      console.error('❌ Failed to submit prediction:', error);
      console.error('❌ Error details:', {
        error_message: error.message,
        error_code: error.code,
        error_details: error.details,
        user_id: session.user.id,
        tournament_id: tournamentId
      });
      
      // Check if this is a profile-related error
      if (error.message?.includes('profile') || error.code === 'PGRST301' || error.code === '23503') {
        setSubmissionMessage({ 
          type: 'error', 
          text: 'Your account profile is not set up yet. Please refresh the page and try again, or sign out and back in.' 
        });
      } else {
        setSubmissionMessage({ 
          type: 'error', 
          text: `Failed to submit prediction. Please try again. Error: ${error.message || 'Unknown error'}` 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add function to manually retry profile sync
  const retryProfileSync = async () => {
    if (!session?.user) return;
    
    try {
      setSubmissionMessage({ type: 'info', text: 'Setting up your profile...' });
      await syncUserProfile(session.user.id);
      setSubmissionMessage({ type: 'success', text: 'Profile setup complete! You can now submit your prediction.' });
    } catch (error) {
      console.error('Profile sync retry failed:', error);
      setSubmissionMessage({ 
        type: 'error', 
        text: 'Profile setup failed. Please sign out and back in, or contact support.' 
      });
    }
  };

  const predictedPlayerIds = new Set(predictions.filter(p => p).map(p => p!.id));
  const availablePlayers = players.filter(player => !predictedPlayerIds.has(player.id));

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
          href={`/?game=${gameSlug}`}
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text gradient-rotate mb-2 mx-auto" 
            style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>
            Bracket Challenge
          </h1>
        </div>
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-4 w-full text-white">
          {tournamentTitle}
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 w-full">
          Predict the top 4 players!
        </p>
      </div>

      {/* Prediction Slots */}
      <div className="w-full max-w-2xl mb-8">
        <Slots 
          predictions={predictions.map(p => p?.name || "")}
          onSlotFill={(slotIndex, playerName) => {
            const player = players.find(p => p.name === playerName);
            if (player) handleSlotFill(slotIndex, player);
          }}
          onSlotClear={handleSlotClear}
          availablePlayers={availablePlayers.map(p => p.name)}
        />
      </div>

      {/* Submit Button & Feedback */}
      <div className="w-full max-w-2xl mb-12">
        <Button
          onClick={handleSubmit}
          disabled={!isComplete || isSubmitting || !session?.user}
          className={`relative w-full py-6 text-lg sm:text-xl md:text-2xl font-bold overflow-hidden transition-all duration-300 transform gradient-rotate ${ 
            isComplete && !isSubmitting && session?.user
              ? 'hover:scale-[1.02] hover:shadow-2xl' 
              : 'opacity-50 cursor-not-allowed'
          }`}
          style={{
            boxShadow: isComplete && !isSubmitting && session?.user
              ? '0 10px 25px -5px rgba(0, 172, 78, 0.4)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
            {isSubmitting 
              ? 'Submitting...' 
              : !session?.user 
              ? 'Log In to Submit' 
              : isComplete ? (
              <>
                <span>Submit Predictions</span>
                <span className="text-yellow-300">🏆</span>
              </>
            ) : (
              'Select All Players to Continue'
            )}
          </span>
          {isComplete && !isSubmitting && session?.user && (
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          )}
        </Button>
        {submissionMessage && (
          <div className={`mt-4 text-center p-3 rounded-md ${ 
            submissionMessage.type === 'success' ? 'bg-green-900/50 text-green-200' : 
            submissionMessage.type === 'info' ? 'bg-blue-900/50 text-blue-200' :
            'bg-red-900/50 text-red-200'
          }`}>
            {submissionMessage.text}
            {submissionMessage.type === 'error' && submissionMessage.text.includes('profile') && (
              <button
                onClick={retryProfileSync}
                className="ml-4 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Setup Profile
              </button>
            )}
          </div>
        )}
      </div>

      {/* Available Players */}
      <div className="w-full max-w-2xl">
        <div className="bg-black/70 backdrop-blur-sm p-6 border border-gray-800 rounded-none text-center">
          <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text gradient-rotate inline-block" 
            style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
            Available Players
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {availablePlayers.length > 0 ? (
              availablePlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => {
                    const firstEmptyIndex = predictions.findIndex(p => p === null);
                    if (firstEmptyIndex !== -1) {
                      handleSlotFill(firstEmptyIndex, player);
                    }
                  }}
                  className="px-4 py-2 bg-gray-900/80 hover:bg-gray-800/80 text-base text-white font-medium shadow-sm transition-colors border border-gray-800 rounded-none"
                >
                  {player.name}
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
