export default function Loading() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-24 h-24 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold text-white">Loading Bracket Challenge</h2>
        <p className="text-gray-400 mt-2">Preparing your tournament experience...</p>
      </div>
    </div>
  );
}
