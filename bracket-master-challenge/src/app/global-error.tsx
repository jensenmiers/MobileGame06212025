'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
          <div className="max-w-2xl text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-6">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-10 w-10 text-red-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Something went wrong!</h1>
            <p className="text-gray-300 mb-8 text-lg">
              An unexpected error occurred. Our team has been notified and we're working to fix it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => reset()}
                className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                Try again
              </button>
              <Link 
                href="/" 
                className="px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-white bg-transparent hover:bg-gray-800 transition-colors text-center"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
