import React, { useState, useEffect, useRef } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO,
  getYear,
  setYear,
  getMonth,
  setMonth
} from 'date-fns';
import { isSunday, isHoliday, getHolidayDetails, getHolidayClasses, getUpcomingHolidaysCount } from '../data/holidays';

const MiniCalendar = ({ currentDate, onDateChange, events }) => {
  const [activeDate, setActiveDate] = useState(new Date());
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const monthDropdownRef = useRef(null);
  const yearDropdownRef = useRef(null);
  const [holidayCounts, setHolidayCounts] = useState({ total: 0, govt: 0, sundays: 0 });
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const years = Array.from({ length: 21 }, (_, i) => getYear(new Date()) - 10 + i);
  
  // Update mini-calendar when main calendar date changes
  useEffect(() => {
    setActiveDate(new Date(currentDate));
  }, [currentDate]);
  
  // Handle outside click for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target)) {
        setShowMonthDropdown(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setShowYearDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Calculate holiday counts on component mount
  useEffect(() => {
    setHolidayCounts(getUpcomingHolidaysCount(new Date(), 30));
  }, []);
  
  const onDateClick = (day) => {
    onDateChange(day);
  };
  
  const nextMonth = () => {
    setActiveDate(addMonths(activeDate, 1));
    setShowMonthDropdown(false);
  };
  
  const prevMonth = () => {
    setActiveDate(subMonths(activeDate, 1));
    setShowMonthDropdown(false);
  };
  
  const changeMonth = (monthIndex) => {
    const newDate = setMonth(activeDate, monthIndex);
    setActiveDate(newDate);
    setShowMonthDropdown(false);
  };
  
  const changeYear = (year) => {
    const newDate = setYear(activeDate, year);
    setActiveDate(newDate);
    setShowYearDropdown(false);
  };
  
  const hasEventsOnDay = (day) => {
    return events.some(event => 
      isSameDay(parseISO(event.date), day)
    );
  };
  
  // Group events by category for better visualization
  const getEventCategoriesForDay = (day) => {
    if (!events.length) return [];
    
    const dayEvents = events.filter(event => 
      isSameDay(parseISO(event.date), day)
    );
    
    // Return unique categories (colors)
    return [...new Set(dayEvents.map(event => event.color || 'blue'))];
  };
  
  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-3 relative">
        <button 
          onClick={prevMonth} 
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
          aria-label="Previous month"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        <div className="relative" ref={monthDropdownRef}>
          <button 
            onClick={() => {
              setShowMonthDropdown(!showMonthDropdown);
              setShowYearDropdown(false);
            }}
            className="font-medium text-sm dark:text-gray-200 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
          >
            <span>{format(activeDate, 'MMMM')}</span>
            <svg className={`h-4 w-4 ml-1 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showMonthDropdown && (
            <div className="absolute z-10 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg py-1 w-full max-h-52 overflow-auto">
              {months.map((month, idx) => (
                <button
                  key={month}
                  onClick={() => changeMonth(idx)}
                  className={`w-full text-left px-3 py-1.5 text-xs ${getMonth(activeDate) === idx ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  {month}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="relative" ref={yearDropdownRef}>
          <button 
            onClick={() => {
              setShowYearDropdown(!showYearDropdown);
              setShowMonthDropdown(false);
            }}
            className="font-medium text-sm dark:text-gray-200 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
          >
            <span>{format(activeDate, 'yyyy')}</span>
            <svg className={`h-4 w-4 ml-1 transition-transform ${showYearDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showYearDropdown && (
            <div className="absolute right-0 z-10 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg py-1 w-20 max-h-52 overflow-auto">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => changeYear(year)}
                  className={`w-full text-left px-3 py-1.5 text-xs ${getYear(activeDate) === year ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button 
          onClick={nextMonth} 
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
          aria-label="Next month"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  };
  
  const renderDays = () => {
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    
    return (
      <div className="grid grid-cols-7 mb-1">
        {days.map((day, i) => (
          <div 
            key={i} 
            className={`text-center text-xs font-medium py-1 
              ${i === 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
          >
            {day}
          </div>
        ))}
      </div>
    );
  };
  
  const renderCells = () => {
    const monthStart = startOfMonth(activeDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date());
        const isSelected = isSameDay(day, currentDate);

        days.push(
          <div
            key={day.toString()}
            onClick={() => isCurrentMonth && onDateClick(cloneDay)}
            className={`relative text-center cursor-pointer group ${isCurrentMonth ? '' : 'pointer-events-none'}`}
          >
            <div className={`
              aspect-square flex flex-col items-center justify-center 
              transition-all duration-200 rounded-full mx-auto
              ${isSelected ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200 dark:shadow-blue-900/30 scale-100' : ''}
              ${!isSelected && isToday ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''}
              ${isCurrentMonth && !isSelected && !isToday ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
              ${!isCurrentMonth ? 'opacity-30' : ''}
              w-8 h-8
              transform transition hover:scale-110`}>
              <span className={`
                text-xs font-medium font-poppins
                ${isSelected ? 'text-white' : ''}
                ${!isSelected && isToday ? 'text-blue-600 dark:text-blue-400' : ''}
                ${!isSelected && !isToday ? 'text-gray-900 dark:text-gray-100' : ''}
                ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : ''}`}
              >
                {format(day, 'd')}
              </span>
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 mb-1">
          {days}
        </div>
      );
      days = [];
    }
    return <div className="mb-2">{rows}</div>;
  };
  
  return (
    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-md transition-all">
      {renderHeader()}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
        {renderDays()}
        {renderCells()}
      </div>
      <div className="flex flex-col space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => onDateChange(new Date())} 
            className="text-xs py-1.5 px-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md hover:from-blue-600 hover:to-indigo-700 transition-colors font-medium shadow-sm"
          >
            Today
          </button>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </div>
        </div>
        
        {/* Holiday counts section with enhanced visuals */}
        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800 rounded-md p-2 text-xs border border-gray-100 dark:border-gray-700">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 font-lora flex items-center">
            <span className="mr-2">📊</span>Upcoming Holidays (30 days)
          </h4>
          <div className="grid grid-cols-3 gap-1">
            <div className="flex flex-col items-center justify-center p-1 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800 rounded border border-purple-100 dark:border-purple-800/30">
              <span className="font-bold text-sm text-purple-600 dark:text-purple-400">{holidayCounts.total}</span>
              <span className="text-gray-500 dark:text-gray-400 text-2xs">Total</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-800 rounded border border-emerald-100 dark:border-emerald-800/30">
              <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{holidayCounts.govt}</span>
              <span className="text-gray-500 dark:text-gray-400 text-2xs">Govt</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1 bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-800 rounded border border-red-100 dark:border-red-800/30">
              <span className="font-bold text-sm text-red-600 dark:text-red-400">{holidayCounts.sundays}</span>
              <span className="text-gray-500 dark:text-gray-400 text-2xs">Sunday</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniCalendar;
  