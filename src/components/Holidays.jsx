import React, { useState } from 'react';
import { format, addDays, isAfter, parseISO } from 'date-fns';
import { keralaHolidays } from '../data/holidays';

// Helper: filter events that are holidays
const isHolidayEvent = (event) => {
  const title = event.title?.toLowerCase() || '';
  const category = event.category?.toLowerCase() || '';
  const type = event.type?.toLowerCase() || '';
  return (
    title.includes('holiday') ||
    category.includes('holiday') ||
    type.includes('holiday')
  );
};

const Holidays = ({ currentDate, events }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get all upcoming holidays from holidays.js
  const today = new Date();
  const upcomingKeralaHolidays = keralaHolidays
    .filter(h => isAfter(parseISO(h.date), addDays(today, -1)))
    .map(h => ({
      id: h.date + '-kerala',
      title: h.name,
      date: h.date,
      description: h.description,
      type: h.type || 'Holiday',
      source: 'kerala'
    }));

  // Get all upcoming events from events.json that are holidays
  const upcomingEventHolidays = events
    .filter(ev => isHolidayEvent(ev) && isAfter(parseISO(ev.date), addDays(today, -1)))
    .map(ev => ({
      id: ev.id || ev.date + '-event',
      title: ev.title,
      date: ev.date,
      description: ev.description,
      type: ev.type || 'Holiday',
      source: 'event'
    }));

  // Merge and sort
  const allUpcomingHolidays = [...upcomingKeralaHolidays, ...upcomingEventHolidays]
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Next 5 upcoming holidays
  const nextHolidays = allUpcomingHolidays.slice(0, 5);

  // Holiday card component
  const HolidayCard = ({ holiday }) => (
    <div className="bg-gradient-to-r from-yellow-50 to-green-50 dark:from-yellow-900/20 dark:to-green-900/10 p-2 rounded border-l-4 border-yellow-400 shadow-sm mb-2">
      <div className="flex justify-between items-center">
        <div className="truncate flex-1">
          <div className="font-medium text-yellow-800 dark:text-yellow-200 flex items-center gap-1">
            <span role="img" aria-label="holiday">🎉</span>
            {holiday.title}
            {holiday.source === 'event' && (
              <span className="ml-1 text-xs text-blue-500">(Event)</span>
            )}
          </div>
          {holiday.description && (
            <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{holiday.description}</div>
          )}
        </div>
        <span className="text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200 px-2 py-0.5 rounded-full ml-2 font-semibold">
          {format(parseISO(holiday.date), 'MMM d')}
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed bottom-4 left-4 z-10">
      <div className="relative">
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-full shadow-md border dark:border-gray-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition"
          title="Upcoming holidays"
        >
          <span className="text-lg">🎉</span>
          <span className="font-medium hidden sm:inline">Holidays</span>
          <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">{allUpcomingHolidays.length}</span>
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
              <span className="font-semibold">{allUpcomingHolidays.length} holidays</span> upcoming
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {nextHolidays.length === 0 && (
                <div className="text-gray-400 text-center py-4">No upcoming holidays</div>
              )}
              {nextHolidays.map(holiday => (
                <HolidayCard key={holiday.id} holiday={holiday} />
              ))}
            </div>
            <div className="mt-2 pt-2 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              Kerala Gazette + Your Events
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Holidays;
