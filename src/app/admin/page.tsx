"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

function ChevronIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <span style={{ margin: "0 8px", fontSize: 18 }}>
      {direction === "up" ? "▲" : "▼"}
    </span>
  );
}

function LockToggle({ locked, onToggle }: { locked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle(); }}
      style={{
        background: locked ? "#003300" : "#222",
        color: locked ? "#0f0" : "#fff",
        border: "1px solid #0f0",
        borderRadius: 16,
        padding: "4px 12px",
        marginRight: 8,
        cursor: "pointer"
      }}
      aria-pressed={locked}
    >
      {locked ? "Locked" : "Unlocked"}
    </button>
  );
}

function EditViewButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(e); }}
      style={{
        background: "#003300",
        color: "#fff",
        border: "1px solid #0f0",
        borderRadius: 8,
        padding: "4px 12px",
        cursor: "pointer"
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
        color: type === "success" ? "#0f0" : "#f55",
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
        color: "#0f0",
        border: "2px solid #0f0",
        borderRadius: 12,
        marginBottom: 18,
        boxShadow: isExpanded ? "0 0 12px #0f04" : undefined,
        transition: "background 0.2s, box-shadow 0.2s"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 24px",
          cursor: "pointer",
          fontSize: 20,
          fontWeight: 600
        }}
        onClick={onExpand}
      >
        <span style={{ color: "#fff", flex: 1 }}>{tournament.name}</span>
        <ChevronIcon direction={isExpanded ? "up" : "down"} />
        <LockToggle locked={tournament.locked} onToggle={onLockToggle} />
        <EditViewButton onClick={onExpand} />
      </div>
      {isExpanded && (
        <form
          onSubmit={handleSave}
          style={{
            padding: "18px 24px 12px 24px",
            background: "#181",
            borderTop: "1px solid #0f0",
            color: "#111"
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: "#003300", fontWeight: 600, marginRight: 12 }}>
              Cutoff Time:
            </label>
            <input
              type="datetime-local"
              value={cutoff}
              onChange={e => setCutoff(e.target.value)}
              style={{
                background: "#111",
                color: "#0f0",
                border: "1px solid #0f0",
                borderRadius: 6,
                padding: "4px 8px"
              }}
            />
          </div>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ marginBottom: 12 }}>
              <label style={{ color: "#003300", fontWeight: 600, marginRight: 12 }}>{i + 1}st Place:</label>
              <select
                value={results[i]}
                onChange={e => {
                  const newResults = [...results];
                  newResults[i] = e.target.value;
                  setResults(newResults);
                }}
                style={{
                  background: "#111",
                  color: "#0f0",
                  border: "1px solid #0f0",
                  borderRadius: 6,
                  padding: "4px 8px"
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
              border: "1px solid #0f0",
              borderRadius: 8,
              padding: "6px 18px",
              fontWeight: 600,
              marginTop: 8,
              cursor: "pointer"
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
  const router = useRouter();
  const [tournaments, setTournaments] = useState(mockTournaments);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role === "admin") {
        setIsAdmin(true);
      } else {
        router.push("/");
      }
      setLoading(false);
    };
    checkAdmin();
  }, [router]);

  if (loading) return null;
  if (!isAdmin) return null;

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
        color: "#0f0",
        padding: "32px 0 80px 0",
        fontFamily: "monospace",
        position: "relative"
      }}
    >
      <h1 style={{ color: "#0f0", textAlign: "center", marginBottom: 32, fontSize: 32, letterSpacing: 2 }}>
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