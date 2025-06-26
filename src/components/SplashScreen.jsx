import React from 'react';

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-white dark:from-green-900/30 dark:via-blue-900/20 dark:to-gray-900 z-50">
      <div className="w-full max-w-md p-8 flex flex-col items-center">
        {/* Kerala-themed logo/animation */}
        <div className="relative w-24 h-24 mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full animate-pulse"></div>
          <div className="absolute inset-2 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <span className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></span>
            <span className="absolute bottom-1 left-1 w-2 h-2 bg-blue-500 rounded-full animate-ping opacity-75 animation-delay-300"></span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white font-montserrat bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400">
          Kerala Calendar
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm text-center mb-6">
          Your personal Kerala holiday companion
        </p>
        
        {/* Loading animation */}
        <div className="flex space-x-2 justify-center items-center">
          <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce"></div>
          <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce animation-delay-200"></div>
          <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce animation-delay-400"></div>
        </div>
        
        {/* Kerala-themed decorative element */}
        <div className="mt-8 flex items-center justify-center">
          <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>
          <div className="mx-3 text-lg text-green-600 dark:text-green-400">🌴</div>
          <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-xs text-gray-500 dark:text-gray-400 text-center">
        © {new Date().getFullYear()} Kerala Calendar App
      </div>
    </div>
  );
};

export default SplashScreen;
