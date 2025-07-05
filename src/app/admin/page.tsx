"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// Mock tournament data
const mockTournaments = [
  {
    id: 1,
    name: "EVO 2025",
    locked: false,
    cutoff: "2025-06-21T12:00",
    results: ["", "", "", ""]
  },
  {
    id: 2,
    name: "Combo Breaker 2025",
    locked: true,
    cutoff: "2025-05-15T10:00",
    results: ["", "", "", ""]
  },
  {
    id: 3,
    name: "Frosty Faustings 2025",
    locked: false,
    cutoff: "2025-02-10T09:00",
    results: ["", "", "", ""]
  }
];

const playerOptions = [
  "Player A",
  "Player B",
  "Player C",
  "Player D",
  "Player E"
];

// Function to format ordinal numbers properly
function getOrdinal(num: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const value = num % 100;
  return num + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
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
  isExpanded,
  onExpand,
  onLockToggle,
  onSaveResults
}: {
  tournament: any;
  isExpanded: boolean;
  onExpand: () => void;
  onLockToggle: () => void;
  onSaveResults: (cutoff: string, results: string[]) => void;
}) {
  const [cutoff, setCutoff] = useState(tournament.cutoff);
  const [results, setResults] = useState([...tournament.results]);
  const [inlineMessage, setInlineMessage] = useState<null | { message: string; type: "success" | "error" }>(null);

  useEffect(() => {
    setCutoff(tournament.cutoff);
    setResults([...tournament.results]);
  }, [tournament]);

  // Fade out message after 3 seconds
  useEffect(() => {
    if (inlineMessage) {
      const timer = setTimeout(() => setInlineMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [inlineMessage]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate save
    onSaveResults(cutoff, results);
    setInlineMessage({ message: "Results saved!", type: "success" });
  };

  return (
    <div
      style={{
        background: isExpanded ? "#222" : "#111",
        color: "#fff",
        border: "2px solid #228B22",
        borderRadius: 12,
        marginBottom: 18,
        boxShadow: isExpanded ? "0 0 12px #00330044" : undefined,
        transition: "background 0.2s, box-shadow 0.2s"
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
        <LockToggle locked={tournament.locked} onToggle={onLockToggle} />
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
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <label style={{ color: "#fff", fontWeight: 600, marginRight: 16, minWidth: 120 }}>{getOrdinal(i + 1)} Place:</label>
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
                {playerOptions.map(player => (
                  <option key={player} value={player}>{player}</option>
                ))}
              </select>
            </div>
          ))}
          <button
            type="submit"
            style={{
              background: "#003300",
              color: "#fff",
              border: "1px solid #228B22",
              borderRadius: 8,
              padding: "16px 0",
              fontWeight: 700,
              marginTop: 16,
              cursor: "pointer",
              fontSize: 20,
              width: "100%"
            }}
          >
            Save Results
          </button>
          {inlineMessage && <InlineMessage message={inlineMessage.message} type={inlineMessage.type} />}
        </form>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [tournaments, setTournaments] = useState(mockTournaments);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (role !== "admin") {
        router.replace("/");
      }
    }
  }, [user, role, loading, router]);

  if (loading || !user || role !== "admin") return null;

  // Accordion logic: only one expanded at a time
  const handleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleLockToggle = (id: number) => {
    setTournaments(prev =>
      prev.map(t =>
        t.id === id ? { ...t, locked: !t.locked } : t
      )
    );
  };

  const handleSaveResults = (id: number, cutoff: string, results: string[]) => {
    setTournaments(prev =>
      prev.map(t =>
        t.id === id ? { ...t, cutoff, results: [...results] } : t
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
        Tournament Admin Dashboard
      </h1>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {tournaments.map(tournament => (
          <TournamentCard
            key={tournament.id}
            tournament={tournament}
            isExpanded={expandedId === tournament.id}
            onExpand={() => handleExpand(tournament.id)}
            onLockToggle={() => handleLockToggle(tournament.id)}
            onSaveResults={(cutoff, results) => handleSaveResults(tournament.id, cutoff, results)}
          />
        ))}
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