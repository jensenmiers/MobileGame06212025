'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MainNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-green-600">
                Full Combo
              </span>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <NavLink href="/" isActive={isActive('/')}>
                  Home
                </NavLink>
                <NavLink href="/tournaments" isActive={pathname.startsWith('/tournaments')}>
                  Tournaments
                </NavLink>
                <NavLink href="/leaderboard" isActive={isActive('/leaderboard')}>
                  Leaderboard
                </NavLink>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {/* User profile and auth buttons would go here */}
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ 
  href, 
  isActive, 
  children 
}: { 
  href: string; 
  isActive: boolean; 
  children: React.ReactNode 
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        isActive 
          ? 'bg-gray-800 text-white' 
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}
