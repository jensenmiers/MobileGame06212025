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
        padding: "6px 12px",
        borderRadius: 6,
        background: type === "success" ? "#003300" : "#330000",
        color: type === "success" ? "#fff" : "#f55",
        fontWeight: 600,
        opacity: 0.95,
        transition: "opacity 0.5s"
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
  loading = false,
  currentUserId
}: {
  tournament: Tournament;
  participants: Participant[];
  isExpanded: boolean;
  onExpand: () => void;
  onLockToggle: () => void;
  onSaveResults: (cutoff: string, results: string[]) => void;
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

  const [cutoff, setCutoff] = useState(formatDateTimeLocal(tournament.cutoff_time));
  const [results, setResults] = useState<string[]>(["", "", "", ""]);
  const [inlineMessage, setInlineMessage] = useState<null | { message: string; type: "success" | "error" }>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [lastTournamentId, setLastTournamentId] = useState<string>(tournament.id);

  // Update cutoff time only when tournament cutoff_time changes (no reload)
  useEffect(() => {
    setCutoff(formatDateTimeLocal(tournament.cutoff_time));
  }, [tournament.cutoff_time]);

  // Handle tournament changes (reset results and update ID)
  useEffect(() => {
    if (lastTournamentId !== tournament.id) {
      setResults(["", "", "", ""]);
      setLastTournamentId(tournament.id);
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
          } else {
            console.log('No results found for tournament');
            setResults(["", "", "", ""]);
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

  // Fade out message after 3 seconds
  useEffect(() => {
    if (inlineMessage) {
      const timer = setTimeout(() => setInlineMessage(null), 3000);
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
          <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
            <label style={{ color: "#fff", fontWeight: 600, marginRight: 16, minWidth: 120 }}>
              Cutoff Time:
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
          {loadingResults ? (
            <div style={{ color: "#aaa", textAlign: "center", padding: "20px" }}>
              Loading existing results...
            </div>
          ) : (
            [0, 1, 2, 3].map(i => (
              <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                <label style={{ color: "#fff", fontWeight: 600, marginRight: 16, minWidth: 120 }}>
                  {getOrdinal(i + 1)} Place:
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

export default function AdminDashboardPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participants, setParticipants] = useState<Record<string, Participant[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
  const fetchParticipants = async (tournamentId: string) => {
    if (participants[tournamentId] || loadingParticipants[tournamentId]) {
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

  // Accordion logic: only one expanded at a time
  const handleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      fetchParticipants(id); // Load participants when expanding
    }
  };

  const handleLockToggle = async (tournamentId: string) => {
    console.log('🔄 Toggle clicked for tournament:', tournamentId);
    
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) {
      console.error('❌ Tournament not found:', tournamentId);
      return;
    }

    try {
      const isCurrentlyLocked = arePredictionsLocked(tournament);
      const now = new Date();
      
      console.log('🔒 Current lock status:', isCurrentlyLocked ? 'LOCKED' : 'UNLOCKED');
      
      // If currently locked, unlock by setting cutoff 1 month from now
      // If currently unlocked, lock by setting cutoff to now
      const newCutoff = isCurrentlyLocked 
        ? (() => {
            const oneMonthFromNow = new Date(now);
            oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
            return oneMonthFromNow.toISOString();
          })() // 1 month from now
        : now.toISOString(); // Now (locks immediately)

      console.log('⏰ New cutoff time:', newCutoff);
      console.log('🌐 Making API request to:', `/api/tournaments/${tournamentId}`);

      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cutoff_time: newCutoff })
      });

      console.log('📡 API Response status:', response.status);
      
      if (response.ok) {
        console.log('✅ Toggle successful - updating local state');
        // Update local state
        setTournaments(prev =>
          prev.map(t =>
            t.id === tournamentId ? { ...t, cutoff_time: newCutoff } : t
          )
        );
      } else {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        alert(`Failed to toggle lock status: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Network/JavaScript Error:', error);
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSaveResults = (tournamentId: string, cutoff: string, results: string[]) => {
    // Update local tournament state
    setTournaments(prev =>
      prev.map(t =>
        t.id === tournamentId ? { ...t, cutoff_time: cutoff } : t
      )
    );
  };

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
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {loadingTournaments ? (
          <div style={{ color: "#aaa", textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: 18 }}>Loading tournaments...</div>
          </div>
        ) : tournaments.length === 0 ? (
          <div style={{ color: "#aaa", textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: 18 }}>No tournaments found</div>
          </div>
        ) : (
          tournaments.map(tournament => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              participants={participants[tournament.id] || []}
              isExpanded={expandedId === tournament.id}
              onExpand={() => handleExpand(tournament.id)}
              onLockToggle={() => handleLockToggle(tournament.id)}
              onSaveResults={(cutoff, results) => handleSaveResults(tournament.id, cutoff, results)}
              loading={loadingParticipants[tournament.id]}
              currentUserId={user?.id}
            />
          ))
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