import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="space-y-6">
            <CardTitle className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Bracket Master Challenge
            </CardTitle>
            <CardDescription className="text-xl text-gray-300 max-w-2xl mx-auto">
              Predict the tournament bracket, compete with others, and climb the leaderboard. 
              Show your skills and become the ultimate Bracket Master!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-blue-400">🎯 Predict</h3>
                <p className="text-gray-400">Make your bracket predictions for all 8 positions</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-purple-400">🏆 Compete</h3>
                <p className="text-gray-400">Earn points based on accurate predictions</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-green-400">📊 Leaderboard</h3>
                <p className="text-gray-400">See how you rank against other players</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/prediction">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3">
                  Start Prediction
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-3">
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
