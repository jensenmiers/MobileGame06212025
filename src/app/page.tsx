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
import { supabase } from "@/lib/supabase";

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading, signOut, role } = useAuth();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentsWithResults, setTournamentsWithResults] = useState<Set<string>>(new Set());
  // Toggle to show/hide the text labels under each game icon
  const SHOW_TITLES = false;

  // Helper function to generate synchronized border and background colors
  const getStatusColors = (status: 'results' | 'predictions' | 'pending') => {
    switch (status) {
      case 'results':
        return {
          border: 'border-blue-600/80 group-hover:border-blue-400/90',
          background: 'bg-blue-600/80 group-hover:bg-blue-400/90'
        };
      case 'predictions':
        return {
          border: 'border-green-600/80 group-hover:border-green-400/90',
          background: 'bg-green-600/80 group-hover:bg-green-400/90'
        };
      case 'pending':
        return {
          border: 'border-yellow-600/80 group-hover:border-yellow-400/90',
          background: 'bg-yellow-600/80 group-hover:bg-yellow-400/90'
        };
      default:
        return {
          border: 'border-gray-600/80 group-hover:border-gray-400/90',
          background: 'bg-gray-600/80 group-hover:bg-gray-400/90'
        };
    }
  };

  // Single definition for uniform corner roundness
  const CORNER_RADIUS = 'rounded-xl';
  const CORNER_RADIUS_TOP = 'rounded-t-xl'; // Top corners only
  const CORNER_RADIUS_BOTTOM = 'rounded-b-xl'; // Bottom corners only

  // Helper function to dynamically calculate if predictions are open
  // PRIORITY: Results posted overrides cutoff time
  const arePredictionsOpen = (tournament: Tournament): boolean => {
    // PRIORITY 1: Check if tournament has results (overrides everything)
    const hasResults = tournamentsWithResults.has(tournament.id);
    if (hasResults) {
      console.log(`🔒 ${tournament.name}: HAS RESULTS → predictions CLOSED (completed)`);
      return false; // Results posted = no more predictions allowed
    }
    
    // PRIORITY 2: If no results, check cutoff time
    const cutoffTime = new Date(tournament.cutoff_time);
    const now = new Date();
    const timeBasedOpen = cutoffTime > now;
    
    if (timeBasedOpen) {
      console.log(`🟢 ${tournament.name}: No results, cutoff future → predictions OPEN (upcoming)`);
      return true;
    } else {
      console.log(`🔵 ${tournament.name}: No results, cutoff passed → predictions CLOSED (active)`);
      return false;
    }
  };

  // Helper function to get tournament by game slug
  const getTournamentBySlug = (gameSlug: string): Tournament | undefined => {
    const tournamentName = Object.keys(gameUiDetailsMap).find(
      key => gameUiDetailsMap[key].slug === gameSlug
    );
    return tournaments.find(t => t.name === tournamentName);
  };

  useEffect(() => {
    async function fetchTournaments() {
      console.log('🔄 Fetching tournaments and checking results...');
      const data = await tournamentService.getTournaments();
      setTournaments(data);
      
      // Check which tournaments have results (PRIORITY: Results override cutoff time)
      const tournamentsWithResultsSet = new Set<string>();
      
      for (const tournament of data) {
        try {
          if (process.env.NEXT_PUBLIC_USE_BACKEND_API === 'true') {
            // Use backend API
            const response = await fetch(`/api/tournaments/${tournament.id}/results`);
            if (response.ok) {
              const resultsData = await response.json();
              if (resultsData.results && Object.keys(resultsData.results).length > 0) {
                tournamentsWithResultsSet.add(tournament.id);
                console.log(`✅ ${tournament.name}: Has results (via API)`);
              } else {
                console.log(`❌ ${tournament.name}: No results (via API)`);
              }
            }
          } else {
            // Use Supabase directly
            const { data: results, error } = await supabase
              .from('results')
              .select('id')
              .eq('tournament_id', tournament.id)
              .limit(1);
            
            if (!error && results && results.length > 0) {
              tournamentsWithResultsSet.add(tournament.id);
              console.log(`✅ ${tournament.name}: Has results (via Supabase)`);
            } else {
              console.log(`❌ ${tournament.name}: No results (via Supabase)`);
            }
          }
        } catch (error) {
          console.error(`❌ Error checking results for ${tournament.name}:`, error);
        }
      }
      
      setTournamentsWithResults(tournamentsWithResultsSet);
      console.log('🏁 Final tournaments with results:', Array.from(tournamentsWithResultsSet));
    }
    fetchTournaments();
  }, []);



  const handleGameSelect = (gameSlug: string) => {
    const tournament = getTournamentBySlug(gameSlug);
    if (!tournament) return;
    
    // Route directly based on prediction status
    if (arePredictionsOpen(tournament)) {
      // Predictions are open - go to prediction page
      router.push(`/${gameSlug}/prediction`);
    } else {
      // Predictions are closed - go to leaderboard page  
      router.push(`/${gameSlug}/leaderboard`);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🔄 Starting logout process...');
      console.log('📋 Current user before logout:', user?.email);
      
    await signOut();
      console.log('✅ SignOut called successfully');
      
      // Clear any local storage that might be caching auth state
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
      
      // Force a complete page reload to ensure clean state
      console.log('🔄 Forcing page reload...');
      window.location.href = '/';
      
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Still try to redirect even if there's an error
      window.location.href = '/';
    }
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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col items-center justify-start p-3 pt-3 relative overflow-hidden">
      {/* Simplified background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute -right-40 -bottom-40 w-96 h-96 bg-green-500/10 filter blur-3xl animate-pulse"></div>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <Card className="bg-black/70 border-gray-800 backdrop-blur-sm rounded-lg">
          <CardHeader className="space-y-1 pb-2">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex justify-center mb-1 w-full px-1">
                <div className="flex flex-row items-center gap-2 sm:gap-3 w-full max-w-6xl">
                  <div className="flex-shrink-0 h-10 sm:h-12 md:h-14 lg:h-14 xl:h-16 w-auto aspect-square relative">
                    <div className="animate-slow-rotate w-full h-full flex items-center">
                      <div className="relative w-full h-10 sm:h-12 md:h-14 lg:h-14 xl:h-16">
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
                  <div className="text-center flex-1">
                    <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold gradient-rotate gradient-text-fix leading-normal">
                      Full Combo{' '}
                      <span className="inline-block">Bracket Challenge</span>
                    </h1>
                  </div>
                </div>
              </div>
              
              {/* Welcome message for logged in users */}
              {user && (
                <div className="w-full text-center mb-1">
                  <h2 className="text-xl sm:text-2xl font-semibold text-green-400 mb-0">
                    Welcome, {getDisplayName()}!
                  </h2>
                  <p className="text-xs text-gray-300">Ready to make your predictions?</p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pt-0 pb-2">
            {/* Social Login Section - only show if not logged in */}
            {!user && (
              <div className="flex flex-col items-center space-y-2 mb-6">
                <div className="text-center">
                  <h2 className="text-lg sm:text-2xl font-bold text-white mb-2">
                    Sign in to create predictions
                  </h2>
                </div>
                <SocialLogin />
              </div>
            )}
            
            {/* Game Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-2xl mx-auto">
              {tournaments.map((tournament) => {
                const uiDetails = gameUiDetailsMap[tournament.name];
                if (!uiDetails) return null; // Don't render if no UI details are mapped

                const predictionsOpen = arePredictionsOpen(tournament);
                const hasResults = tournamentsWithResults.has(tournament.id);
                const cutoffTime = new Date(tournament.cutoff_time);
                const now = new Date();
                const cutoffPassed = cutoffTime <= now;

                // Determine tournament status for banner
                let bannerText = '';
                let statusColors = { border: '', background: '' };
                
                if (hasResults) {
                  // Tournament completed - has results
                  bannerText = 'VIEW RESULTS';
                  statusColors = getStatusColors('results');
                } else if (predictionsOpen) {
                  // Predictions still open
                  bannerText = 'MAKE\nPREDICTIONS';
                  statusColors = getStatusColors('predictions');
                } else {
                  // Active tournament - no results, cutoff passed
                  bannerText = 'RESULTS\nPENDING';
                  statusColors = getStatusColors('pending');
                }

                return (
                  <div key={tournament.id} className="flex flex-col items-center">
                    <button
                      onClick={() => handleGameSelect(uiDetails.slug)}
                      className={`relative transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-black/50 group border ${statusColors.border} ${CORNER_RADIUS} overflow-hidden ${SHOW_TITLES ? 'mb-2' : ''}`}
                      style={{ 
                        transition: 'all 0.3s ease-in-out, border-color 0.3s ease-in-out',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        willChange: 'transform',
                        WebkitFontSmoothing: 'antialiased'
                      }}
                    >
                      <div className="relative w-[8.4rem] h-[8.4rem]">
                        <Image
                          src={uiDetails.imageUrl}
                          alt={tournament.name}
                          fill
                          className={`${CORNER_RADIUS_TOP} transition-all duration-300 group-hover:brightness-110 ${
                            tournament.name === 'Dragon Ball FighterZ' || tournament.name === 'Tekken 8' || tournament.name === 'Mortal Kombat 1' || tournament.name === 'Guilty Gear Strive'
                              ? 'object-cover' 
                              : 'object-contain'
                          }`}
                          style={
                            tournament.name === 'Dragon Ball FighterZ' 
                              ? { objectPosition: 'center 12.5%' }
                              : tournament.name === 'Tekken 8'
                              ? { objectPosition: 'center 20.45%' }
                              : tournament.name === 'Mortal Kombat 1'
                              ? { objectPosition: 'center 50%' }
                              : tournament.name === 'Guilty Gear Strive'
                              ? { objectPosition: 'center 5.68%' }
                              : undefined
                          }
                          priority
                        />
                      </div>
                      
                      {/* Status banner positioned below the image within the same button */}
                      <span className={`text-white text-xs font-bold text-center py-2 w-full block transition-all duration-300 group-hover:brightness-125 ${statusColors.background}`}>
                        {bannerText}
                      </span>
                    </button>
                    
                    {SHOW_TITLES && (<span className="text-white text-sm">{uiDetails.title}</span>)}
                  </div>
                );
              })}
            </div>

            {/* Logout button for logged in users - positioned at bottom */}
            {user && (
              <div className="flex flex-col items-center pt-8 border-t border-gray-800 mt-8 space-y-4">
                {/* Admin Dashboard button for admins only */}
                {role === "admin" && (
                  <Button
                    onClick={() => router.push("/admin")}
                    variant="default"
                    className="bg-green-700 hover:bg-green-800 text-white font-bold px-8 py-3 rounded-lg shadow-md transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M16 3v4M8 3v4M4 11h16" />
                    </svg>
                    Admin Dashboard
                  </Button>
                )}
                <div className="flex items-center justify-between w-full max-w-sm">
                  <span className="text-sm text-gray-400">{user.email}</span>
                <Button 
                  onClick={handleLogout}
                  variant="ghost"
                  className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log Out
                </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
