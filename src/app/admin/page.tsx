"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { tournamentService } from "@/lib/tournament-service";
import { Tournament, Participant } from "@/types/tournament";
import { formatBonusPredictions } from "@/lib/utils";

// Remove mock data and replace with real state
// const mockTournaments = [...] // REMOVED

// Remove unused mock player options - now using real participants from database

// Function to format ordinal numbers properly
function getOrdinal(num: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const value = num % 100;
  return num + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
}

// Helper function to check if predictions are locked based on cutoff time
function arePredictionsLocked(tournament: Tournament): boolean {
  const now = new Date();
  const cutoffTime = new Date(tournament.cutoff_time);
  return now >= cutoffTime;
}

function LockToggle({ locked, onToggle }: { locked: boolean; onToggle: () => void }) {
  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      width: "100%", 
      height: 50,
      justifyContent: "flex-start"
    }}>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onToggle(); }}
        style={{
          position: "relative",
          width: 80,
          height: 40,
          backgroundColor: locked ? "#228B22" : "#666",
          borderRadius: 20,
          border: "none",
          cursor: "pointer",
          transition: "background-color 0.3s ease",
          marginRight: 16,
          outline: "none",
          flexShrink: 0
        }}
        aria-pressed={locked}
        aria-label={locked ? "Locked" : "Unlocked"}
      >
        <div
          style={{
            position: "absolute",
            top: 4,
            left: locked ? 44 : 4,
            width: 32,
            height: 32,
            backgroundColor: "#fff",
            borderRadius: "50%",
            transition: "left 0.3s ease",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
          }}
        />
      </button>
      <span style={{ 
        color: "#fff", 
        fontSize: 16, 
        fontWeight: 600,
        lineHeight: 1.2,
        display: "flex",
        alignItems: "center",
        height: 50,
        flex: 1
      }}>
        {locked ? "Predictions Locked" : "Predictions Unlocked"}
      </span>
    </div>
  );
}

function InlineMessage({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: type === "error" ? "12px 16px" : "8px 12px", // More padding for errors
        borderRadius: 8,
        background: type === "success" ? "#003300" : "#440000", // Darker red for better contrast
        color: type === "success" ? "#fff" : "#ffaaaa", // Lighter red text for errors
        fontWeight: 600,
        opacity: 0.98,
        transition: "opacity 0.5s",
        fontSize: type === "error" ? "15px" : "14px", // Larger font for errors
        lineHeight: type === "error" ? "1.4" : "1.3", // Better line height for errors
        border: type === "error" ? "1px solid #666" : "none", // Border for errors
        wordBreak: "break-word", // Allow long error messages to wrap
        maxWidth: "100%"
      }}
    >
      {message}
    </div>
  );
}

