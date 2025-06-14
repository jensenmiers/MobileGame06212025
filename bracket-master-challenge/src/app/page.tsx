"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { SocialLogin } from "@/components/Auth/SocialLogin";

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  // Initialize selectedGame from URL on mount
  useEffect(() => {
    const game = searchParams.get('game');
    if (['dbfz', 'sf6', 'tk8', 'ggst', 'mk1', 'ffcotw'].includes(game || '')) {
      setSelectedGame(game);
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
            <div className="flex items-center justify-center space-x-4">
              <div className="w-16 h-16 relative">
                <div className="animate-slow-rotate w-full h-full">
                  <Image
                    src="/images/fullComboLogo.png"
                    alt="Full Combo Logo"
                    width={64}
                    height={64}
                    className="object-contain w-full h-full"
                    priority
                  />
                </div>
              </div>
              <CardTitle className="text-5xl font-bold gradient-rotate gradient-text-fix">
                Bracket Master Challenge
              </CardTitle>
            </div>
            <CardDescription className="text-xl text-gray-300 max-w-2xl mx-auto">
              Show your skills and become the ultimate Bracket Master!
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
              <div className="flex flex-col items-center">
                <button 
                  onClick={() => handleGameSelect('dbfz')}
                  className={`transition-all mb-2 ${selectedGame === 'dbfz' ? 'outline outline-1 outline-offset-2 outline-green-500' : ''}`}
                >
                  <div className="relative w-24 h-24">
                    <Image 
                      src="/images/gameIcons/dbfz.webp" 
                      alt="Dragonball Fighter Z" 
                      fill 
                      className="object-contain"
                      priority
                    />
                  </div>
                </button>
                <span className="text-white text-sm">Dragonball Fighter Z</span>
              </div>
              
              <div className="flex flex-col items-center">
                <button 
                  onClick={() => handleGameSelect('sf6')}
                  className={`transition-all mb-2 ${selectedGame === 'sf6' ? 'outline outline-1 outline-offset-2 outline-green-500' : ''}`}
                >
                  <div className="relative w-24 h-24">
                    <Image 
                      src="/images/gameIcons/sf6.webp" 
                      alt="Street Fighter 6" 
                      fill 
                      className="object-contain"
                      priority
                    />
                  </div>
                </button>
                <span className="text-white text-sm">Street Fighter 6</span>
              </div>
              
              <div className="flex flex-col items-center">
                <button 
                  onClick={() => handleGameSelect('tk8')}
                  className={`transition-all mb-2 ${selectedGame === 'tk8' ? 'outline outline-1 outline-offset-2 outline-green-500' : ''}`}
                >
                  <div className="relative w-24 h-24">
                    <Image 
                      src="/images/gameIcons/tk8.webp" 
                      alt="Tekken 8" 
                      fill 
                      className="object-contain"
                      priority
                    />
                  </div>
                </button>
                <span className="text-white text-sm">Tekken 8</span>
              </div>
              
              <div className="flex flex-col items-center">
                <button 
                  onClick={() => handleGameSelect('ggst')}
                  className={`transition-all mb-2 ${selectedGame === 'ggst' ? 'outline outline-1 outline-offset-2 outline-green-500' : ''}`}
                >
                  <div className="relative w-24 h-24">
                    <Image 
                      src="/images/gameIcons/ggst.webp" 
                      alt="Guilty Gear Strive" 
                      fill 
                      className="object-contain"
                      priority
                    />
                  </div>
                </button>
                <span className="text-white text-sm">Guilty Gear Strive</span>
              </div>
              
              <div className="flex flex-col items-center">
                <button 
                  onClick={() => handleGameSelect('mk1')}
                  className={`transition-all mb-2 ${selectedGame === 'mk1' ? 'outline outline-1 outline-offset-2 outline-green-500' : ''}`}
                >
                  <div className="relative w-24 h-24">
                    <Image 
                      src="/images/gameIcons/mk1.webp" 
                      alt="Mortal Kombat 1" 
                      fill 
                      className="object-contain"
                      priority
                    />
                  </div>
                </button>
                <span className="text-white text-sm">Mortal Kombat 1</span>
              </div>
              
              <div className="flex flex-col items-center">
                <button 
                  onClick={() => handleGameSelect('ffcotw')}
                  className={`transition-all mb-2 ${selectedGame === 'ffcotw' ? 'outline outline-1 outline-offset-2 outline-green-500' : ''}`}
                >
                  <div className="relative w-24 h-24">
                    <Image 
                      src="/images/gameIcons/ffcotw.webp" 
                      alt="Fatal Fury: City of the Wolves" 
                      fill 
                      className="object-contain"
                      priority
                    />
                  </div>
                </button>
                <span className="text-white text-sm">Fatal Fury: COTW</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <div className="w-full sm:w-auto relative">
                {!selectedGame && <div className="absolute inset-0 bg-black/30 rounded-lg z-10 pointer-events-none"></div>}
                <Link 
                  href={
                    selectedGame === 'dbfz' ? '/prediction' : 
                    selectedGame === 'sf6' ? '/sf6/prediction' :
                    selectedGame === 'tk8' ? '/tk8/prediction' :
                    selectedGame === 'ggst' ? '/ggst/prediction' :
                    selectedGame === 'mk1' ? '/mk1/prediction' :
                    selectedGame === 'ffcotw' ? '/ffcotw/prediction' : '#'
                  } 
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
                  href={
                    selectedGame === 'dbfz' ? '/leaderboard' : 
                    selectedGame === 'sf6' ? '/sf6/leaderboard' :
                    selectedGame === 'tk8' ? '/tk8/leaderboard' :
                    selectedGame === 'ggst' ? '/ggst/leaderboard' :
                    selectedGame === 'mk1' ? '/mk1/leaderboard' :
                    selectedGame === 'ffcotw' ? '/ffcotw/leaderboard' : '#'
                  } 
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
