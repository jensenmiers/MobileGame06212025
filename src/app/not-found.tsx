import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 mb-6">
          404
        </h1>
        <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
        <p className="text-gray-300 mb-8 text-lg">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Return Home
        </Link>
      </div>
    </div>
  );
}
