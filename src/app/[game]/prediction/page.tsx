"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Slots from "@/components/Prediction/Slots";
import { tournamentService } from "@/lib/tournament-service";
import { Player, CutoffPeriod, Prediction } from "@/types/tournament";
import { gameUiDetailsMap } from "@/lib/game-utils";
import { useAuth } from "@/context/AuthContext";
import { 
  getCutoffPeriodInfo, 
  getActiveCutoffPeriod,
  getCutoffPeriodDisplayText,
  getCutoffPeriodColorClass,
  formatTimeRemaining
} from "@/lib/tournament-utils";

export default function PredictionPage() {
  const { session } = useAuth();
  const [predictions, setPredictions] = useState<(Player | null)[]>(Array(4).fill(null));
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournament, setTournament] = useState<any>(null);
  const [tournamentTitle, setTournamentTitle] = useState<string>("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Two-cutoff system state
  const [currentCutoffPeriod, setCurrentCutoffPeriod] = useState<CutoffPeriod | null>(null);
  const [cutoffPeriodInfo, setCutoffPeriodInfo] = useState<any>(null);
  const [cutoff1Prediction, setCutoff1Prediction] = useState<Prediction | null>(null);
  const [cutoff2Prediction, setCutoff2Prediction] = useState<Prediction | null>(null);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [lastSavedPredictions, setLastSavedPredictions] = useState<(Player | null)[]>(Array(4).fill(null));

  const isComplete = predictions.every(prediction => prediction !== null);
  const params = useParams();
  const gameSlug = params.game as string;

  const tournamentName = Object.keys(gameUiDetailsMap).find(
    key => gameUiDetailsMap[key].slug === gameSlug
  );

  // Auto-save draft with debouncing
  const autoSaveDraft = useCallback(async () => {
    if (!session?.user || !tournament || !currentCutoffPeriod || isReadOnlyMode) return;

    const predictionData = {
      user_id: session.user.id,
      tournament_id: tournament.id,
      cutoff_period: currentCutoffPeriod,
      slot_1_participant_id: predictions[0]?.id || null,
      slot_2_participant_id: predictions[1]?.id || null,
      slot_3_participant_id: predictions[2]?.id || null,
      slot_4_participant_id: predictions[3]?.id || null,
    };

    try {
      await tournamentService.savePredictionDraft(predictionData);
      setLastSavedPredictions([...predictions]);
    } catch (error) {
      console.error('Failed to auto-save draft:', error);
    }
  }, [session?.user, tournament, currentCutoffPeriod, predictions, isReadOnlyMode]);

  // Debounced auto-save
  useEffect(() => {
    if (predictions.some(p => p !== null)) {
      const timer = setTimeout(autoSaveDraft, 1000);
      return () => clearTimeout(timer);
    }
  }, [predictions, autoSaveDraft]);

  // Fetch tournament data and setup
  useEffect(() => {
    if (!tournamentName) {
      return notFound();
    }
    setTournamentTitle(tournamentName);

    const fetchTournamentData = async () => {
      const tournaments = await tournamentService.getTournaments();
      const currentTournament = tournaments.find(t => t.name === tournamentName);

      if (currentTournament) {
        setTournament(currentTournament);
        const participantData = await tournamentService.getTournamentParticipants(currentTournament.id);
        setPlayers(participantData);

        // Determine current cutoff period
        const periodInfo = getCutoffPeriodInfo(currentTournament);
        setCutoffPeriodInfo(periodInfo);
        
        const activePeriod = getActiveCutoffPeriod(currentTournament);
        setCurrentCutoffPeriod(activePeriod);
        setIsReadOnlyMode(periodInfo.current === 'after');

        // Load existing predictions
        if (session?.user) {
          await loadExistingPredictions(session.user.id, currentTournament.id, periodInfo, participantData);
        }
      } else {
        console.error(`${tournamentName} tournament not found.`);
      }
    };

    fetchTournamentData();
  }, [gameSlug, tournamentName, session?.user]);

  // Load existing predictions based on cutoff period
  const loadExistingPredictions = async (
    userId: string, 
    tournamentId: string, 
    periodInfo: any,
    participantData: Player[]
  ) => {
    try {
      // Load cutoff 1 prediction
      const cutoff1 = await tournamentService.getUserPrediction(userId, tournamentId, 'first');
      setCutoff1Prediction(cutoff1);

      // Load cutoff 2 prediction
      const cutoff2 = await tournamentService.getUserPrediction(userId, tournamentId, 'second');
      setCutoff2Prediction(cutoff2);

      // Determine which prediction to show for editing
      if (periodInfo.current === 'before' && cutoff1) {
        // Before first cutoff - load cutoff 1 prediction
        loadPredictionIntoSlots(cutoff1, participantData);
      } else if (periodInfo.current === 'first') {
        // Between cutoffs - start with cutoff 2 or prefill from cutoff 1
        if (cutoff2) {
          loadPredictionIntoSlots(cutoff2, participantData);
        } else if (cutoff1) {
          // Auto-prefill from cutoff 1
          loadPredictionIntoSlots(cutoff1, participantData);
        }
      } else if (periodInfo.current === 'after') {
        // After cutoffs - show most recent prediction in read-only
        const mostRecent = cutoff2 || cutoff1;
        if (mostRecent) {
          loadPredictionIntoSlots(mostRecent, participantData);
        }
      }
    } catch (error) {
      console.error('Failed to load existing predictions:', error);
    }
  };

  // Helper to load prediction data into UI slots
  const loadPredictionIntoSlots = (prediction: Prediction, participantData: Player[]) => {
    const slots = [
      prediction.slot_1_participant_id,
      prediction.slot_2_participant_id, 
      prediction.slot_3_participant_id,
      prediction.slot_4_participant_id
    ];

    const loadedPredictions = slots.map(participantId => {
      if (!participantId) return null;
      return participantData.find(p => p.id === participantId) || null;
    });

    setPredictions(loadedPredictions);
    setLastSavedPredictions(loadedPredictions);
  };

  // Update cutoff period info periodically
  useEffect(() => {
    if (!tournament) return;

    const updateCutoffInfo = () => {
      const periodInfo = getCutoffPeriodInfo(tournament);
      setCutoffPeriodInfo(periodInfo);
      
      const activePeriod = getActiveCutoffPeriod(tournament);
      setCurrentCutoffPeriod(activePeriod);
      setIsReadOnlyMode(periodInfo.current === 'after');
    };

    const interval = setInterval(updateCutoffInfo, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [tournament]);

  if (!tournamentName) {
    return null;
  }

  const handleSlotFill = (slotIndex: number, player: Player) => {
    if (isReadOnlyMode) return;
    
    const newPredictions = [...predictions];
    if (newPredictions.some(p => p?.id === player.id)) return;
    newPredictions[slotIndex] = player;
    setPredictions(newPredictions);
    setSubmissionMessage(null);
  };

  const handleSlotClear = (slotIndex: number) => {
    if (isReadOnlyMode) return;
    
    const newPredictions = [...predictions];
    newPredictions[slotIndex] = null;
    setPredictions(newPredictions);
    setSubmissionMessage(null);
  };

  const handleSubmit = async () => {
    if (!isComplete || !tournament || !currentCutoffPeriod || isSubmitting || isReadOnlyMode) return;

    if (!session?.user) {
      setSubmissionMessage({ type: 'error', text: 'You must be logged in to submit a prediction.' });
      return;
    }

    const predictionData = {
      user_id: session.user.id,
      tournament_id: tournament.id,
      cutoff_period: currentCutoffPeriod,
      slot_1_participant_id: predictions[0]!.id,
      slot_2_participant_id: predictions[1]!.id,
      slot_3_participant_id: predictions[2]!.id,
      slot_4_participant_id: predictions[3]!.id,
    };

    setIsSubmitting(true);
    setSubmissionMessage(null);

    try {
      await tournamentService.submitPrediction(predictionData);
      setSubmissionMessage({ 
        type: 'success', 
        text: `Prediction submitted successfully! ${currentCutoffPeriod === 'first' ? 'You can update it until the second cutoff.' : 'Submissions are now locked.'}` 
      });
      
      // Refresh predictions after submission
      if (session?.user && tournament) {
        const periodInfo = getCutoffPeriodInfo(tournament);
        await loadExistingPredictions(session.user.id, tournament.id, periodInfo, players);
      }
    } catch (error: any) {
      console.error('Failed to submit prediction:', error);
      
      if (error.message?.includes('Retrying')) {
        setIsRetrying(true);
        setSubmissionMessage({ type: 'error', text: 'Retrying submission...' });
      } else {
        setSubmissionMessage({ type: 'error', text: 'Failed to submit prediction. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
      setIsRetrying(false);
    }
  };

  const getButtonText = () => {
    if (isSubmitting || isRetrying) return 'Submitting...';
    if (!session?.user) return 'Log In to Submit';
    if (!isComplete) return 'Select All Players to Continue';
    
    if (currentCutoffPeriod === 'first') {
      return cutoff1Prediction?.is_complete ? 'Update Prediction' : 'Submit Initial Prediction';
    } else if (currentCutoffPeriod === 'second') {
      return cutoff2Prediction?.is_complete ? 'Update Prediction' : 'Submit Updated Prediction';
    }
    
    return 'Submit Prediction';
  };

  const predictedPlayerIds = new Set(predictions.filter(p => p).map(p => p!.id));
  const availablePlayers = players.filter(player => !predictedPlayerIds.has(player.id));

  const getSavedIndicator = (index: number) => {
    const currentPlayer = predictions[index];
    const savedPlayer = lastSavedPredictions[index];
    
    if (currentPlayer && savedPlayer && currentPlayer.id === savedPlayer.id) {
      return (
        <span className="text-xs text-green-400 ml-2 opacity-70">
          <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          SAVED
        </span>
      );
    }
    return null;
  };

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

      {/* Header with Cutoff Period Badge */}
      <div className="w-full max-w-2xl mb-8 text-center">
        <div className="w-full">
          <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text gradient-rotate mb-2 mx-auto" 
            style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>
            Bracket Master
          </h1>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-4 w-full">
          {tournamentTitle}
        </h2>
        
        {/* Cutoff Period Badge */}
        {cutoffPeriodInfo && (
          <div className="mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCutoffPeriodColorClass(cutoffPeriodInfo)}`}>
              {getCutoffPeriodDisplayText(cutoffPeriodInfo)}
              {cutoffPeriodInfo.timeUntilNextCutoff && cutoffPeriodInfo.current !== 'after' && (
                <span className="ml-2 text-xs opacity-90">
                  ({formatTimeRemaining(cutoffPeriodInfo.timeUntilNextCutoff)} remaining)
                </span>
              )}
            </span>
          </div>
        )}
        
        <p className="text-xl text-gray-300 mb-8 w-full">
          {isReadOnlyMode ? 'View Your Final Predictions' : 'Predict the top 4 players!'}
        </p>
      </div>

      {/* Show locked cutoff 1 prediction when in cutoff 2 period */}
      {cutoffPeriodInfo?.current === 'first' && cutoff1Prediction && (
        <div className="w-full max-w-2xl mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm p-4 border border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Your Cutoff 1 Prediction (Locked)
            </h3>
            <div className="space-y-2">
              {[
                cutoff1Prediction.slot_1_participant_id,
                cutoff1Prediction.slot_2_participant_id,
                cutoff1Prediction.slot_3_participant_id,
                cutoff1Prediction.slot_4_participant_id
              ].map((participantId, index) => {
                const player = players.find(p => p.id === participantId);
                return (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-700/30 rounded">
                    <span className="text-sm font-medium">{['1st', '2nd', '3rd', '4th'][index]}</span>
                    <span className="text-gray-200">{player?.name || 'No selection'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Show both predictions in read-only mode */}
      {isReadOnlyMode && (cutoff1Prediction || cutoff2Prediction) && (
        <div className="w-full max-w-2xl mb-8 space-y-6">
          {cutoff1Prediction && (
            <div className="bg-blue-900/20 backdrop-blur-sm p-4 border border-blue-700/50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-200 mb-3">Cutoff 1 Prediction</h3>
              <div className="space-y-2">
                {[
                  cutoff1Prediction.slot_1_participant_id,
                  cutoff1Prediction.slot_2_participant_id,
                  cutoff1Prediction.slot_3_participant_id,
                  cutoff1Prediction.slot_4_participant_id
                ].map((participantId, index) => {
                  const player = players.find(p => p.id === participantId);
                  return (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-blue-800/20 rounded">
                      <span className="text-sm font-medium">{['1st', '2nd', '3rd', '4th'][index]}</span>
                      <span className="text-blue-100">{player?.name || 'No selection'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {cutoff2Prediction && (
            <div className="bg-green-900/20 backdrop-blur-sm p-4 border border-green-700/50 rounded-lg">
              <h3 className="text-lg font-semibold text-green-200 mb-3">Cutoff 2 Prediction</h3>
              <div className="space-y-2">
                {[
                  cutoff2Prediction.slot_1_participant_id,
                  cutoff2Prediction.slot_2_participant_id,
                  cutoff2Prediction.slot_3_participant_id,
                  cutoff2Prediction.slot_4_participant_id
                ].map((participantId, index) => {
                  const player = players.find(p => p.id === participantId);
                  return (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-green-800/20 rounded">
                      <span className="text-sm font-medium">{['1st', '2nd', '3rd', '4th'][index]}</span>
                      <span className="text-green-100">{player?.name || 'No selection'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Prediction Slots (hidden in read-only mode) */}
      {!isReadOnlyMode && (
        <div className="w-full max-w-2xl mb-8">
          <Slots 
            predictions={predictions.map((p, index) => 
              p?.name ? `${p.name}${getSavedIndicator(index) ? '' : ''}` : ""
            )}
            onSlotFill={(slotIndex, playerName) => {
              const player = players.find(p => p.name === playerName);
              if (player) handleSlotFill(slotIndex, player);
            }}
            onSlotClear={handleSlotClear}
            availablePlayers={availablePlayers.map(p => p.name)}
          />
          
          {/* Show saved indicators */}
          <div className="mt-2 space-y-1">
            {predictions.map((_, index) => (
              <div key={index} className="text-right">
                {getSavedIndicator(index)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button & Feedback (hidden in read-only mode) */}
      {!isReadOnlyMode && (
        <div className="w-full max-w-2xl mb-12">
          <Button
            onClick={handleSubmit}
            disabled={!isComplete || isSubmitting || !session?.user || !currentCutoffPeriod}
            className={`relative w-full py-6 text-2xl font-bold overflow-hidden transition-all duration-300 transform gradient-rotate ${ 
              isComplete && !isSubmitting && session?.user && currentCutoffPeriod
                ? 'hover:scale-[1.02] hover:shadow-2xl' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            style={{
              boxShadow: isComplete && !isSubmitting && session?.user && currentCutoffPeriod
                ? '0 10px 25px -5px rgba(0, 172, 78, 0.4)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {getButtonText()}
              {isComplete && !isSubmitting && session?.user && currentCutoffPeriod && (
                <span className="text-yellow-300">🏆</span>
              )}
            </span>
            {isComplete && !isSubmitting && session?.user && currentCutoffPeriod && (
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            )}
          </Button>
          {submissionMessage && (
            <div className={`mt-4 text-center p-3 rounded-md ${ 
              submissionMessage.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'
            }`}>
              {submissionMessage.text}
            </div>
          )}
        </div>
      )}

      {/* Available Players (hidden in read-only mode) */}
      {!isReadOnlyMode && (
        <div className="w-full max-w-2xl">
          <div className="bg-black/70 backdrop-blur-sm p-6 border border-gray-800 rounded-none">
            <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text gradient-rotate" 
              style={{
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
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
      )}
    </div>
  );
}
