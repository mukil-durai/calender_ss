import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { getUpcomingHolidaysCount, keralaHolidays, getHolidayClasses } from '../data/holidays';

const Holidays = ({ currentDate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const upcomingHolidays = getUpcomingHolidaysCount(currentDate);
  
  // Get next 5 upcoming holidays
  const nextHolidays = [...keralaHolidays]
    .filter(holiday => new Date(holiday.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);
  
  // Find next Sunday
  let nextSunday = new Date();
  while (nextSunday.getDay() !== 0) {
    nextSunday = addDays(nextSunday, 1);
  }

  // Holiday card component
  const HolidayCard = ({ holiday }) => {
    const classes = getHolidayClasses(holiday.type);
    
    return (
      <div className={`${classes.bg} p-2 rounded border-l-3 ${classes.border}`}>
        <div className="flex justify-between">
          <div className="truncate flex-1">
            <div className={`font-medium ${classes.text} truncate flex items-center`}>
              <span className="mr-1">{classes.icon}</span>
              {holiday.name}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{holiday.type}</div>
          </div>
          <span className={`text-xs ${classes.bg} ${classes.text} px-2 py-0.5 rounded-full whitespace-nowrap ml-2`}>
            {format(new Date(holiday.date), 'MMM d')}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 left-4 z-10">
      <div className="relative">
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-full shadow-md border dark:border-gray-700"
          title="Upcoming holidays"
        >
          <span className="text-lg">🎉</span>
          <span className="font-medium hidden sm:inline">Holidays</span>
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{upcomingHolidays.total}</span>
        </button>
        
        {isExpanded && (
          <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-72 animate-fadeIn border dark:border-gray-700">
            <h3 className="font-bold text-lg mb-2 dark:text-gray-100 flex items-center justify-between">
              <span>Upcoming Holidays</span>
              <button onClick={() => setIsExpanded(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </h3>
            
            <div className="text-sm mb-3 font-medium dark:text-gray-300">
              <span className="font-semibold">{upcomingHolidays.total} holidays</span> in next 30 days
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {/* Next Sunday */}
              <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded border-l-3 border-red-500">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <span className="mr-1">🌞</span>
                    <span className="font-medium text-red-700 dark:text-red-300">Sunday</span>
                  </div>
                  <span className="text-xs bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">
                    {format(nextSunday, 'MMM d')}
                  </span>
                </div>
              </div>
              
              {/* Next holidays */}
              {nextHolidays.map(holiday => (
                <HolidayCard key={holiday.date} holiday={holiday} />
              ))}
            </div>
            
            <div className="mt-2 pt-2 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              Based on Kerala Government calendar
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Holidays;
