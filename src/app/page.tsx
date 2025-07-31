"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { SocialLogin } from "@/components/Auth/SocialLogin";
import { useAuth } from "@/context/AuthContext";
import { tournamentService, syncUserProfile } from "@/lib/tournament-service";
import { Tournament } from "@/types/tournament";
import { gameUiDetailsMap, getGamePriority } from "@/lib/game-utils";
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
  const getStatusColors = (status: 'results' | 'predictions' | 'pending' | 'awaiting') => {
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
                      case 'awaiting':
                  return {
                    border: 'border-red-600/80 group-hover:border-red-400/90',
                    background: 'bg-red-600/80 group-hover:bg-red-400/90'
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
  // PRIORITY: predictions_open flag > Results posted > cutoff time
  const arePredictionsOpen = (tournament: Tournament): boolean => {
    // PRIORITY 1: Check predictions_open flag (overrides everything)
    if (!tournament.predictions_open) {
      console.log(`🚫 ${tournament.name}: predictions_open = false → predictions CLOSED (awaiting top bracket)`);
      return false; // predictions_open = false overrides everything
    }
    
    // PRIORITY 2: Check if tournament has results (overrides cutoff time)
    const hasResults = tournamentsWithResults.has(tournament.id);
    if (hasResults) {
      console.log(`🔒 ${tournament.name}: HAS RESULTS → predictions CLOSED (completed)`);
      return false; // Results posted = no more predictions allowed
    }
    
    // PRIORITY 3: If no results, check cutoff time
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

  // Helper function to sort tournaments by priority and status
  const sortTournamentsByPriority = (tournaments: Tournament[], tournamentsWithResultsSet: Set<string>): Tournament[] => {
    return tournaments.sort((a, b) => {
      // LEVEL 1: Sort by active status (active tournaments first)
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }
      
      // LEVEL 2: For active tournaments, sort by custom game priority
      if (a.active && b.active) {
        const aPriority = getGamePriority(a.name);
        const bPriority = getGamePriority(b.name);
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority; // Lower priority number = higher display priority
        }
      }
      
      // LEVEL 3: Check if either tournament is awaiting (predictions_open = false) - these go LAST within same priority
      const aIsAwaiting = !a.predictions_open;
      const bIsAwaiting = !b.predictions_open;
      
      if (aIsAwaiting !== bIsAwaiting) {
        return aIsAwaiting ? 1 : -1; // Awaiting tournaments go last
      }
      
      // LEVEL 4: If both are awaiting, sort alphabetically by name
      if (aIsAwaiting && bIsAwaiting) {
        return a.name.localeCompare(b.name);
      }
      
      // LEVEL 5: For non-awaiting tournaments with same priority, sort by status: results > predictions > pending
      const aHasResults = tournamentsWithResultsSet.has(a.id);
      const bHasResults = tournamentsWithResultsSet.has(b.id);
      
      if (aHasResults !== bHasResults) {
        return aHasResults ? -1 : 1; // Results first
      }
      
      if (!aHasResults && !bHasResults) {
        // Both don't have results, check if predictions are open
        const aPredictionsOpen = arePredictionsOpen(a);
        const bPredictionsOpen = arePredictionsOpen(b);
        
        if (aPredictionsOpen !== bPredictionsOpen) {
          return aPredictionsOpen ? -1 : 1; // Predictions open first
        }
      }
      
      // LEVEL 6: For tournaments with same priority and same status, sort alphabetically by name
      if (a.name !== b.name) {
        return a.name.localeCompare(b.name);
      }
      
      // LEVEL 7: Finally, sort by creation date (newest first) as final tiebreaker
      const sortByCreatedAt = (a: Tournament, b: Tournament) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      
      return sortByCreatedAt(a, b);
    });
  };

  // Function to fetch tournaments and results status
  const fetchTournamentsData = useCallback(async () => {
    console.log('🔄 Fetching active tournaments and checking results...');
    
    try {
      const data = await tournamentService.getTournaments(true); // Only fetch active tournaments
      
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
      
      // Sort tournaments by priority and status
      const sortedTournaments = sortTournamentsByPriority(data, tournamentsWithResultsSet);
      setTournaments(sortedTournaments);
      console.log('🎯 Sorted tournament order:', sortedTournaments.map(t => t.name));
    } catch (error) {
      console.error('❌ Error fetching tournaments data:', error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchTournamentsData();
  }, [fetchTournamentsData]);

  // Periodic refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Periodic refresh triggered');
      fetchTournamentsData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchTournamentsData]);





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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white relative">
        {/* Simplified background elements */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute -right-40 -bottom-40 w-96 h-96 bg-green-500/10 filter blur-3xl animate-pulse"></div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center justify-start p-3 pt-3">
          <div className="w-full max-w-6xl mx-auto">
            <Card className="bg-black/70 border-gray-800 backdrop-blur-sm rounded-lg">
              {/* Sticky Header - Only Logo + FULL COMBO */}
              <div className="sticky top-0 z-50 bg-black/70 backdrop-blur-sm rounded-t-lg">
                <div className="flex flex-col items-center justify-center text-center px-3 py-1">
                  <div className="flex justify-center mb-0 w-full px-0">
                    <div className="flex flex-row items-center gap-1 sm:gap-2 justify-center">
                      <div className="flex-shrink-0 h-10 sm:h-12 md:h-14 lg:h-16 xl:h-18 w-auto aspect-square relative">
                        <div className="w-full h-full flex items-center">
                          <div className="relative w-full h-10 sm:h-12 md:h-14 lg:h-16 xl:h-18">
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
                        <h1 className="text-[2.85rem] sm:text-[4.275rem] md:text-[5.7rem] lg:text-[7.6rem] xl:text-[9.5rem] font-black font-quicksand gradient-rotate gradient-text-fix leading-tight whitespace-nowrap drop-shadow-[0_0_10px_rgba(0,172,78,0.8)] tracking-tighter scale-95">
                          FULL COMBO
                        </h1>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Welcome/Sign-in Section - Not sticky */}
              <CardHeader className="space-y-0 pb-1 pt-4">
                <div className="flex flex-col items-center justify-center text-center">
                  {/* Welcome message for logged in users */}
                  {user && (
                    <div className="w-full text-center">
                      <h2 className="text-xl sm:text-2xl font-semibold text-white mb-0">
                        Welcome, {getDisplayName()}!
                      </h2>
                    </div>
                  )}

                  {/* Sign in message for non-logged in users */}
                  {!user && (
                    <div className="w-full text-center">
                      <h2 className="text-lg sm:text-2xl font-bold text-white mb-0">
                        Sign in to create predictions
                      </h2>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-2 px-3 pt-4 pb-2">
              {/* Social Login Section - only show if not logged in */}
              {!user && (
                <div className="flex flex-col items-center space-y-2 mb-6">
                  <SocialLogin />
                </div>
              )}
              
              {/* Game Selection */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-2xl mx-auto">
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
                  let isClickable = true;
                  
                  if (!tournament.predictions_open) {
                    // Predictions closed by admin - awaiting top bracket
                    const uiDetails = gameUiDetailsMap[tournament.name];
                    const topBracketText = uiDetails?.topBracketPhase || 'TOP BRACKET';
                    bannerText = `AWAITING\n${topBracketText}`;
                    statusColors = getStatusColors('awaiting');
                    isClickable = false;
                  } else if (hasResults) {
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
                        onClick={isClickable ? () => handleGameSelect(uiDetails.slug) : undefined}
                        className={`relative transition-all duration-300 ${isClickable ? 'cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-black/50' : 'cursor-default'} group ${statusColors.border} ${CORNER_RADIUS} overflow-hidden ${SHOW_TITLES ? 'mb-2' : ''}`}
                        style={{ 
                          transition: 'all 0.3s ease-in-out, border-color 0.3s ease-in-out',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          willChange: 'transform',
                          WebkitFontSmoothing: 'antialiased'
                        }}
                      >
                        <div className="relative w-[10rem] h-[10rem]">
                          <Image
                            src={uiDetails.imageUrl}
                            alt={tournament.name}
                            fill
                            className={`${CORNER_RADIUS_TOP} transition-all duration-300 group-hover:brightness-110 ${
                              tournament.name === 'Dragon Ball FighterZ' || tournament.name === 'Tekken 8' || tournament.name === 'Mortal Kombat 1' || tournament.name === 'Guilty Gear Strive' || tournament.name === 'Under Night In Birth II' || tournament.name === 'Fatal Fury: City of the Wolves' || tournament.name === 'THE KING OF FIGHTERS XV' || tournament.name === 'Samurai Shodown'
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
                                : tournament.name === 'Under Night In Birth II'
                                ? { objectPosition: 'center 73.21%' }
                                : tournament.name === 'Fatal Fury: City of the Wolves'
                                ? { objectPosition: 'center 39.73%' }
                                : tournament.name === 'THE KING OF FIGHTERS XV'
                                ? { objectPosition: 'center 53%' }
                                : tournament.name === 'Samurai Shodown'
                                ? { objectPosition: 'center 10%' }
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
                    </div>
                  );
                })}
              </div>

              {user && (
                <div className="flex flex-col items-center pt-8 mt-8 space-y-4">
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
                  {/* Rules button - same size as admin button */}
                  <Button
                    onClick={() => router.push("/rules")}
                    variant="default"
                    className="bg-gray-700 hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-lg shadow-md transition-colors"
                  >
                    Rules
                  </Button>
                  <div className="flex items-center gap-3 w-full max-w-sm">
                    <span className="text-sm text-gray-400 truncate flex-1 min-w-0" title={user.email}>
                      {user.email}
                    </span>
                    <Button 
                      onClick={handleLogout}
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors rounded-lg flex-shrink-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Log Out
                    </Button>
                  </div>
                </div>
              )}

              {/* Rules button for logged-out users - same size as admin button */}
              {!user && (
                <div className="flex flex-col items-center pt-4 pb-4">
                  <Button
                    onClick={() => router.push("/rules")}
                    variant="default"
                    className="bg-gray-700 hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-lg shadow-md transition-colors"
                  >
                    Rules
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Privacy Policy link for logged-out users at the very bottom */}
        {!user && (
          <div className="w-full flex justify-center mt-2 mb-2">
            <Link
              href="/privacy"
              className="text-xs text-gray-400 underline hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        )}
        </div>
      </div>
  );
}
