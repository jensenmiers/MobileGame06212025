"use client";

interface AllPlayersProps {
  selectedPlayer: string | null;
  onPlayerSelect: (player: string) => void;
}

// Placeholder data for 16 players
const players = [
  "Alex Thunder", "Blaze Storm", "Cyber Knight", "Dragon Fire",
  "Echo Phantom", "Frost Bite", "Ghost Rider", "Hunter X",
  "Ice Phoenix", "Jet Stream", "King Cobra", "Lightning Bolt",
  "Mystic Wolf", "Nova Star", "Omega Force", "Phoenix Rising"
];

export default function AllPlayers({ selectedPlayer, onPlayerSelect }: AllPlayersProps) {
  return (
    <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
      {players.map((player, index) => (
        <div
          key={index}
          onClick={() => onPlayerSelect(player)}
          className={`
            p-4 rounded-lg cursor-pointer transition-all duration-200
            bg-white/10 backdrop-blur border border-white/20
            hover:bg-white/20 hover:border-white/30 hover:scale-[1.02]
            ${selectedPlayer === player 
              ? 'bg-blue-500/30 border-blue-400/50 shadow-lg shadow-blue-500/20' 
              : ''
            }
          `}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">{player}</h3>
              <p className="text-sm text-gray-300">Player #{index + 1}</p>
            </div>
            <div className="text-2xl">
              {/* Different emojis for variety */}
              {index % 4 === 0 && "⚡"}
              {index % 4 === 1 && "🔥"}
              {index % 4 === 2 && "❄️"}
              {index % 4 === 3 && "⭐"}
            </div>
          </div>
          {selectedPlayer === player && (
            <div className="mt-2 text-xs text-blue-200 font-medium">
              Selected - Click a slot to place
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 