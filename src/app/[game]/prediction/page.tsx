"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, notFound, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Slots from "@/components/Prediction/Slots";
import { tournamentService } from "@/lib/tournament-service";
import { Player, Prediction, Tournament } from "@/types/tournament";
import { gameUiDetailsMap } from "@/lib/game-utils";
import { useAuth } from "@/context/AuthContext";
import { syncUserProfile } from "@/lib/tournament-service";

export default function PredictionPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [predictions, setPredictions] = useState<(Player | null)[]>(Array(4).fill(null));
  const [bracketReset, setBracketReset] = useState<'upper_no_reset' | 'upper_with_reset' | 'lower_bracket' | null>(null);
  const [grandFinalsScore, setGrandFinalsScore] = useState<'score_3_0' | 'score_3_1' | 'score_3_2' | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [tournamentTitle, setTournamentTitle] = useState<string>("");
  const [existingPrediction, setExistingPrediction] = useState<Prediction | null>(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isPredictionsClosed, setIsPredictionsClosed] = useState(false);
  const [areResultsPosted, setAreResultsPosted] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const isComplete = predictions.every(prediction => prediction !== null);
  const params = useParams();
  const gameSlug = params.game as string;

  const tournamentName = Object.keys(gameUiDetailsMap).find(
    key => gameUiDetailsMap[key].slug === gameSlug
  );

  // Helper function to check if predictions are closed
  const checkPredictionsClosed = (tournament: Tournament): boolean => {
    const cutoffTime = new Date(tournament.cutoff_time);
    const now = new Date();
    return cutoffTime <= now;
  };

  // Helper function to check if results have been posted
  const checkResultsPosted = async (tournamentId: string): Promise<boolean> => {
    try {
      const results = await tournamentService.getResultsForTournament(tournamentId);
      return results !== null;
    } catch (error) {
      console.error('Error checking results status:', error);
      return false;
    }
  };

  // Helper function to map prediction IDs to Player objects
  const mapPredictionToPlayers = (prediction: Prediction, players: Player[]): (Player | null)[] => {
    return [
      players.find(p => p.id === prediction.slot_1_participant_id) || null,
      players.find(p => p.id === prediction.slot_2_participant_id) || null,
      players.find(p => p.id === prediction.slot_3_participant_id) || null,
      players.find(p => p.id === prediction.slot_4_participant_id) || null,
    ];
  };

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
        setTournament(currentTournament);
        
        const isPredictionsClosed = checkPredictionsClosed(currentTournament);
        setIsPredictionsClosed(isPredictionsClosed);
        
        // Check if results have been posted
        const areResultsPosted = await checkResultsPosted(currentTournament.id);
        setAreResultsPosted(areResultsPosted);
        
        // Redirect to leaderboard if both cutoff passed AND results posted
        if (isPredictionsClosed && areResultsPosted) {
          console.log('🚀 Redirecting to leaderboard: cutoff passed and results posted');
          router.push(`/${gameSlug}/leaderboard`);
          return;
        }
        
        setIsLoadingPrediction(true);
        
        try {
          // Load both participants and existing prediction in parallel
          const [participantData, existingPredictionData] = await Promise.all([
            tournamentService.getTournamentParticipants(currentTournament.id),
            session?.user ? tournamentService.getUserPrediction(currentTournament.id, session.user.id) : Promise.resolve(null)
          ]);

          // Convert Participant to Player format
          const playersData = participantData.map(participant => ({
            id: participant.id,
            name: participant.name,
            seed: participant.seed || 0,
            avatarUrl: participant.avatar_url
          }));
          setPlayers(playersData);

          // Store existing prediction data
          setExistingPrediction(existingPredictionData);

          // If we have existing prediction data, populate the form
          if (existingPredictionData && playersData.length > 0) {
            const mappedPredictions = mapPredictionToPlayers(existingPredictionData, playersData);
            setPredictions(mappedPredictions);
            setBracketReset(existingPredictionData.bracket_reset || null);
            setGrandFinalsScore(existingPredictionData.grand_finals_score || null);
            
            console.log('🔄 Loaded existing prediction:', {
              prediction_id: existingPredictionData.id,
              submission_count: existingPredictionData.submission_count,
              mapped_players: mappedPredictions.map(p => p?.name || 'null'),
              predictions_closed: checkPredictionsClosed(currentTournament)
            });
          }
        } catch (error) {
          console.error('Error fetching tournament data:', error);
        } finally {
          setIsLoadingPrediction(false);
        }
      } else {
        console.error(`${tournamentName} tournament not found.`);
      }
    };

    fetchTournamentData();
  }, [gameSlug, tournamentName, session?.user]);

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

  const handleBracketResetChange = (value: 'upper_no_reset' | 'upper_with_reset' | 'lower_bracket' | null) => {
    setBracketReset(value);
    setSubmissionMessage(null);
  };

  const handleGrandFinalsScoreChange = (value: 'score_3_0' | 'score_3_1' | 'score_3_2' | null) => {
    setGrandFinalsScore(value);
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
      bracket_reset: bracketReset,
      grand_finals_score: grandFinalsScore,
    };

    // Debug logging for production issues
    console.log('🔍 Debug: Submitting prediction with data:', {
      ...predictionData,
      user_email: session.user.email,
      session_valid: !!session,
      predictions_selected: predictions.map(p => ({ id: p?.id, name: p?.name })),
      bracket_reset_selected: bracketReset,
      grand_finals_score_selected: grandFinalsScore
    });

    setIsSubmitting(true);
    setSubmissionMessage(null);

    try {
      await tournamentService.submitPrediction(predictionData);
      setSubmissionMessage({ type: 'success', text: 'Prediction submitted successfully! You can update it until the top eight starts.' });
    } catch (error) {
      const err = error as Error;
      console.error('❌ Failed to submit prediction:', error);
      console.error('❌ Error details:', {
        error_message: err.message,
        error_code: (err as any).code,
        error_details: (err as any).details,
        user_id: session.user.id,
        tournament_id: tournamentId
      });
      
      // Check if this is a profile-related error
      if (err.message?.includes('profile') || (err as any).code === 'PGRST301' || (err as any).code === '23503') {
        setSubmissionMessage({ 
          type: 'error', 
          text: 'Your account profile is not set up yet. Please refresh the page and try again, or sign out and back in.' 
        });
      } else {
        setSubmissionMessage({ 
          type: 'error', 
          text: `Failed to submit prediction. Please try again. Error: ${err.message || 'Unknown error'}` 
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
      const err = error as Error;
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
      {/* Simplified background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        <div className="absolute -right-40 -bottom-40 w-96 h-96 bg-green-500/10 filter blur-3xl animate-pulse"></div>
      </div>
      
      {/* Back Button */}
      <div className="w-full max-w-4xl mx-auto mb-6">
        <Link 
          href={`/?game=${gameSlug}`}
          className="inline-flex items-center text-gray-300 hover:text-white transition-colors bg-gray-800/50 hover:bg-gray-700/50 px-4 py-2 rounded-lg"
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
          <span>Predict the top 4 players for</span><br />
          <span className="block text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold text-yellow-400 mt-1">{tournamentTitle}</span>
        </h2>
      </div>

      {/* Prediction Slots */}
      <div className="w-full max-w-2xl mb-8">
        {isPredictionsClosed && (
          <div className="text-center mb-4 p-4 bg-yellow-900/20 border border-yellow-600/50 rounded-lg">
            <div className="text-yellow-300 font-semibold text-lg mb-2">
              🔒 Predictions Closed
            </div>
            <div className="text-yellow-200 text-sm">
              {areResultsPosted ? (
                "The tournament has concluded. Check the leaderboard for final results!"
              ) : (
                "The cutoff time has passed. You can view your submitted predictions below, but no changes can be made."
              )}
            </div>
          </div>
        )}
        {isLoadingPrediction && (
          <div className="text-center mb-4">
            <div className="text-gray-300 flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading your predictions...
            </div>
          </div>
        )}
        <Slots 
          predictions={predictions.map(p => p?.name || "")}
          onSlotFill={(slotIndex, playerName) => {
            if (isPredictionsClosed) return; // Prevent changes when closed
            const player = players.find(p => p.name === playerName);
            if (player) handleSlotFill(slotIndex, player);
          }}
          onSlotClear={(slotIndex) => {
            if (isPredictionsClosed) return; // Prevent changes when closed
            handleSlotClear(slotIndex);
          }}
          availablePlayers={availablePlayers.map(p => p.name)}
          onBracketResetChange={(value) => {
            if (isPredictionsClosed) return; // Prevent changes when closed
            handleBracketResetChange(value);
          }}
          bracketReset={bracketReset}
          onGrandFinalsScoreChange={(value) => {
            if (isPredictionsClosed) return; // Prevent changes when closed
            handleGrandFinalsScoreChange(value);
          }}
          grandFinalsScore={grandFinalsScore}
          readonly={isPredictionsClosed}
        />
      </div>

      {/* Submit Button & Feedback */}
      <div className="w-full max-w-2xl mb-12">
        {!isPredictionsClosed ? (
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
                  <span>{existingPrediction ? 'Update Your Prediction' : 'Submit Predictions'}</span>
                </>
              ) : (
                'Select All Players to Continue'
              )}
            </span>
            {isComplete && !isSubmitting && session?.user && (
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            )}
          </Button>
        ) : (
          <div className="text-center p-6 bg-gray-900/50 border border-gray-600 rounded-lg">
            <div className="text-gray-300 text-lg mb-2">
              {existingPrediction ? (
                <>
                  <span className="text-green-400 font-semibold">✅ Your Predictions Submitted</span>
                  <div className="text-sm text-gray-400 mt-1">
                    Submitted {existingPrediction.submission_count} time{existingPrediction.submission_count > 1 ? 's' : ''}
                  </div>
                </>
              ) : (
                <span className="text-red-400 font-semibold">❌ No Predictions Submitted</span>
              )}
            </div>
            <div className="text-gray-400 text-sm">
              {areResultsPosted ? (
                "Tournament has concluded. Check the leaderboard for final results!"
              ) : (
                "Tournament cutoff has passed. Waiting for results to be posted."
              )}
            </div>
          </div>
        )}
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
    </div>
  );
}