function TournamentCard({
  tournament,
  participants,
  isExpanded,
  onExpand,
  onLockToggle,
  onSaveResults,
  onRefreshParticipants,
  loading = false,
  currentUserId,
  onToggleVisibility
}: {
  tournament: Tournament;
  participants: Participant[];
  isExpanded: boolean;
  onExpand: () => void;
  onLockToggle: () => void;
  onSaveResults: (cutoff: string, results: string[]) => void;
  onRefreshParticipants: () => void;
  loading?: boolean;
  currentUserId?: string;
  onToggleVisibility: (tournamentId: string, currentActive: boolean) => void;
}) {
  // Helper function to convert ISO datetime to datetime-local format
  const formatDateTimeLocal = (isoDateTime: string): string => {
    const date = new Date(isoDateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const extractTournamentName = (url: string): string => {
    if (!url) return '';
    try {
      // Extract slug from URL like: https://www.start.gg/tournament/tournament-slug/events
      const match = url.match(/\/tournament\/([^\/]+)/);
      if (!match) return '';
      
      const slug = match[1];
      // Convert slug to readable name: replace hyphens with spaces and capitalize
      return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } catch {
      return '';
    }
  };

  const [cutoff, setCutoff] = useState(formatDateTimeLocal(tournament.cutoff_time));
  const [results, setResults] = useState<string[]>(["", "", "", ""]);
  const [bracketReset, setBracketReset] = useState<'upper_no_reset' | 'upper_with_reset' | 'lower_bracket' | null>(null);
  const [grandFinalsScore, setGrandFinalsScore] = useState<'score_3_0' | 'score_3_1' | 'score_3_2' | null>(null);
  const [inlineMessage, setInlineMessage] = useState<null | { message: string; type: "success" | "error" }>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [lastTournamentId, setLastTournamentId] = useState<string>(tournament.id);
  const [startggUrl, setStartggUrl] = useState(tournament.startgg_tournament_url || 'https://www.start.gg/tournament/full-combo-fights-at-buffalo-wild-wings-chino-hills-july/events');
  const [syncingEntrants, setSyncingEntrants] = useState(false);
  // Track the tournament name that corresponds to CURRENT participants (not the URL input)
  const [currentTournamentName, setCurrentTournamentName] = useState(
    tournament.startgg_tournament_url ? extractTournamentName(tournament.startgg_tournament_url) : ''
  );
  const [predictionCount, setPredictionCount] = useState<number | null>(null);
  const [showPredictionsModal, setShowPredictionsModal] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [predictionsError, setPredictionsError] = useState<string | null>(null);

  // Add state for column widths
  const [colWidths, setColWidths] = useState([
    180, // Name
    220, // Email
    340, // Top 4 Slots
    120, // Bonus
  ]);
  const draggingCol = useRef<number | null>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Handle drag start
  const handleDragStart = (idx: number, e: React.MouseEvent<HTMLSpanElement>) => {
    draggingCol.current = idx;
    startX.current = e.clientX;
    startWidth.current = colWidths[idx];
    document.addEventListener('mousemove', handleDrag as any);
    document.addEventListener('mouseup', handleDragEnd as any);
  };
  // Handle drag
  const handleDrag = (e: MouseEvent) => {
    if (draggingCol.current === null) return;
    const delta = e.clientX - startX.current;
    setColWidths(widths => {
      const newWidths = [...widths];
      newWidths[draggingCol.current as number] = Math.max(60, startWidth.current + delta);
      return newWidths;
    });
  };
  // Handle drag end
  const handleDragEnd = () => {
    draggingCol.current = null;
    document.removeEventListener('mousemove', handleDrag as any);
    document.removeEventListener('mouseup', handleDragEnd as any);
  };

  // Update cutoff time only when tournament cutoff_time changes (no reload)
  useEffect(() => {
    setCutoff(formatDateTimeLocal(tournament.cutoff_time));
  }, [tournament.cutoff_time]);

  // Handle tournament changes (reset results and update ID)
  useEffect(() => {
    if (lastTournamentId !== tournament.id) {
      setResults(["", "", "", ""]);
      setBracketReset(null);
      setGrandFinalsScore(null);
      setLastTournamentId(tournament.id);
      // Reset current tournament name to match the new tournament's URL
      setCurrentTournamentName(
        tournament.startgg_tournament_url ? extractTournamentName(tournament.startgg_tournament_url) : ''
      );
    }
  }, [tournament.id, lastTournamentId]);

  // Load existing results only when participants are loaded for the current tournament
  useEffect(() => {
    const loadResults = async () => {
      if (participants.length === 0) {
        console.log('Participants not loaded yet, skipping results load');
        return;
      }
      
      setLoadingResults(true);
      try {
        const response = await fetch(`/api/tournaments/${tournament.id}/results`);
        if (response.ok) {
          const data = await response.json();
          console.log('Results API response:', data);
          
          if (data.results && data.results.position_1_participant_id) {
            // Map participant IDs to names for display
            const resultNames = [
              participants.find(p => p.id === data.results.position_1_participant_id)?.name || "",
              participants.find(p => p.id === data.results.position_2_participant_id)?.name || "",
              participants.find(p => p.id === data.results.position_3_participant_id)?.name || "",
              participants.find(p => p.id === data.results.position_4_participant_id)?.name || ""
            ];
            console.log('Mapped result names:', resultNames);
            setResults(resultNames);
            // Load existing bracket reset value
            setBracketReset(data.results.bracket_reset || null);
            // Load existing grand finals score value
            setGrandFinalsScore(data.results.grand_finals_score || null);
          } else {
            console.log('No results found for tournament');
            setResults(["", "", "", ""]);
            setBracketReset(null);
            setGrandFinalsScore(null);
          }
        } else {
          console.log('Results API returned non-ok response:', response.status);
          setResults(["", "", "", ""]);
        }
      } catch (error) {
        console.error('Error loading existing results:', error);
        setResults(["", "", "", ""]);
      } finally {
        setLoadingResults(false);
      }
    };

    if (participants.length > 0 && tournament.id === lastTournamentId) {
      console.log(`Loading results for tournament ${tournament.id} with ${participants.length} participants`);
      loadResults();
    }
  }, [participants, tournament.id, lastTournamentId]);

  // Fetch prediction count when expanded
  useEffect(() => {
    async function fetchPredictionCount() {
      try {
        const response = await fetch(`/api/tournaments/${tournament.id}/predictions`);
        if (response.ok) {
          const data = await response.json();
          // Assume API returns { count: number }
          setPredictionCount(data.count ?? 0);
        } else {
          setPredictionCount(0);
        }
      } catch {
        setPredictionCount(0);
      }
    }
    if (isExpanded) {
      fetchPredictionCount();
    }
  }, [isExpanded, tournament.id]);

  // Fetch predictions for modal
  const fetchPredictions = async () => {
    setLoadingPredictions(true);
    setPredictionsError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/predictions`);
      if (!res.ok) throw new Error('Failed to fetch predictions');
      const data = await res.json();
      setPredictions(data.predictions || []);
    } catch (err: any) {
      setPredictionsError(err.message || 'Unknown error');
    } finally {
      setLoadingPredictions(false);
    }
  };

  // Open modal and fetch predictions
  const handleShowPredictions = () => {
    setShowPredictionsModal(true);
    fetchPredictions();
  };

  const findParticipantNameById = (participantId: string): string => {
    if (!participantId) return "";
    const participant = participants.find(p => p.id === participantId);
    const name = participant ? participant.name : "";
    console.log(`🔍 Finding participant name for ID ${participantId}:`, name);
    if (!participant) {
      console.error(`❌ Participant ID ${participantId} not found in participants list!`);
      console.log(`📋 Available participants:`, participants.map(p => `${p.name} (${p.id})`));
    }
    return name;
  };

  const findParticipantIdByName = (participantName: string): string => {
    if (!participantName) return "";
    const participant = participants.find(p => p.name === participantName);
    const id = participant ? participant.id : "";
    console.log(`Finding participant ID for name ${participantName}:`, id);
    return id;
  };

  // Fade out message after different durations based on type
  useEffect(() => {
    if (inlineMessage) {
      // Error messages stay longer (10 seconds) so users can read them
      // Success messages stay shorter (5 seconds) 
      const duration = inlineMessage.type === 'error' ? 10000 : 5000;
      const timer = setTimeout(() => setInlineMessage(null), duration);
      return () => clearTimeout(timer);
    }
  }, [inlineMessage]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (results.some(result => !result)) {
      setInlineMessage({ message: "Please fill all positions before saving", type: "error" });
      return;
    }

    try {
      // Save cutoff time first if it changed
      const currentCutoffFormatted = formatDateTimeLocal(tournament.cutoff_time);
      if (cutoff !== currentCutoffFormatted) {
        // Convert datetime-local format back to ISO format for database
        const cutoffIsoFormat = new Date(cutoff).toISOString();
        await fetch(`/api/tournaments/${tournament.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cutoff_time: cutoffIsoFormat })
        });
      }

      // Save results
      const resultData = {
        position_1_participant_id: findParticipantIdByName(results[0]),
        position_2_participant_id: findParticipantIdByName(results[1]),
        position_3_participant_id: findParticipantIdByName(results[2]),
        position_4_participant_id: findParticipantIdByName(results[3]),
        bracket_reset: bracketReset,
        grand_finals_score: grandFinalsScore,
        entered_by: currentUserId || null // Use the current admin user's ID
      };

      const response = await fetch(`/api/tournaments/${tournament.id}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultData)
      });

      if (response.ok) {
        setInlineMessage({ message: "Results saved successfully!", type: "success" });
        // Pass ISO format back to parent component
        const cutoffIsoFormat = new Date(cutoff).toISOString();
        onSaveResults(cutoffIsoFormat, results);
      } else {
        const errorData = await response.json();
        setInlineMessage({ message: `Error: ${errorData.error}`, type: "error" });
      }
    } catch (error) {
      console.error('Error saving results:', error);
      setInlineMessage({ message: "Failed to save results", type: "error" });
    }
  };

  const handleSyncEntrants = async () => {
    if (!startggUrl.trim()) {
      setInlineMessage({ message: "Please enter a Start.gg tournament URL", type: "error" });
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 [SYNC DEBUG] Starting sync for tournament ${tournament.id}`);
      console.log(`🔄 [SYNC DEBUG] Current participants count: ${participants.length}`);
    }
    
    setSyncingEntrants(true);
    try {
      const startTime = Date.now();
      console.log(`🔄 [SYNC DEBUG] Calling sync API at ${new Date().toISOString()}`);
      
      const response = await fetch(`/api/tournaments/${tournament.id}/sync-entrants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startgg_url: startggUrl.trim() })
      });

      const data = await response.json();
      const apiDuration = Date.now() - startTime;
      
      console.log(`🔄 [SYNC DEBUG] API response received after ${apiDuration}ms:`, data);

      if (response.ok && data.success) {
        console.log(`✅ [SYNC DEBUG] API success - participants_added: ${data.participants_added}`);
        
        setInlineMessage({ 
          message: `✅ ${data.message}`, 
          type: "success" 
        });
        
        // Update current tournament name to match the successful sync
        setCurrentTournamentName(extractTournamentName(startggUrl.trim()));
        console.log(`🔄 [SYNC DEBUG] Tournament name updated, waiting 1500ms for refresh...`);
        
        // Refresh participants data without page reload
        setTimeout(() => {
          console.log(`🔄 [SYNC DEBUG] Timeout reached, calling onRefreshParticipants...`);
          onRefreshParticipants();
        }, 1500);
      } else {
        console.error(`❌ [SYNC DEBUG] API failed:`, data);
        setInlineMessage({ 
          message: `❌ ${data.error || 'Failed to sync entrants'}`, 
          type: "error" 
        });
      }
    } catch (error) {
      console.error('❌ [SYNC DEBUG] Network error:', error);
      setInlineMessage({ 
        message: "❌ Network error while syncing entrants", 
        type: "error" 
      });
    } finally {
      setSyncingEntrants(false);
      console.log(`🔄 [SYNC DEBUG] Sync operation completed`);
    }
  };

  const handleClearResults = async () => {
    // Confirmation dialog - this is destructive action
    const isConfirmed = window.confirm(
      `⚠️ Clear all results for "${tournament.name}"?\n\nThis will:\n• Delete tournament results\n• Reset all prediction scores to unprocessed\n• Cannot be undone\n\nProceed?`
    );
    
    if (!isConfirmed) {
      return;
    }

    try {
      console.log(`🗑️ Admin: Clearing results for tournament ${tournament.id}`);
      
      const response = await fetch(`/api/tournaments/${tournament.id}/results`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Clear results response:', data);
        
        // Reset form fields to empty state
        setResults(["", "", "", ""]);
        setBracketReset(null);
        setGrandFinalsScore(null);
        
        // Show success message
        setInlineMessage({ 
          message: `Results cleared successfully! ${data.message || ''}`, 
          type: "success" 
        });
      } else {
        const errorData = await response.json();
        console.error('❌ Error clearing results:', errorData);
        setInlineMessage({ 
          message: `Failed to clear results: ${errorData.error}`, 
          type: "error" 
        });
      }
    } catch (error) {
      console.error('❌ Network error clearing results:', error);
      setInlineMessage({ 
        message: "Network error: Failed to clear results", 
        type: "error" 
      });
    }
  };

  const isLocked = arePredictionsLocked(tournament);

  // Helper to determine tournament status banner text (copied from main page)
  const getTournamentStatusText = (tournament: Tournament, hasResults: boolean): string => {
    if (hasResults) {
      return 'VIEW RESULTS';
    }
    const cutoffTime = new Date(tournament.cutoff_time);
    const now = new Date();
    if (cutoffTime > now) {
      return 'MAKE PREDICTIONS';
    }
    return 'RESULTS PENDING';
  };

  // Determine if tournament has results (same as main page logic)
  const hasResults = Boolean(
    tournament &&
    participants.length > 0 &&
    // Check if any participant is in the results (simple check, can be improved)
    results.some(r => r && r.length > 0)
  );

  return (
    <div
      style={{
        background: isExpanded ? "#222" : "#111",
        color: "#fff",
        border: "2px solid #228B22",
        borderRadius: 12,
        marginBottom: 18,
        boxShadow: isExpanded ? "0 0 12px #00330044" : undefined,
        transition: "background 0.2s, box-shadow 0.2s",
        opacity: loading ? 0.7 : 1
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 220px 180px",
          alignItems: "center",
          gap: "20px",
          padding: "20px 28px",
          cursor: "pointer",
          fontSize: 20,
          fontWeight: 600,
          minHeight: 90
        }}
        onClick={onExpand}
      >
        <span style={{ 
          color: "#fff", 
          lineHeight: 1.2,
          gridColumn: '1 / span 3',
          textAlign: 'center',
          width: '100%',
          fontSize: '2.5rem',
          fontWeight: 900
        }}>
          {tournament.name}
        </span>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  margin: '8px 0 0 0',
  gridColumn: '1 / span 3',
}}>
  <span style={{ color: '#b5e0b5', fontWeight: 500, fontSize: '1.2rem', lineHeight: 1.0 }}>
    {tournament.active ? `(${getTournamentStatusText(tournament, hasResults)})` : '(INACTIVE)'}
  </span>
  {/* Visibility toggle (single eye icon + switch) */}
  <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 12 }}>
    {/* Single eye icon that changes state */}
    <span
      title={tournament.active ? 'Tournament is visible' : 'Tournament is hidden'}
      style={{
        width: 20,
        height: 20,
        opacity: 1,
        transition: 'opacity 0.2s',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={e => {
        e.stopPropagation();
        if (!loading) onToggleVisibility(tournament.id, tournament.active);
      }}
    >
      {tournament.active ? (
        // Open eye for visible
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
        </svg>
      ) : (
        // Closed eye for hidden
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
        </svg>
      )}
    </span>
    {/* Toggle switch */}
    <span
      title={tournament.active ? 'Click to hide tournament' : 'Click to show tournament'}
      style={{
        display: 'inline-block',
        width: 28,
        height: 16,
        borderRadius: 10,
        background: tournament.active ? '#22c55e' : '#666',
        border: '2px solid #228B22',
        margin: '0 2px',
        position: 'relative',
        verticalAlign: 'middle',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s, border 0.2s',
        boxShadow: '0 0 4px #228B22',
      }}
      onClick={e => {
        e.stopPropagation();
        if (!loading) onToggleVisibility(tournament.id, tournament.active);
      }}
    >
      <span
        style={{
          display: 'block',
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 1.5,
          left: tournament.active ? 12 : 2,
          transition: 'left 0.2s',
          boxShadow: '0 1px 4px #0006',
        }}
      />
    </span>
  </span>
</div>
        {/* Removed LockToggle from header */}
      </div>
      {isExpanded && (
        <form
          onSubmit={handleSave}
          style={{
            padding: "18px 24px 12px 24px",
            background: "#181818",
            borderTop: "1px solid #228B22",
            color: "#fff",
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12
          }}
        >
          {/* Entrants Count and Tournament Name */}
          <div style={{ marginBottom: 12, color: "#ccc", fontSize: 16 }}>
            <span style={{ color: '#fff', fontWeight: 700, background: '#003300', borderRadius: 6, padding: '2px 8px', marginRight: 4 }}>
              {loading ? 'Loading...' : `${participants.length} entrants`}
              {loading && <span style={{ marginLeft: 4 }}>⟳</span>}
            </span>
            {currentTournamentName ? `currently added from ${currentTournamentName}` : 'currently added'}
          </div>
          
          {/* Start.gg Tournament URL Section */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 16, gap: "12px" }}>
            <input
              type="url"
              value={startggUrl}
              onChange={e => setStartggUrl(e.target.value)}
              placeholder="https://www.start.gg/tournament/tournament-name/events"
              style={{
                background: "#111",
                color: "#fff",
                border: "1px solid #228B22",
                borderRadius: 6,
                padding: "12px 16px",
                fontSize: 16,
                flex: 1,
                boxSizing: "border-box"
              }}
            />
            <button
              type="button"
              onClick={handleSyncEntrants}
              disabled={syncingEntrants || !startggUrl.trim()}
              style={{
                background: syncingEntrants ? "#444" : "#003300",
                color: "#fff",
                border: "1px solid #228B22",
                borderRadius: 6,
                padding: "12px 20px",
                fontWeight: 600,
                cursor: (syncingEntrants || !startggUrl.trim()) ? "not-allowed" : "pointer",
                fontSize: 16,
              }}
            >
              {syncingEntrants ? "Updating..." : "Update Entrants"}
            </button>
          </div>
          <hr style={{ border: 0, borderTop: '1px solid #228B22', height: 1, margin: '16px 0', marginLeft: -24, marginRight: -24, width: 'calc(100% + 48px)' }} />
          {/* Cutoff time input and other controls here... */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 16, gap: 24 }}>
            <label style={{ color: "#fff", fontWeight: 600, marginRight: 16, minWidth: 80, fontSize: 20 }}>
              Cutoff:
            </label>
            <input
              type="datetime-local"
              value={cutoff}
              onChange={e => setCutoff(e.target.value)}
              style={{
                background: "#111",
                color: "#fff",
                border: "1px solid #228B22",
                borderRadius: 6,
                padding: "12px 16px",
                fontSize: 18,
                width: "100%",
                boxSizing: "border-box"
              }}
            />
            <span style={{ marginLeft: 12 }}>
              <LockToggle locked={isLocked} onToggle={onLockToggle} />
            </span>
          </div>
          {/* Prediction count and show predictions button row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 20 }}>
              {predictionCount === null ? 'Loading predictions...' : `${predictionCount} predictions currently submitted`}
            </span>
            <button
              type="button"
              style={{
                background: '#222',
                color: '#fff',
                border: '1px solid #228B22',
                borderRadius: 6,
                padding: '12px 20px',
                fontSize: 18,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s',
                marginLeft: 4
              }}
              onClick={handleShowPredictions}
            >
              Show Submitted Predictions
            </button>
          </div>
          <hr style={{ border: 0, borderTop: '1px solid #228B22', height: 1, margin: '16px 0', marginLeft: -24, marginRight: -24, width: 'calc(100% + 48px)' }} />

          {/* Predictions Modal */}
          {showPredictionsModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.85)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                background: '#181818',
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                width: 'min(90vw, 900px)',
                maxHeight: '80vh',
                overflowY: 'auto',
                padding: 32,
                position: 'relative',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* X button */}
                <button
                  onClick={() => setShowPredictionsModal(false)}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    background: 'transparent',
                    color: '#fff',
                    border: 'none',
                    fontSize: 28,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
                <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 18, textAlign: 'center' }}>
                  Submitted Predictions
                </h2>
                {loadingPredictions ? (
                  <div style={{ textAlign: 'center', fontSize: 18, margin: '32px 0' }}>Loading...</div>
                ) : predictionsError ? (
                  <div style={{ color: 'red', textAlign: 'center', margin: '32px 0' }}>{predictionsError}</div>
                ) : (
                  <>
                    {/* Debug: Log predictions data */}
                    {console.log("Predictions data:", predictions)}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #228B22' }}>
                          {['Name', 'Email', 'Predictions'].map((label, idx) => (
                            <th
                              key={label}
                              style={{
                                padding: 8,
                                textAlign: 'left',
                                fontWeight: 700,
                                position: 'relative',
                                width: colWidths[idx],
                                minWidth: 60,
                                userSelect: 'none',
                              }}
                            >
                              {label}
                              <span
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: 0,
                                  height: '100%',
                                  width: 8,
                                  cursor: 'col-resize',
                                  zIndex: 2,
                                  display: 'inline-block',
                                }}
                                onMouseDown={e => handleDragStart(idx, e)}
                              />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {predictions.length === 0 ? (
                          <tr><td colSpan={3} style={{ textAlign: 'center' }}>No predictions submitted yet</td></tr>
                        ) : (
                          predictions.map((prediction, idx) => (
                            <tr key={prediction.id || idx} style={{ background: idx % 2 === 0 ? '#333333' : '#181818' }}>
                              <td style={{ width: colWidths[0], minWidth: 60 }}>{prediction.profiles?.display_name || "—"}</td>
                              <td
                                style={{
                                  width: colWidths[1],
                                  minWidth: 60,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: colWidths[1],
                                }}
                                title={prediction.profiles?.email || undefined}
                              >
                                {prediction.profiles?.email || "—"}
                              </td>
                              <td style={{ width: colWidths[2], minWidth: 60 }}>{[
                                getParticipantName(participants, prediction.slot_1_participant_id),
                                getParticipantName(participants, prediction.slot_2_participant_id),
                                getParticipantName(participants, prediction.slot_3_participant_id),
                                getParticipantName(participants, prediction.slot_4_participant_id)
                              ].filter(Boolean).join(" > ") + formatBonusPredictions(prediction.bracket_reset, prediction.grand_finals_score)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </>
                )}
                <button
                  onClick={() => setShowPredictionsModal(false)}
                  style={{
                    margin: '0 auto',
                    marginTop: 12,
                    background: '#228B22',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '12px 32px',
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'block',
                  }}
                >
                  Close Window
                </button>
              </div>
            </div>
          )}
          {loadingResults ? (
            <div style={{ color: "#aaa", textAlign: "center", padding: "20px" }}>
              Loading existing results...
            </div>
          ) : (
            [0, 1, 2, 3].map(i => (
              <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                <label style={{ color: "#fff", fontWeight: 600, marginRight: 0, minWidth: 80, fontSize: 20 }}>
                  {getOrdinal(i + 1)}:
                </label>
                <select
                  value={results[i]}
                  onChange={e => {
                    const newResults = [...results];
                    newResults[i] = e.target.value;
                    setResults(newResults);
                  }}
                  style={{
                    background: "#111",
                    color: "#fff",
                    border: "1px solid #228B22",
                    borderRadius: 6,
                    padding: "12px 16px",
                    fontSize: 18,
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                >
                  <option value="">Select Player</option>
                  {participants.map(participant => (
                    <option key={participant.id} value={participant.name}>
                      {participant.name}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
          
          {/* Bracket Reset Section */}
          {!loadingResults && (
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <label style={{ color: "#fff", fontWeight: 600, marginRight: 28, minWidth: 80, fontSize: 20 }}>
                Bracket:
              </label>
              <select
                value={bracketReset || ""}
                onChange={e => {
                  const value = e.target.value;
                  setBracketReset(value === "" ? null : value as 'upper_no_reset' | 'upper_with_reset' | 'lower_bracket');
                }}
                style={{
                  background: "#111",
                  color: "#fff",
                  border: "1px solid #228B22",
                  borderRadius: 6,
                  padding: "12px 16px",
                  fontSize: 18,
                  width: "100%",
                  boxSizing: "border-box"
                }}
              >
                <option value="">Select Outcome (Optional)</option>
                <option value="upper_no_reset">👑 Upper bracket winner (no reset)</option>
                <option value="upper_with_reset">🔄 Upper bracket winner (with reset)</option>
                <option value="lower_bracket">⚡ Lower bracket winner</option>
              </select>
            </div>
          )}
          
          {/* Grand Finals Score Section */}
          {!loadingResults && (
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <label style={{ color: "#fff", fontWeight: 600, marginRight: 16, minWidth: 80, fontSize: 20 }}>
                Score:
              </label>
              <select
                value={grandFinalsScore || ""}
                onChange={e => {
                  const value = e.target.value;
                  setGrandFinalsScore(value === "" ? null : value as 'score_3_0' | 'score_3_1' | 'score_3_2');
                }}
                style={{
                  background: "#111",
                  color: "#fff",
                  border: "1px solid #228B22",
                  borderRadius: 6,
                  padding: "12px 16px",
                  fontSize: 18,
                  width: "100%",
                  boxSizing: "border-box"
                }}
              >
                <option value="">Select Score (Optional)</option>
                <option value="score_3_0">🧹 3-0 (sweep)</option>
                <option value="score_3_1">🎯 3-1 (close series)</option>
                <option value="score_3_2">🔥 3-2 (very close series)</option>
              </select>
            </div>
          )}
          
          <div style={{ display: "flex", gap: "12px", marginTop: 16 }}>
            <button
              type="submit"
              disabled={loadingResults}
              style={{
                background: "#003300",
                color: "#fff",
                border: "1px solid #228B22",
                borderRadius: 8,
                padding: "16px 0",
                fontWeight: 700,
                cursor: loadingResults ? "not-allowed" : "pointer",
                fontSize: 20,
                flex: 1,
                opacity: loadingResults ? 0.6 : 1
              }}
            >
              {loadingResults ? "Loading..." : "Save Results"}
            </button>
            <button
              type="button"
              onClick={handleClearResults}
              disabled={loadingResults}
              style={{
                background: "#330000",
                color: "#fff",
                border: "1px solid #884444",
                borderRadius: 8,
                padding: "16px 0",
                fontWeight: 700,
                cursor: loadingResults ? "not-allowed" : "pointer",
                fontSize: 20,
                flex: 1,
                opacity: loadingResults ? 0.6 : 1,
                transition: "background 0.2s, border-color 0.2s"
              }}
              onMouseEnter={(e) => {
                if (!loadingResults) {
                  e.currentTarget.style.background = "#440000";
                  e.currentTarget.style.borderColor = "#aa5555";
                }
              }}
              onMouseLeave={(e) => {
                if (!loadingResults) {
                  e.currentTarget.style.background = "#330000";
                  e.currentTarget.style.borderColor = "#884444";
                }
              }}
            >
              Clear Results
            </button>
          </div>
          {inlineMessage && <InlineMessage message={inlineMessage.message} type={inlineMessage.type} />}
        </form>
      )}
    </div>
  );
}

// Add abbreviation mapping at the top of the file
const TOURNAMENT_ABBREVIATIONS: Record<string, string> = {
  'Tekken 8': 'TK8',
  'Dragon Ball FighterZ': 'DBFZ',
  'Mortal Kombat 1': 'MK1',
  'Street Fighter 6': 'SF6',
  'Guilty Gear Strive': 'GGS',
  'Under Night In Birth II': 'UNIB',
  'Fatal Fury: City of the Wolves': 'FFCW',
  // Add more as needed
};

// Helper to map participant ID to name
function getParticipantName(participants: Participant[], id: string): string {
  if (!id) return "—";
  const p = participants?.find(p => p.id === id);
  return p?.name || id || "—";
}

export default function AdminDashboardPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participants, setParticipants] = useState<Record<string, Participant[]>>({});
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null); // ID of selected tournament
  const [hoveredTab, setHoveredTab] = useState<number | null>(null);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState<Record<string, boolean>>({});
  const [updatingVisibility, setUpdatingVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (role !== "admin") {
        router.replace("/");
      }
    }
  }, [user, role, loading, router]);

  // Fetch tournaments on component mount
  useEffect(() => {
    const fetchTournaments = async () => {
      if (!user || role !== "admin") return;
      try {
        setLoadingTournaments(true);
        const tournamentsData = await tournamentService.getTournaments(false); // Fetch all tournaments (active and inactive)
        setTournaments(tournamentsData);
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      } finally {
        setLoadingTournaments(false);
      }
    };
    fetchTournaments();
  }, [user, role]);

  // Fetch participants for a specific tournament
  const fetchParticipants = async (tournamentId: string, forceRefresh = false) => {
    if (!forceRefresh && (participants[tournamentId] || loadingParticipants[tournamentId])) {
      return; // Already loaded or loading
    }
    setLoadingParticipants(prev => ({ ...prev, [tournamentId]: true }));
    try {
      const participantsData = await tournamentService.getTournamentParticipants(tournamentId);
      setParticipants(prev => ({ ...prev, [tournamentId]: participantsData }));
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoadingParticipants(prev => ({ ...prev, [tournamentId]: false }));
    }
  };

  // Set initial selected tournament when tournaments are first loaded
  useEffect(() => {
    if (tournaments.length > 0 && !selectedTournamentId) {
      const sortedTournaments = [...tournaments].sort((a, b) => {
        if (a.active === b.active) return 0;
        return a.active ? -1 : 1;
      });
      if (sortedTournaments.length > 0) {
        setSelectedTournamentId(sortedTournaments[0].id);
        fetchParticipants(sortedTournaments[0].id, true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournaments.length, selectedTournamentId]);

  // Toggle tournament visibility
  const toggleTournamentVisibility = async (tournamentId: string, currentActive: boolean) => {
    setUpdatingVisibility(prev => ({ ...prev, [tournamentId]: true }));
    try {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/toggle-visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (response.ok) {
        const { tournament } = await response.json();
        // Update the tournament in the local state
        setTournaments(prev => prev.map(t => 
          t.id === tournamentId ? { ...t, active: tournament.active } : t
        ));
        console.log(`✅ Tournament visibility updated: ${tournament.name} is now ${tournament.active ? 'visible' : 'hidden'}`);
      } else {
        console.error('❌ Failed to update tournament visibility');
      }
    } catch (error) {
      console.error('❌ Error updating tournament visibility:', error);
    } finally {
      setUpdatingVisibility(prev => ({ ...prev, [tournamentId]: false }));
    }
  };

  // Add: Handler to update cutoff time for locking/unlocking predictions
  const handleLockToggle = async (tournament: Tournament) => {
    // Determine new cutoff time
    let newCutoff: string;
    if (arePredictionsLocked(tournament)) {
      // Currently locked, so unlock: set cutoff 1 month in the future
      const future = new Date();
      future.setMonth(future.getMonth() + 1);
      newCutoff = future.toISOString();
    } else {
      // Currently unlocked, so lock: set cutoff to now
      newCutoff = new Date().toISOString();
    }
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cutoff_time: newCutoff })
      });
      if (response.ok) {
        const updated = await response.json();
        // Update local state
        setTournaments(prev => prev.map(t => t.id === tournament.id ? { ...t, cutoff_time: newCutoff } : t));
      } else {
        // Optionally show error
        console.error('Failed to update cutoff time');
      }
    } catch (err) {
      console.error('Error updating cutoff time:', err);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#111",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18
      }}>
        Loading admin dashboard...
      </div>
    );
  }

  if (!user || role !== "admin") return null;

  // Tabbed navigation UI
  // Sort tournaments: active first, then inactive
  const sortedTournaments = [...tournaments].sort((a, b) => {
    if (a.active === b.active) return 0;
    return a.active ? -1 : 1;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#fff",
        padding: "32px 0 80px 0",
        fontFamily: "monospace",
        position: "relative"
      }}
    >
      <h1 style={{ color: "#fff", textAlign: "center", marginBottom: 32, fontSize: 32, letterSpacing: 2, fontWeight: 900 }}>
        Administrator Portal
      </h1>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "2px solid #228B22",
            marginBottom: 24,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: '#181818',
            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.18)',
            overflowX: 'auto', // Allow horizontal scroll if needed
            scrollbarWidth: 'thin',
            scrollbarColor: '#228B22 #181818',
          }}>
          {sortedTournaments.map((tournament, idx) => {
            const isSelected = selectedTournamentId === tournament.id;
            const isActive = tournament.active;
            return (
              <div key={tournament.id} style={{ position: 'relative' }}>
                <button
                  onMouseEnter={() => setHoveredTab(idx)}
                  onMouseLeave={() => setHoveredTab(null)}
                  onFocus={() => setHoveredTab(idx)}
                  onBlur={() => setHoveredTab(null)}
                  onClick={() => {
                    if (selectedTournamentId === tournament.id) {
                      // If clicking the same tab, force refresh the data
                      fetchParticipants(tournament.id, true);
                    } else {
                      // If clicking a different tab, switch to it and fetch data immediately
                      setSelectedTournamentId(tournament.id);
                      fetchParticipants(tournament.id, true);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: isSelected ? (isActive ? '#003300' : '#333') : '#181818',
                    color: isSelected ? '#fff' : '#ccc',
                    border: 'none',
                    borderBottom: isSelected ? '4px solid #228B22' : '4px solid transparent',
                    fontWeight: 700,
                    fontSize: 20,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'background 0.2s, color 0.2s, border-bottom 0.2s',
                    borderTopLeftRadius: 6,
                    borderTopRightRadius: 6,
                    opacity: isActive ? 1 : 0.5,
                    position: 'relative',
                    whiteSpace: 'nowrap',
                  }}
                  aria-label={tournament.name + (isActive ? ' (Visible)' : ' (Hidden)')}
                >
                  {/* Tournament abbreviation */}
                  <span style={{ fontWeight: 900, letterSpacing: 1, fontSize: 18 }}>
                    {TOURNAMENT_ABBREVIATIONS[tournament.name] || tournament.name.slice(0, 4).toUpperCase()}
                    <span style={{ 
                      marginLeft: 4, 
                      fontSize: 14, 
                      width: '14px',
                      display: 'inline-block',
                      textAlign: 'center',
                      opacity: loadingParticipants[tournament.id] ? 1 : 0,
                      transition: 'opacity 0.2s'
                    }}>
                      ⟳
                    </span>
                  </span>
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '-2.5em',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#228B22',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px #0008',
                      opacity: hoveredTab === idx ? 1 : 0,
                      pointerEvents: 'none',
                      zIndex: 11,
                      transition: 'opacity 0.2s',
                    }}>
                      Click to refresh data
                    </div>
                  )}
                </button>
                {/* Floating tooltip for full name */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-2.5em',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#222',
                    color: '#fff',
                    padding: '6px 18px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px #0008',
                    opacity: hoveredTab === idx ? 1 : 0,
                    pointerEvents: 'none',
                    zIndex: 10,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {tournament.name} {!tournament.active && "(Hidden)"}
                </div>
              </div>
            );
          })}
        </div>
        {/* Card for selected tournament */}
        {loadingTournaments ? (
          <div style={{ color: "#aaa", textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: 18 }}>Loading tournaments...</div>
          </div>
        ) : tournaments.length === 0 ? (
          <div style={{ color: "#aaa", textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: 18 }}>No tournaments found</div>
          </div>
        ) : (
          <TournamentCard
            key={selectedTournamentId}
            tournament={sortedTournaments.find(t => t.id === selectedTournamentId) || sortedTournaments[0]}
            participants={selectedTournamentId ? participants[selectedTournamentId] || [] : []}
            isExpanded={true}
            onExpand={() => {}}
            onLockToggle={() => handleLockToggle(sortedTournaments.find(t => t.id === selectedTournamentId) || sortedTournaments[0])}
            onSaveResults={(cutoff, results) => {}}
            onRefreshParticipants={() => selectedTournamentId && fetchParticipants(selectedTournamentId, true)}
            loading={selectedTournamentId ? loadingParticipants[selectedTournamentId] : false}
            currentUserId={user?.id}
            onToggleVisibility={(tournamentId, currentActive) => toggleTournamentVisibility(tournamentId, currentActive)}
          />
        )}
      </div>
      {/* Move the button here as a regular element, not fixed */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 48, marginBottom: 24 }}>
        <button
          style={{
            background: "#003300",
            color: "#fff",
            border: "2px solid #fff",
            borderRadius: 12,
            padding: "12px 48px",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 1,
            cursor: "pointer",
          }}
          onClick={() => {
            window.location.href = "/";
          }}
        >
          Back to Homepage
        </button>
      </div>
    </div>
  );
} 