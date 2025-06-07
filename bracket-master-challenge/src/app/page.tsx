import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col items-center justify-start p-4 pt-12 relative overflow-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-40 w-96 h-96 bg-blue-500/10 filter blur-3xl animate-pulse"></div>
        <div className="absolute -right-40 -bottom-40 w-96 h-96 bg-green-500/10 filter blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Rotating Logo - Increased size by 30% */}
      <div className="relative w-full max-w-[208px] mb-8 mt-4">
        <div className="relative w-full pb-[52%]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-slow-rotate w-full h-full">
              <Image
                src="/images/fullComboLogo.png"
                alt="Full Combo Logo"
                width={208}
                height={83}
                className="object-contain w-full h-full"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto">
        <Card className="bg-black/70 border-gray-800 backdrop-blur-sm rounded-none">
          <CardHeader className="space-y-6 text-center">
            <CardTitle className="text-5xl font-bold gradient-rotate bg-clip-text text-transparent" style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>
              Bracket Master Challenge
            </CardTitle>
            <CardDescription className="text-xl text-gray-300 max-w-2xl mx-auto">
              Predict the tournament bracket, compete with others, and climb the leaderboard. 
              Show your skills and become the ultimate Bracket Master!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="space-y-2 p-4 bg-gray-700/30 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-blue-400">🎯 Predict</h3>
                <p className="text-gray-300">Make your bracket predictions for all 8 positions</p>
              </div>
              <div className="space-y-2 p-4 bg-gray-700/30 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-purple-400">🏆 Compete</h3>
                <p className="text-gray-300">Earn points based on accurate predictions</p>
              </div>
              <div className="space-y-2 p-4 bg-gray-700/30 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-green-400">📊 Leaderboard</h3>
                <p className="text-gray-300">See how you rank against other players</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/prediction" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full text-white font-semibold px-8 py-6 text-lg transition-all duration-300 transform hover:scale-105 gradient-rotate"
                  style={{
                    boxShadow: '0 4px 20px -5px rgba(0, 172, 78, 0.4)'
                  }}
                >
                  Start Prediction
                </Button>
              </Link>
              <Link href="/leaderboard" className="w-full sm:w-auto">
                <Button 
                  variant="ghost" 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gray-700 text-gray-200 hover:from-gray-800/80 hover:to-gray-700/80 hover:text-white px-8 py-6 text-lg transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                >
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
