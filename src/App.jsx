import { useEffect, useState } from 'react';
import Calendar from './components/Calendar';
import { X } from 'lucide-react';
import SplashScreen from './components/SplashScreen';
import EventSearch from './components/EventSearch';

// Add theme support
const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'system';
  const saved = localStorage.getItem('theme');
  if (saved) return saved;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
};

function App() {
  const [theme, setTheme] = useState(getInitialTheme());
  const [showGuide, setShowGuide] = useState(() => {
    return localStorage.getItem('calendarGuideShown') !== 'true';
  });
  const [guideStep, setGuideStep] = useState(0);
  const [loading, setLoading] = useState(true); // Add loading state
  const [searchQuery, setSearchQuery] = useState('');

  // Add a title to the page
  useEffect(() => {
    document.title = "Kerala Calendar App";
    
    // Dynamically add Google Fonts
    const link = document.createElement('link');
    link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Lora:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    
    // Hide splash screen after 2 seconds
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    return () => {
      document.head.removeChild(link);
      clearTimeout(timer);
    };
  }, []);

  // Apply theme to html element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const guideSteps = [
    {
      title: "Add Event",
      icon: (
        <span className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2 text-blue-600 dark:text-blue-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        </span>
      ),
      content: (
        <span>
          <b>Add Event:</b> Click the <b>+</b> button at the bottom right to add a new event for any date and time.
        </span>
      )
    },
    {
      title: "Views",
      icon: (
        <span className="bg-green-100 dark:bg-green-900/30 rounded-full p-2 text-green-700 dark:text-green-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6" /></svg>
        </span>
      ),
      content: (
        <span>
          <b>Views:</b> Switch between <b>Day</b>, <b>Week</b>, <b>Month</b>, and <b>Year</b> views using the buttons at the top. Each view lets you see your events in different ways.
        </span>
      )
    },
    {
      title: "Mini Calendar",
      icon: (
        <span className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-2 text-yellow-700 dark:text-yellow-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </span>
      ),
      content: (
        <span>
          <b>Mini Calendar:</b> Use the mini calendar on the left to quickly jump to any date, see holidays, and get a monthly summary.
        </span>
      )
    },
    {
      title: "Export & Share",
      icon: (
        <span className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2 text-purple-700 dark:text-purple-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
        </span>
      ),
      content: (
        <span>
          <b>Export & Share:</b> Export your calendar as an iCal file or share your calendar link from the sidebar tools.
        </span>
      )
    },
    {
      title: "Year Details",
      icon: (
        <span className="bg-cyan-100 dark:bg-cyan-900/30 rounded-full p-2 text-cyan-700 dark:text-cyan-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m9-9a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </span>
      ),
      content: (
        <span>
          <b>Year Details:</b> Click the <b>check/done</b> icon near the calendar header to see leap year info, all holidays, government holidays, weeks, and more for the year.
        </span>
      )
    },
    {
      title: "Search & Manage",
      icon: (
        <span className="bg-gray-100 dark:bg-gray-800 rounded-full p-2 text-gray-700 dark:text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        </span>
      ),
      content: (
        <span>
          <b>Search & Manage:</b> Use the search bar in the sidebar to find, edit, or delete events. You can also filter by date.
        </span>
      )
    }
  ];

  const handleGuideNext = () => {
    if (guideStep < guideSteps.length - 1) {
      setGuideStep(guideStep + 1);
    } else {
      setShowGuide(false);
      localStorage.setItem('calendarGuideShown', 'true');
    }
  };

  const handleGuidePrev = () => {
    if (guideStep > 0) setGuideStep(guideStep - 1);
  };

  // Mark guide as shown
  const handleCloseGuide = () => {
    setShowGuide(false);
    localStorage.setItem('calendarGuideShown', 'true');
  };

  // Handler for search
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen font-sans bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Show splash screen when loading */}
      {loading ? (
        <SplashScreen />
      ) : (
        <>
          {/* Onboarding Guide Modal */}
          {showGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-2 p-6 relative border dark:border-gray-700 overflow-y-auto max-h-[90vh]">
                <button
                  className="absolute top-2 right-2 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  onClick={() => {
                    setShowGuide(false);
                    localStorage.setItem('calendarGuideShown', 'true');
                  }}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-bold mb-4 text-center text-blue-700 dark:text-blue-300">
                  {guideSteps[guideStep].title}
                </h2>
                <div className="space-y-4 text-gray-700 dark:text-gray-200 text-sm flex flex-col items-center">
                  {guideSteps[guideStep].icon}
                  <div className="mt-2 text-center">{guideSteps[guideStep].content}</div>
                </div>
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={handleGuidePrev}
                    disabled={guideStep === 0}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${guideStep === 0 ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleGuideNext}
                    className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  >
                    {guideStep === guideSteps.length - 1 ? "Finish" : "Next"}
                  </button>
                </div>
                <div className="mt-4 flex justify-center gap-1">
                  {guideSteps.map((_, idx) => (
                    <span
                      key={idx}
                      className={`inline-block w-2 h-2 rounded-full ${guideStep === idx ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row justify-between items-center p-2 sm:p-4 border-b dark:border-gray-800 gap-2 sm:gap-0">
            {/* App Title/Logo */}
            <div className="flex items-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-montserrat">Kerala Calendar</h1>
            </div>

            {/* EventSearch in header, centered and responsive */}
            <div className="w-full sm:max-w-md mx-0 sm:mx-4 flex-1">
              <EventSearch
                onSearch={handleSearch}
                // Optionally pass events, onEdit, onDelete if needed
              />
            </div>

            {/* Theme Toggles */}
            <div className="flex bg-white dark:bg-gray-800 rounded-full shadow-sm border dark:border-gray-700 ml-0 sm:ml-4 mt-2 sm:mt-0">
              {/* System Theme */}
              <button 
                onClick={() => setTheme('system')} 
                className={`p-2 rounded-l-full ${theme === 'system' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                aria-label="System theme"
                title="System theme"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              
              {/* Light Theme */}
              <button 
                onClick={() => setTheme('light')} 
                className={`p-2 border-l dark:border-gray-700 ${theme === 'light' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                aria-label="Light theme"
                title="Light theme"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>
              
              {/* Dark Theme */}
              <button 
                onClick={() => setTheme('dark')} 
                className={`p-2 rounded-r-full border-l dark:border-gray-700 ${theme === 'dark' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                aria-label="Dark theme"
                title="Dark theme"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-900 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>
            </div>
          </div>
          {/* For mobile, EventSearch is already visible above, so no need to duplicate */}

          {/* Pass searchQuery to Calendar */}
          <Calendar searchQuery={searchQuery} />
        </>
      )}
    </div>
  );
}

export default App;
