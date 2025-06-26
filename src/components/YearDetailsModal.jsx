import React, { useLayoutEffect, useState } from 'react';
import { keralaHolidays } from '../data/holidays';

const YearDetailsModal = ({ yearDetails, onClose, anchorRef }) => {
  if (!yearDetails) return null;

  // Filter holidays for the selected year from keralaHolidays
  const year = yearDetails.year;
  const holidaysForYear = keralaHolidays.filter(h => new Date(h.date).getFullYear() === year);
  const govtHolidays = holidaysForYear.filter(h => 
    (h.type && h.type.toLowerCase().includes('government'))
  );
  const holidaysByType = holidaysForYear.reduce((acc, h) => {
    const type = h.type || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(h);
    return acc;
  }, {});

  // Enhanced positioning for both desktop and mobile
  const [popoverStyle, setPopoverStyle] = useState({});
  useLayoutEffect(() => {
    if (anchorRef && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const modalWidth = Math.min(350, window.innerWidth - 32);
      
      // Check if we should position below or above the anchor
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldPositionAbove = spaceBelow < 400 && rect.top > 400;
      
      // Calculate left position
      let left = Math.min(
        rect.left + window.scrollX,
        window.innerWidth - modalWidth - 16
      );
      // Ensure left is not negative
      left = Math.max(16, left);
      
      setPopoverStyle({
        position: 'absolute',
        top: shouldPositionAbove 
          ? rect.top + window.scrollY - 8 - (anchorRef.current.offsetHeight || 0)
          : rect.bottom + window.scrollY + 8,
        left,
        zIndex: 1050,
        width: modalWidth,
        maxWidth: '95vw',
        transform: shouldPositionAbove ? 'translateY(-100%)' : 'none',
      });
    }
  }, [anchorRef]); // Remove showYearDetailsModal from deps

  return (
    <>
      {/* Only show overlay if not anchored */}
      {!anchorRef && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose}></div>
      )}
      <div
        className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border dark:border-gray-700 overflow-y-auto max-h-[85vh] p-3 sm:p-6`}
        style={anchorRef ? popoverStyle : { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1050, width: 320, maxWidth: '95vw' }}
      >
        <button
          className="absolute top-2 right-2 p-1.5 sm:p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          onClick={onClose}
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-base sm:text-xl font-bold mb-2 text-center pr-8">{year} Year Details</h2>
        
        <div className="grid grid-cols-2 gap-1.5 sm:gap-3 mb-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 flex flex-col items-center">
            <span className="text-base font-bold text-blue-700 dark:text-blue-300">{yearDetails.isLeapYear ? 'Leap Year' : 'Not Leap'}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Leap Year Status</span>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 flex flex-col items-center">
            <span className="text-base font-bold text-purple-700 dark:text-purple-300">{holidaysForYear.length}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Total Holidays</span>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 flex flex-col items-center">
            <span className="text-base font-bold text-green-700 dark:text-green-300">{govtHolidays.length}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Govt Holidays</span>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 flex flex-col items-center">
            <span className="text-base font-bold text-yellow-700 dark:text-yellow-400">{yearDetails.sundays.length}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Sundays</span>
          </div>
          <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-2 flex flex-col items-center">
            <span className="text-base font-bold text-pink-700 dark:text-pink-300">{yearDetails.weeks}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Weeks</span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 flex flex-col items-center">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{yearDetails.startDay}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Year Start</span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 flex flex-col items-center">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{yearDetails.endDay}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Year End</span>
          </div>
        </div>
        <div className="mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">Government Holidays:</div>
        <div className="max-h-32 overflow-y-auto border rounded bg-gray-50 dark:bg-gray-800 p-2 text-xs mb-3">
          {govtHolidays.length === 0 && (
            <div className="text-gray-400 text-center">No government holidays</div>
          )}
          {govtHolidays.map((h, idx) => (
            <div key={idx} className="flex justify-between py-1 border-b last:border-b-0 border-gray-100 dark:border-gray-700">
              <span>{h.date}</span>
              <span className="font-medium text-blue-700 dark:text-blue-300">{h.name}</span>
            </div>
          ))}
        </div>
        <div className="mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">All Holidays by Type:</div>
        <div className="max-h-32 overflow-y-auto border rounded bg-gray-50 dark:bg-gray-800 p-2 text-xs">
          {Object.keys(holidaysByType).map(type => (
            <div key={type} className="mb-2">
              <div className="font-bold text-xs text-gray-600 dark:text-gray-300 mb-1">{type}</div>
              {holidaysByType[type].map((h, idx) => (
                <div key={h.date + idx} className="flex justify-between py-1 border-b last:border-b-0 border-gray-100 dark:border-gray-700">
                  <span>{h.date}</span>
                  <span className="font-medium text-blue-700 dark:text-blue-300">{h.name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default YearDetailsModal;

