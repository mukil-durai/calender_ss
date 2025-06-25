import React from 'react';
import { format } from 'date-fns';

const YearDetailsModal = ({ yearDetails, onClose }) => {
  const { year, isLeapYear, holidays, sundays, events } = yearDetails;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4 dark:text-gray-100">Year Details: {year}</h2>
        <p className="mb-2 dark:text-gray-200">Leap Year: {isLeapYear ? 'Yes' : 'No'}</p>
        <p className="mb-2 dark:text-gray-200">Total Sundays: {sundays.length}</p>
        <p className="mb-4 dark:text-gray-200">Total Holidays: {holidays.length}</p>
        <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">Events:</h3>
        <ul className="space-y-2 max-h-40 overflow-y-auto">
          {events.map(event => (
            <li key={event.id} className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <div className="font-medium dark:text-gray-100">{event.title}</div>
              <div className="text-sm dark:text-gray-300">{format(parseISO(event.date), 'MMM d, yyyy')}</div>
            </li>
          ))}
        </ul>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default YearDetailsModal;
