"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { tournamentService } from "@/lib/tournament-service";
import { Tournament, Participant } from "@/types/tournament";

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

function EditViewButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(e); }}
      style={{
        background: "#003300",
        color: "#fff",
        border: "1px solid #228B22",
        borderRadius: 10,
        padding: "0 20px",
        cursor: "pointer",
        fontSize: 16,
        fontWeight: 600,
        lineHeight: 1.2,
        height: 50,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "nowrap"
      }}
    >
      Edit/View Results
    </button>
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
  currentUserId
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
  const [startggUrl, setStartggUrl] = useState(tournament.startgg_tournament_url || '');
  const [syncingEntrants, setSyncingEntrants] = useState(false);
  // Track the tournament name that corresponds to CURRENT participants (not the URL input)
  const [currentTournamentName, setCurrentTournamentName] = useState(
    tournament.startgg_tournament_url ? extractTournamentName(tournament.startgg_tournament_url) : ''
  );
  const [predictionCount, setPredictionCount] = useState<number | null>(null);

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
          gridTemplateColumns: "minmax(0, 1fr) 220px 180px",
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
          lineHeight: 1.2
        }}>
          {tournament.name}
        </span>
        <LockToggle locked={isLocked} onToggle={onLockToggle} />
        <EditViewButton onClick={onExpand} />
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
          {(participants.length > 0 || currentTournamentName) && (
            <div style={{ marginBottom: 12, color: "#ccc", fontSize: 16 }}>
              {participants.length} entrants currently added{currentTournamentName ? ` from ${currentTournamentName}` : ''}
            </div>
          )}
          
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
          {/* Cutoff time input and other controls here... */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
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
          </div>
          {/* Prediction count display: below cutoff, above 1st position */}
          <div style={{
            marginBottom: 16,
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            background: "#003300",
            borderRadius: 6,
            padding: "8px 14px",
            display: "inline-block"
          }}>
            {predictionCount === null ? 'Loading predictions...' : `${predictionCount} predictions currently submitted`}
          </div>
          {loadingResults ? (
            <div style={{ color: "#aaa", textAlign: "center", padding: "20px" }}>
              Loading existing results...
            </div>
          ) : (
            [0, 1, 2, 3].map(i => (
              <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                <label style={{ color: "#fff", fontWeight: 600, marginRight: 16, minWidth: 80, fontSize: 24 }}>
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
              <label style={{ color: "#fff", fontWeight: 600, marginRight: 16, minWidth: 80, fontSize: 24 }}>
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
                  width: "75%",
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
              <label style={{ color: "#fff", fontWeight: 600, marginRight: 16, minWidth: 80, fontSize: 24 }}>
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
                  width: "75%",
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
  // Add more as needed
};

export default function AdminDashboardPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participants, setParticipants] = useState<Record<string, Participant[]>>({});
  const [selectedTab, setSelectedTab] = useState<number>(0); // index of selected tournament
  const [hoveredTab, setHoveredTab] = useState<number | null>(null);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState<Record<string, boolean>>({});

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
        const tournamentsData = await tournamentService.getTournaments();
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

  // Fetch participants for selected tournament when tab changes
  useEffect(() => {
    if (tournaments.length > 0) {
      const selectedTournament = tournaments[selectedTab];
      if (selectedTournament) {
        fetchParticipants(selectedTournament.id, false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, tournaments.length]);

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
        <div style={{ display: "flex", borderBottom: "2px solid #228B22", marginBottom: 24, position: 'relative' }}>
          {tournaments.map((tournament, idx) => (
            <div key={tournament.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                onMouseEnter={() => setHoveredTab(idx)}
                onMouseLeave={() => setHoveredTab(null)}
                onFocus={() => setHoveredTab(idx)}
                onBlur={() => setHoveredTab(null)}
                onClick={() => setSelectedTab(idx)}
                style={{
                  background:
                    selectedTab === idx
                      ? "#003300"
                      : hoveredTab === idx
                        ? "#2a2a2a"
                        : "#181818",
                  color: selectedTab === idx ? "#fff" : "#ccc",
                  border: "none",
                  borderBottom: selectedTab === idx ? "4px solid #228B22" : "4px solid transparent",
                  fontWeight: 700,
                  fontSize: 18,
                  padding: "4px 32px",
                  cursor: "pointer",
                  outline: "none",
                  transition: "background 0.2s, color 0.2s, border-bottom 0.2s",
                  borderTopLeftRadius: 6,
                  borderTopRightRadius: 6,
                }}
              >
                {TOURNAMENT_ABBREVIATIONS[tournament.name] || tournament.name.slice(0, 4).toUpperCase()}
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
                  fontSize: 16,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px #0008',
                  opacity: hoveredTab === idx ? 1 : 0,
                  pointerEvents: 'none',
                  zIndex: 10,
                  transition: 'opacity 0.2s',
                }}
              >
                {tournament.name}
              </div>
            </div>
          ))}
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
            key={tournaments[selectedTab].id}
            tournament={tournaments[selectedTab]}
            participants={participants[tournaments[selectedTab].id] || []}
            isExpanded={true}
            onExpand={() => {}}
            onLockToggle={() => {}}
            onSaveResults={(cutoff, results) => {}}
            onRefreshParticipants={() => fetchParticipants(tournaments[selectedTab].id, true)}
            loading={loadingParticipants[tournaments[selectedTab].id]}
            currentUserId={user?.id}
          />
        )}
      </div>
      <button
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#003300",
          color: "#fff",
          border: "2px solid #fff",
          borderRadius: 12,
          padding: "12px 48px",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: 1,
          cursor: "pointer",
          zIndex: 100
        }}
        onClick={() => {
          window.location.href = "/";
        }}
      >
        Back to Homepage
      </button>
    </div>
  );
} 