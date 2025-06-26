import React, { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, Search, Edit, Trash, X, Plus, Filter, Info } from 'lucide-react';

const AllEventsModal = ({ events, onClose, onEdit, onDelete, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('asc');
  const [activeTab, setActiveTab] = useState('all');
  const modalRef = useRef(null);

  // Filter and sort events
  useEffect(() => {
    let result = [...events];
    
    // Filter based on search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(event => 
        event.title.toLowerCase().includes(term) ||
        (event.description && event.description.toLowerCase().includes(term)) ||
        (event.location && event.location.toLowerCase().includes(term))
      );
    }

    // Filter based on tab
    if (activeTab === 'upcoming') {
      const now = new Date();
      result = result.filter(event => new Date(event.date) >= now);
    } else if (activeTab === 'past') {
      const now = new Date();
      result = result.filter(event => new Date(event.date) < now);
    }
    
    // Sort the events
    result.sort((a, b) => {
      let valueA, valueB;
      
      if (sortField === 'date') {
        valueA = new Date(a.date + 'T' + a.startTime);
        valueB = new Date(b.date + 'T' + b.startTime);
      } else if (sortField === 'title') {
        valueA = a.title.toLowerCase();
        valueB = b.title.toLowerCase();
      } else if (sortField === 'color') {
        valueA = a.color || '';
        valueB = b.color || '';
      }
      
      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
    
    setFilteredEvents(result);
  }, [events, searchTerm, sortField, sortDirection, activeTab]);

  // Handle click outside modal to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Animate table rows on scroll
  useEffect(() => {
    const handleScroll = () => {
      const tableRows = document.querySelectorAll('.event-table-row');
      
      tableRows.forEach(row => {
        const rowTop = row.getBoundingClientRect().top;
        const rowBottom = row.getBoundingClientRect().bottom;
        const windowHeight = window.innerHeight;
        
        // Check if row is in viewport
        if (rowTop < windowHeight - 100 && rowBottom > 0) {
          row.classList.add('event-row-visible');
        }
      });
    };
    
    // Initialize visibility for items already in view
    setTimeout(handleScroll, 100);
    
    // Add scroll event listener
    const eventsContainer = document.querySelector('.events-container');
    if (eventsContainer) {
      eventsContainer.addEventListener('scroll', handleScroll);
      return () => eventsContainer.removeEventListener('scroll', handleScroll);
    }
  }, [filteredEvents]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border dark:border-gray-700"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-blue-500" />
            All Events ({filteredEvents.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-10 pr-3 py-2 text-sm bg-white dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Add Event Button */}
            <button
              onClick={onAdd}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mt-4 border-b border-gray-200 dark:border-gray-700">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'upcoming'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'past'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('past')}
            >
              Past
            </button>
          </div>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto events-container scroll-smooth">
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <Filter className="h-12 w-12 mb-2" />
              <p className="text-lg">No events found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => toggleSort('title')}
                  >
                    <div className="flex items-center">
                      Title
                      {sortField === 'title' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center">
                      Date & Time
                      {sortField === 'date' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => toggleSort('color')}
                  >
                    <div className="flex items-center">
                      Color
                      {sortField === 'color' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEvents.map((event, index) => (
                  <tr 
                    key={event.id} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 event-table-row opacity-0 translate-y-4
                      ${index % 2 === 0 ? 'animate-delay-0' : 'animate-delay-100'}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-8 w-1 bg-${event.color || 'blue'}-500 rounded-full mr-3`}></div>
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{event.title}</div>
                          {event.location && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                              <span className="mr-1">📍</span> {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {format(parseISO(event.date), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                        <Clock className="h-3 w-3 mr-1" /> 
                        {event.startTime} - {event.endTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-${event.color || 'blue'}-100 text-${event.color || 'blue'}-800 dark:bg-${event.color || 'blue'}-900/30 dark:text-${event.color || 'blue'}-200`}>
                        {event.color || 'blue'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onEdit(event)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
                            onDelete(event.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <div className="flex items-center">
            <Info className="h-3 w-3 mr-1" />
            <span>Click on column headers to sort</span>
          </div>
          <div>
            {filteredEvents.length} of {events.length} events
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllEventsModal;
