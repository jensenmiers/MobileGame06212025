"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="w-full mb-6">
          <Link 
            href="/"
            className="inline-flex items-center text-gray-300 hover:text-white transition-colors bg-gray-800/50 hover:bg-gray-700/50 px-4 py-2 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-green-400">Rules & Scoring</h1>
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-white">Bracket Master Challenge</h2>
          <p className="text-sm sm:text-base text-gray-300">Everything you need to know about tournament predictions</p>
        </div>

        {/* Basic Rules Section */}
        <Card className="bg-black/70 border-green-600/50 rounded-lg shadow-xl overflow-hidden mb-6">
          <CardHeader className="border-b border-green-700/50">
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-green-400">📋 Basic Rules</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 text-sm sm:text-base">
              <div>
                <h3 className="text-lg font-semibold text-green-300 mb-2">What You're Predicting</h3>
                <p className="text-gray-300 leading-relaxed">
                  You're predicting the <strong className="text-white">top 4 finishers of each tournament</strong> – who will place in <strong>1st, 2nd, 3rd, or 4th?</strong> Think of it as calling the final 4 up until the top 8 begins.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-green-300 mb-2">How Predictions Work</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong className="text-white">One prediction per tournament</strong> - choose your top 4 carefully</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong className="text-white">Edit freely until the Top 8 starts</strong> - change your mind as much as you want before the Top 8 starts.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong className="text-white">Locked after cutoff</strong> - once predictions close, no more changes allowed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong className="text-white">Order matters</strong> - predicting someone for 1st place scores differently than predicting them for 4th</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-green-300 mb-2">Bonus Predictions (Optional)</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span><strong className="text-white">Bracket Reset</strong>: Will the grand finals have a "bracket reset" (when the player from losers bracket forces a second set)?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span><strong className="text-white">Grand Finals Score</strong>: How close will the final match be? (3-0 sweep, 3-1, or 3-2 nail-biter)</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Scoring Section */}
        <Card className="bg-black/70 border-yellow-600/50 rounded-lg shadow-xl overflow-hidden mb-6">
          <CardHeader className="border-b border-yellow-700/50">
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-yellow-400">🎯 Event Scoring</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 text-sm sm:text-base">
              <div>
                <h3 className="text-lg font-semibold text-yellow-300 mb-3">Position Points (The Big Points)</h3>
                <p className="text-gray-300 mb-3">Each slot has different base point values - higher placements are worth more:</p>
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-yellow-600/30">
                    <div className="text-yellow-400 font-bold">1st Place</div>
                    <div className="text-2xl font-bold text-white">431 pts</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-400/30">
                    <div className="text-gray-300 font-bold">2nd Place</div>
                    <div className="text-2xl font-bold text-white">266 pts</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-amber-600/30">
                    <div className="text-amber-400 font-bold">3rd Place</div>
                    <div className="text-2xl font-bold text-white">165 pts</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-blue-400/30">
                    <div className="text-blue-400 font-bold">4th Place</div>
                    <div className="text-2xl font-bold text-white">100 pts</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-yellow-300 mb-2">Proximity Rewards (Smart Scoring)</h3>
                <p className="text-gray-300 mb-3">Don’t worry if you’re not exactly right! The system rewards “close calls” too:</p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span><strong className="text-white">Exact pick:</strong> If you predict a player in the correct position (for example, you pick Player A for 1st place and they actually win 1st), you earn <strong>100% of the points</strong> for that slot.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-300">✓</span>
                    <span><strong className="text-white">1 position off:</strong> If your pick is just one spot away (e.g., you pick Player A for 1st, but they finish 2nd), you get <strong>61% of the points</strong> for that slot.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-yellow-400">~</span>
                    <span><strong className="text-white">2 positions off:</strong> If your pick is two spots away, you get <strong>41% of the points</strong>.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-orange-400">~</span>
                    <span><strong className="text-white">3 positions off:</strong> If your pick is three spots away, you get <strong>17% of the points</strong>.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-400">✗</span>
                    <span><strong className="text-white">Not in top 4:</strong> If your pick doesn’t make the top 4, you get <strong>0 points</strong> for that slot.</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                  <p className="text-blue-200 text-sm">
                    <strong>Example:</strong> If you predict Player A for 1st place (worth 431 points) but they finish 2nd, you still earn 263 points (431 × 0.61).
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-yellow-300 mb-2">Bonus Points</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">+24</span>
                    <span><strong className="text-white">Correct bracket reset prediction</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">+13</span>
                    <span><strong className="text-white">Correct grand finals score</strong></span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-green-900/20 border border-green-800/30 rounded-lg">
                <p className="text-green-200 text-center">
                  <strong>Perfect Score: 999 points</strong> (requires predicting everything perfectly!)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tournament Flow Section */}
        <Card className="bg-black/70 border-blue-600/50 rounded-lg shadow-xl overflow-hidden mb-6">
          <CardHeader className="border-b border-blue-700/50">
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-blue-400">🏆 Tournament Flow</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 text-sm sm:text-base">
              <div>
                <h3 className="text-lg font-semibold text-blue-300 mb-2">Before the Tournament</h3>
                <ol className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 font-bold mt-1">1.</span>
                    <span><strong className="text-white">Browse participants</strong> - study the player list and their seedings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 font-bold mt-1">2.</span>
                    <span><strong className="text-white">Make your predictions</strong> - drag or tap players into your top 4 slots</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 font-bold mt-1">3.</span>
                    <span><strong className="text-white">Add bonus predictions</strong> - make your bracket reset and score calls</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 font-bold mt-1">4.</span>
                    <span><strong className="text-white">Submit before cutoff</strong> - don't wait until the last minute!</span>
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-300 mb-2">During Prediction Period</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong className="text-white">Edit freely</strong> - change your predictions as much as you want</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong className="text-white">Watch the clock</strong> - cutoff time is strictly enforced</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong className="text-white">No submissions after cutoff</strong> - the system automatically locks all predictions</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-300 mb-2">Top 8 Begins</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong className="text-white">Predictions are locked</strong> - sit back and watch your players compete</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong className="text-white">Results entered by admin</strong> - official tournament results are recorded after completion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong className="text-white">Automatic scoring</strong> - your points are calculated instantly when results are posted</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-300 mb-2">After Tournament</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong className="text-white">Live leaderboard</strong> - see how you stack up against other predictors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong className="text-white">Real-time updates</strong> - rankings update automatically as scores are processed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong className="text-white">Final standings</strong> - celebrate if you called it right!</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-300 mb-2">Tiebreaking</h3>
                <p className="text-gray-300">
                  Players with identical scores are ranked by submission time - earlier submissions rank higher in case of ties.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pro Tips Section */}
        <Card className="bg-black/70 border-purple-600/50 rounded-lg shadow-xl overflow-hidden mb-6">
          <CardHeader className="border-b border-purple-700/50">
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-purple-400">💡 Pro Tips for Success</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ul className="space-y-3 text-sm sm:text-base text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">💪</span>
                <span><strong className="text-white">Study the brackets</strong> - tournament seedings give hints about likely performance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">🔥</span>
                <span><strong className="text-white">Consider recent form</strong> - hot players often outperform their seeding</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">🎯</span>
                <span><strong className="text-white">Don't chase perfect scores</strong> - proximity scoring means "close enough" still earns solid points</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">⏰</span>
                <span><strong className="text-white">Submit early</strong> - avoid last-minute technical issues and secure better tiebreaker position</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center mb-8">
          <p className="text-lg sm:text-xl text-gray-300 mb-4">Ready to test your tournament prediction skills?</p>
          <Link 
            href="/"
            className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
          >
            <span className="mr-2">🎮</span>
            Choose Your Tournament
          </Link>
        </div>
      </div>
    </div>
  );
} 