"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { SocialLogin } from "@/components/Auth/SocialLogin";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Initialize selectedGame from URL on mount, but only after auth is loaded
  useEffect(() => {
    if (!authLoading) {
      const game = searchParams.get('game');
      if (['dbfz', 'sf6', 'tk8', 'ggst', 'mk1', 'ffcotw'].includes(game || '')) {
        setSelectedGame(game);
      }
    }
  }, [searchParams, authLoading]);

  const handleGameSelect = (game: string) => {
    if (isNavigating) return; // Prevent multiple clicks while navigating
    
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

  const handleNavigation = (path: string) => {
    if (isNavigating) return; // Prevent multiple clicks while navigating
    setIsNavigating(true);
    router.push(path);
  };

  // Reset navigation state when component unmounts or route changes
  useEffect(() => {
    return () => setIsNavigating(false);
  }, []);

  // ... rest of your component code ...

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-black/50 backdrop-blur-sm border border-gray-800 shadow-2xl">
          <CardHeader className="border-b border-gray-700/50 bg-gradient-to-r from-gray-900/50 to-black/30">
            <CardTitle className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-green-600">
              Bracket Master
            </CardTitle>
            <CardDescription className="text-center text-gray-400 text-lg">
              Predict tournament outcomes and compete on the leaderboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Social Login Section */}
            <div className="flex flex-col items-center space-y-6">
              <SocialLogin />
            </div>
            
            {/* Game Selection */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Choose Your Tournament</h2>
              <p className="text-gray-400">Select a game to view predictions and leaderboards</p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
              {/* ... your game selection buttons ... */}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <div className="w-full sm:w-auto relative">
                {!selectedGame && <div className="absolute inset-0 bg-black/30 rounded-lg z-10 pointer-events-none"></div>}
                <Button 
                  onClick={() => selectedGame && handleNavigation(
                    selectedGame === 'dbfz' ? '/prediction' : 
                    selectedGame === 'sf6' ? '/sf6/prediction' :
                    selectedGame === 'tk8' ? '/tk8/prediction' :
                    selectedGame === 'ggst' ? '/ggst/prediction' :
                    selectedGame === 'mk1' ? '/mk1/prediction' :
                    selectedGame === 'ffcotw' ? '/ffcotw/prediction' : '#'
                  )}
                  size="lg" 
                  disabled={!selectedGame || isNavigating}
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
              </div>
              <div className="w-full sm:w-auto relative">
                {!selectedGame && <div className="absolute inset-0 bg-black/30 rounded-lg z-10 pointer-events-none"></div>}
                <Button 
                  onClick={() => selectedGame && handleNavigation(
                    selectedGame === 'dbfz' ? '/leaderboard' : 
                    selectedGame === 'sf6' ? '/sf6/leaderboard' :
                    selectedGame === 'tk8' ? '/tk8/leaderboard' :
                    selectedGame === 'ggst' ? '/ggst/leaderboard' :
                    selectedGame === 'mk1' ? '/mk1/leaderboard' :
                    selectedGame === 'ffcotw' ? '/ffcotw/leaderboard' : '#'
                  )}
                  variant="ghost" 
                  size="lg" 
                  disabled={!selectedGame || isNavigating}
                  className={`w-full px-8 py-6 text-lg transition-all duration-300 transform ${
                    selectedGame 
                      ? 'bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gray-700 text-gray-200 hover:from-gray-800/80 hover:to-gray-700/80 hover:text-white' 
                      : 'bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gray-700 text-gray-400 opacity-50'
                  } backdrop-blur-sm`}
                >
                  View Leaderboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 