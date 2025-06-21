"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { SocialLogin } from "@/components/Auth/SocialLogin";
import { useAuth } from "@/context/AuthContext";
import { tournamentService, syncUserProfile } from "@/lib/tournament-service";
import { Tournament } from "@/types/tournament";
import { gameUiDetailsMap } from "@/lib/game-utils";

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
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

  // Sync user profile when user is authenticated on homepage
  useEffect(() => {
    if (user) {
      syncUserProfile(user.id).catch(error => {
        console.error('Profile sync failed on homepage:', error);
        // Don't show error to user, as this is background sync
      });
    }
  }, [user]);

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

  const handleLogout = async () => {
    await signOut();
    // Clear any selected game and redirect to clean main page
    setSelectedGame(null);
    router.push('/');
  };

  // Get display name from user metadata
  const getDisplayName = () => {
    if (!user) return '';
    return user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.email?.split('@')[0] || 
           'User';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

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
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:space-x-4 sm:gap-0 max-w-max">
                  <div className="flex-shrink-0 h-12 sm:h-[4.5rem] w-auto aspect-square relative">
                    <div className="animate-slow-rotate w-full h-full flex items-center">
                      <div className="relative w-full h-12 sm:h-16">
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
                  <CardTitle className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-rotate gradient-text-fix text-center leading-tight">
                    Bracket Challenge
                  </CardTitle>
                </div>
              </div>
              
              {/* Welcome message for logged in users */}
              {user && (
                <div className="w-full text-center mb-6">
                  <h2 className="text-2xl font-semibold text-green-400 mb-2">
                    Welcome, {getDisplayName()}!
                  </h2>
                  <p className="text-gray-300">Ready to make your predictions?</p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Social Login Section - only show if not logged in */}
            {!user && (
              <div className="flex flex-col items-center space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Sign in to create your prediction
                  </h3>
                </div>
                <SocialLogin />
              </div>
            )}
            
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

            {/* Logout button for logged in users - positioned at bottom */}
            {user && (
              <div className="flex justify-center pt-8 border-t border-gray-800 mt-8">
                <Button 
                  onClick={handleLogout}
                  variant="ghost"
                  className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log Out
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
