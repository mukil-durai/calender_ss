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
  setMonth,
  getDaysInMonth
} from 'date-fns';
import { isSunday, isHoliday, getHolidayDetails, getHolidayTypeColor, getUpcomingHolidaysCount } from '../data/holidays';

const MiniCalendar = ({ currentDate, onDateChange, events }) => {
  const [activeDate, setActiveDate] = useState(new Date());
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const monthDropdownRef = useRef(null);
  const yearDropdownRef = useRef(null);
  const [holidayCounts, setHolidayCounts] = useState({ total: 0, govt: 0, sundays: 0, daysInMonth: 0 });
  const [priorityCounts, setPriorityCounts] = useState({ high: 0, medium: 0, low: 0 });
  
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
  
  // Calculate holiday/leave counts for the current month
  useEffect(() => {
    const month = getMonth(activeDate);
    const year = getYear(activeDate);
    const daysInMonth = getDaysInMonth(new Date(year, month));
    let sundays = 0;
    let govt = 0;
    let other = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(year, month, d);
      if (isSunday(day)) sundays++;
      const holiday = getHolidayDetails(day);
      if (holiday) {
        if (holiday.type === 'government') govt++;
        else other++;
      }
    }
    setHolidayCounts({
      total: govt + other,
      govt,
      sundays,
      daysInMonth
    });
  }, [activeDate, events]);
  
  // Helper: get priority counts for the current month
  useEffect(() => {
    const month = getMonth(activeDate);
    const year = getYear(activeDate);
    const counts = { high: 0, medium: 0, low: 0 };
    events.forEach(event => {
      const eventDate = parseISO(event.date);
      if (eventDate.getMonth() === month && eventDate.getFullYear() === year) {
        if (event.priority === 'high') counts.high++;
        else if (event.priority === 'medium') counts.medium++;
        else if (event.priority === 'low') counts.low++;
      }
    });
    setPriorityCounts(counts);
  }, [activeDate, events]);
  
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
  
  // Helper: get leave events for a day
  const getLeaveEventsForDay = (day) => {
    return events.filter(event =>
      isSameDay(parseISO(event.date), day) &&
      (event.type === 'leave' || event.category === 'leave')
    );
  };
  
  // Helper: get government holidays for a day
  const isGovtHoliday = (day) => {
    const holiday = getHolidayDetails(day);
    return holiday && holiday.type === 'government';
  };
  
  // Helper: get other holidays for a day
  const isOtherHoliday = (day) => {
    const holiday = getHolidayDetails(day);
    return holiday && holiday.type !== 'government';
  };
  
  // Helper: get tooltip text for a day
  const getDayTooltip = (day) => {
    const holiday = getHolidayDetails(day);
    const leaveEvents = getLeaveEventsForDay(day);
    if (isSunday(day)) return 'Sunday';
    if (holiday) return holiday.name;
    if (leaveEvents.length > 0) return leaveEvents.map(e => e.title).join(', ');
    return '';
  };
  
  const renderHeader = () => {
    return (
      <div className="mb-3">
        <div className="flex items-center justify-between px-1">
          <button 
            onClick={prevMonth} 
            className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
            aria-label="Previous month"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-1">
            <div className="relative" ref={monthDropdownRef}>
              <button 
                onClick={() => {
                  setShowMonthDropdown(!showMonthDropdown);
                  setShowYearDropdown(false);
                }}
                className="font-medium text-sm dark:text-gray-200 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
              >
                <span className="font-semibold">{format(activeDate, 'MMMM')}</span>
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
                className="font-medium text-sm dark:text-gray-200 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
              >
                <span className="font-semibold">{format(activeDate, 'yyyy')}</span>
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
          </div>
          
          <button 
            onClick={nextMonth} 
            className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
            aria-label="Next month"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
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
        const isTodayCell = isSameDay(day, new Date());
        const isSelected = isSameDay(day, currentDate);

        // Highlight leave days with a yellow background
        const isLeaveDay = getLeaveEventsForDay(day).length > 0;

        days.push(
          <div
            key={day.toString()}
            onClick={() => isCurrentMonth && onDateClick(cloneDay)}
            className={`relative text-center cursor-pointer group ${isCurrentMonth ? '' : 'pointer-events-none'}`}
            title={format(day, 'yyyy-MM-dd')}
          >
            <div className={`
              aspect-square flex flex-col items-center justify-center 
              transition-all duration-200 rounded-full mx-auto
              ${isLeaveDay ? 'bg-yellow-100 dark:bg-yellow-700/40' : ''}
              ${isSelected ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200 dark:shadow-blue-900/30 scale-100' : ''}
              ${!isSelected && isTodayCell ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''}
              ${isCurrentMonth && !isSelected && !isTodayCell && !isLeaveDay ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
              ${!isCurrentMonth ? 'opacity-30' : ''}
              w-7 h-7
              transform transition hover:scale-110`}>
              <span className={`
                text-xs font-medium
                ${isSelected ? 'text-white' : ''}
                ${!isSelected && isTodayCell ? 'text-blue-600 dark:text-blue-400' : ''}
                ${!isSelected && !isTodayCell ? 'text-gray-900 dark:text-gray-100' : ''}
                ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : ''}`}>
                {format(day, 'd')}
              </span>
            </div>
            {/* Event indicator */}
            {isCurrentMonth && events.some(event => isSameDay(parseISO(event.date), day)) && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            )}
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
    <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-md transition-all">
      {renderHeader()}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
        {renderDays()}
        {renderCells()}
      </div>
      <div className="flex flex-col space-y-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <button
            onClick={() => onDateChange(new Date())}
            className="text-2xs sm:text-xs py-1 sm:py-1.5 px-2 sm:px-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md hover:from-blue-600 hover:to-indigo-700 transition-colors font-medium shadow-sm"
          >
            Today
          </button>
          <div className="text-2xs sm:text-xs text-gray-500 dark:text-gray-400">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </div>
        </div>
        
        {/* Holiday/Leave counts for the month */}
        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800 rounded-lg p-3 text-xs border border-gray-100 dark:border-gray-700">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <span className="mr-2">📊</span>Monthly Summary
          </h4>
          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center justify-center p-1.5 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800 rounded-lg border border-purple-100 dark:border-purple-800/30">
              <span className="font-bold text-sm text-purple-600 dark:text-purple-400">{holidayCounts.total}</span>
              <span className="text-gray-500 dark:text-gray-400 text-[10px]">Holidays</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1.5 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-800 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
              <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{holidayCounts.govt}</span>
              <span className="text-gray-500 dark:text-gray-400 text-[10px]">Govt</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1.5 bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-800 rounded-lg border border-red-100 dark:border-red-800/30">
              <span className="font-bold text-sm text-red-600 dark:text-red-400">{holidayCounts.sundays}</span>
              <span className="text-gray-500 dark:text-gray-400 text-[10px]">Sundays</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1.5 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-800 rounded-lg border border-yellow-100 dark:border-yellow-800/30">
              <span className="font-bold text-sm text-yellow-600 dark:text-yellow-400">{holidayCounts.daysInMonth}</span>
              <span className="text-gray-500 dark:text-gray-400 text-[10px]">Days</span>
            </div>
          </div>
        </div>
        
        {/* Priority summary */}
        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800 rounded-lg p-3 text-xs border border-gray-100 dark:border-gray-700">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <span className="mr-2">📊</span>Priority Summary
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center justify-center p-1.5 bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-800 rounded-lg border border-red-100 dark:border-red-800/30">
              <span className="font-bold text-sm text-red-600 dark:text-red-400">{priorityCounts.high}</span>
              <span className="text-gray-500 dark:text-gray-400 text-[10px]">High Priority</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1.5 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-800 rounded-lg border border-yellow-100 dark:border-yellow-800/30">
              <span className="font-bold text-sm text-yellow-600 dark:text-yellow-400">{priorityCounts.medium}</span>
              <span className="text-gray-500 dark:text-gray-400 text-[10px]">Medium Priority</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1.5 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 rounded-lg border border-blue-100 dark:border-blue-800/30">
              <span className="font-bold text-sm text-blue-600 dark:text-blue-400">{priorityCounts.low}</span>
              <span className="text-gray-500 dark:text-gray-400 text-[10px]">Low Priority</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniCalendar;
