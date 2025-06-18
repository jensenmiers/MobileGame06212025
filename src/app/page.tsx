"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { SocialLogin } from "@/components/Auth/SocialLogin";
import { tournamentService } from "@/lib/tournament-service";
import { Tournament } from "@/types/tournament";
import { gameUiDetailsMap } from "@/lib/game-utils";

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  // Toggle to show/hide the text labels under each game icon
  const SHOW_TITLES = false;

  useEffect(() => {
    async function fetchTournaments() {
      const data = await tournamentService.getTournaments();
      setTournaments(data);
    }
    fetchTournaments();
  }, []);

  // Initialize selectedGame from URL on mount
  useEffect(() => {
    const gameSlug = searchParams.get('game');
    const allSlugs = Object.values(gameUiDetailsMap).map(details => details.slug);
    if (gameSlug && allSlugs.includes(gameSlug)) {
      setSelectedGame(gameSlug);
    }
  }, [searchParams]);

  const handleGameSelect = (game: string) => {
    const newSelectedGame = selectedGame === game ? null : game;
    setSelectedGame(newSelectedGame);
    // Update URL without page reload
    const params = new URLSearchParams(searchParams.toString());
    if (newSelectedGame) {
      params.set('game', newSelectedGame);
    } else {
      params.delete('game');
    }
    router.push(`/?${params.toString()}`, { scroll: false });
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col items-center justify-start p-4 pt-12 relative overflow-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-40 w-96 h-96 bg-blue-500/10 filter blur-3xl animate-pulse"></div>
        <div className="absolute -right-40 -bottom-40 w-96 h-96 bg-green-500/10 filter blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-4xl mx-auto">
        <Card className="bg-black/70 border-gray-800 backdrop-blur-sm rounded-none">
          <CardHeader className="space-y-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex justify-center mb-4 w-full px-4 md:px-0">
                <div className="flex items-center space-x-3 sm:space-x-4 max-w-max -ml-2 sm:ml-0">
                  <div className="flex-shrink-0 h-[4.5rem] w-auto aspect-square relative">
                    <div className="animate-slow-rotate w-full h-full flex items-center">
                      <div className="relative w-full h-16">
                        <Image
                          src="/images/fullComboLogo.png"
                          alt="Full Combo Logo"
                          fill
                          className="object-contain"
                          priority
                        />
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-5xl font-bold gradient-rotate gradient-text-fix text-center leading-tight">
                    Bracket Challenge
                  </CardTitle>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Social Login Section */}
            <div className="flex flex-col items-center space-y-6">
              <SocialLogin />
            </div>
            
            {/* Game Selection */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">Choose Your Tournament</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-md mx-auto">
              {tournaments.map((tournament) => {
                const uiDetails = gameUiDetailsMap[tournament.name];
                if (!uiDetails) return null; // Don't render if no UI details are mapped

                return (
                  <div key={tournament.id} className="flex flex-col items-center">
                    <button
                      onClick={() => handleGameSelect(uiDetails.slug)}
                      className={`transition-all ${SHOW_TITLES ? 'mb-2' : ''} ${selectedGame === uiDetails.slug ? 'outline outline-1 outline-offset-2 outline-green-500' : ''}`}
                    >
                      <div className="relative w-[8.4rem] h-[8.4rem]">
                        <Image
                          src={uiDetails.imageUrl}
                          alt={tournament.name}
                          fill
                          className="object-contain"
                          priority
                        />
                      </div>
                    </button>
                    {SHOW_TITLES && (<span className="text-white text-sm">{uiDetails.title}</span>)}
                  </div>
                );
              })}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <div className="w-full sm:w-auto relative">
                {!selectedGame && <div className="absolute inset-0 bg-black/30 rounded-lg z-10 pointer-events-none"></div>}
                <Link 
                  href={selectedGame ? `/${selectedGame}/prediction` : '#'}
                  className={`w-full sm:w-auto ${!selectedGame ? 'pointer-events-none' : ''}`}
                >
                  <Button 
                    size="lg" 
                    disabled={!selectedGame}
                    className={`w-full font-semibold px-8 py-6 text-lg transition-all duration-300 transform ${
                      selectedGame 
                        ? 'text-white gradient-rotate' 
                        : 'text-gray-400 opacity-50 gradient-rotate'
                    }`}
                    style={{
                      boxShadow: selectedGame ? '0 4px 20px -5px rgba(0, 172, 78, 0.4)' : 'none'
                    }}
                  >
                    Start Prediction
                  </Button>
                </Link>
              </div>
              <div className="w-full sm:w-auto relative">
                {!selectedGame && <div className="absolute inset-0 bg-black/30 rounded-lg z-10 pointer-events-none"></div>}
                <Link 
                  href={selectedGame ? `/${selectedGame}/leaderboard` : '#'}
                  className={`w-full sm:w-auto ${!selectedGame ? 'pointer-events-none' : ''}`}
                >
                  <Button 
                    variant="ghost" 
                    size="lg" 
                    disabled={!selectedGame}
                    className={`w-full px-8 py-6 text-lg transition-all duration-300 transform ${
                      selectedGame 
                        ? 'bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gray-700 text-gray-200 hover:from-gray-800/80 hover:to-gray-700/80 hover:text-white' 
                        : 'bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gray-700 text-gray-400 opacity-50'
                    } backdrop-blur-sm`}
                  >
                    View Leaderboard
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
