import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="w-full bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
          <div className="relative h-12 w-48">
            <Image
              src="/images/fullComboLogo.png"
              alt="Full Combo Logo"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/prediction" className="text-gray-300 hover:text-white transition-colors">
            Predictions
          </Link>
          <Link href="/leaderboard" className="text-gray-300 hover:text-white transition-colors">
            Leaderboard
          </Link>
          <Link href="/rules" className="text-gray-300 hover:text-white transition-colors">
            Rules
          </Link>
        </nav>
      </div>
    </header>
  );
}
