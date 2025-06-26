import React, { useState, useEffect, useRef } from 'react';
import { format, isAfter, isBefore, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Search, Calendar, Clock, Filter, Edit2, Trash2 } from 'lucide-react';

const EventSearch = ({ onSearch, events = [], onEdit, onDelete }) => {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });
  const [dateFilter, setDateFilter] = useState('all');
  const [showResults, setShowResults] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const searchInputRef = useRef(null);
  const resultsRef = useRef(null);
  const debounceRef = useRef(null);

  // Update recent searches in localStorage
  useEffect(() => {
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches.slice(0, 5)));
  }, [recentSearches]);
  
  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target) && 
          searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter events based on current criteria
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      const filtered = filterEvents(events, searchTerm, dateFilter);
      setFilteredEvents(filtered);
      
      // Also notify parent component
      if (onSearch) {
        onSearch(searchTerm, dateFilter);
      }
    }, 300);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, dateFilter, events]);

  // Filter events based on criteria
  const filterEvents = (events, term, dateFilter) => {
    return events.filter(event => {
      // Match search term - make case insensitive search more robust
      const searchTermLower = term ? term.toLowerCase() : '';
      const titleLower = event.title ? event.title.toLowerCase() : '';
      const descriptionLower = event.description ? event.description.toLowerCase() : '';
      const locationLower = event.location ? event.location.toLowerCase() : '';
      
      const matchesTerm = !searchTermLower || 
        titleLower.includes(searchTermLower) || 
        descriptionLower.includes(searchTermLower) ||
        locationLower.includes(searchTermLower);
      
      // Match date filter
      let matchesDate = true;
      const eventDate = parseISO(event.date);
      const today = new Date();
      
      if (dateFilter === 'today') {
        matchesDate = isSameDay(eventDate, today);
      } else if (dateFilter === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        matchesDate = isSameDay(eventDate, tomorrow);
      } else if (dateFilter === 'week') {
        matchesDate = isAfter(eventDate, startOfWeek(today)) && isBefore(eventDate, endOfWeek(today));
      } else if (dateFilter === 'month') {
        matchesDate = isAfter(eventDate, startOfMonth(today)) && isBefore(eventDate, endOfMonth(today));
      } else if (dateFilter === 'upcoming') {
        matchesDate = isAfter(eventDate, today);
      } else if (dateFilter === 'past') {
        matchesDate = isBefore(eventDate, today);
      }
      
      return matchesTerm && matchesDate;
    });
  };
  
  // Check if two dates are the same day
  const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() && 
           date1.getMonth() === date2.getMonth() && 
           date1.getFullYear() === date2.getFullYear();
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Immediately filter when typing
    if (value.trim()) {
      const filtered = filterEvents(events, value, dateFilter);
      setFilteredEvents(filtered);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  // Execute search when Enter key is pressed
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Perform search
  const handleSearch = () => {
    if (searchTerm.trim() === '') return;
    
    // Add to recent searches if not already present
    if (!recentSearches.includes(searchTerm)) {
      setRecentSearches([searchTerm, ...recentSearches.slice(0, 4)]);
    }
    
    // Make sure we're filtering and showing results
    const filtered = filterEvents(events, searchTerm, dateFilter);
    setFilteredEvents(filtered);
    setShowResults(true);
  };

  // Clear all filters and search term
  const handleClearFilters = () => {
    setSearchTerm('');
    setDateFilter('all');
    setShowResults(false);
  };

  // Enhanced date filter options (add "Today" and "Tomorrow" back)
  const dateFilters = [
    { label: 'All Events', value: 'all', icon: <Calendar size={16} /> },
    { label: 'Today', value: 'today', icon: <Clock size={16} /> },
    { label: 'Tomorrow', value: 'tomorrow', icon: <Calendar size={16} /> },
    { label: 'This Week', value: 'week', icon: <Calendar size={16} /> },
    { label: 'This Month', value: 'month', icon: <Calendar size={16} /> },
  ];

  return (
    <div className="w-full relative">
      {/* Single-line search bar with filters and clear button */}
      <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 gap-0">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </div>
          <input
            id="search"
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            ref={searchInputRef}
            onFocus={() => searchTerm.trim() && setShowResults(true)}
            className="block w-full py-2 pl-10 pr-3 text-sm text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 border-0 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Search events..."
            aria-label="Search events"
          />
        </div>
        
        {/* Date filter dropdown */}
        <div className="border-l border-gray-200 dark:border-gray-700">
          <select
            id="dateFilter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-full py-2 pl-2 pr-7 border-0 bg-transparent text-sm text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Filter by date"
          >
            {dateFilters.map(filter => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Clear filters button - inline */}
        {(searchTerm || dateFilter !== 'all') && (
          <button
            onClick={handleClearFilters}
            className="ml-2 mr-2 px-3 py-2 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
            style={{ whiteSpace: 'nowrap' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Enhanced search results with grouped sections */}
      {showResults && (
        <div 
          ref={resultsRef}
          className="absolute z-50 mt-1 w-full max-h-[70vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        >
          {filteredEvents.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Filter className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="font-medium">No events found</p>
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Search Results ({filteredEvents.length})
                </h3>
                <button
                  onClick={() => setShowResults(false)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Close
                </button>
              </div>
              
              {/* Group events by date for better organization */}
              {(() => {
                const eventsByDate = {};
                filteredEvents.forEach(event => {
                  const dateStr = format(parseISO(event.date), 'yyyy-MM-dd');
                  if (!eventsByDate[dateStr]) {
                    eventsByDate[dateStr] = [];
                  }
                  eventsByDate[dateStr].push(event);
                });
                
                return Object.keys(eventsByDate)
                  .sort()
                  .map(dateStr => (
                    <div key={dateStr} className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                          {format(parseISO(dateStr), 'EEEE, MMMM d, yyyy')}
                        </h4>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                      </div>
                      
                      <ul className="space-y-2">
                        {eventsByDate[dateStr].map((event) => (
                          <li 
                            key={event.id} 
                            className="flex items-center justify-between p-2 rounded-md border border-gray-100 dark:border-gray-700 
                              bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750 
                              hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-750 dark:hover:to-gray-700 
                              transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-3 h-10 rounded-l-sm bg-${event.color || 'blue'}-500`}></div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {event.title}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {event.startTime} - {event.endTime}
                                  </span>
                                  {event.location && (
                                    <span className="truncate">
                                      📍 {event.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-1 ml-2">
                              <button
                                onClick={() => {
                                  onEdit && onEdit(event);
                                  setShowResults(false);
                                }}
                                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300"
                                aria-label="Edit event"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Delete event "${event.title}"?`)) {
                                    onDelete && onDelete(event.id);
                                  }
                                }}
                                className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"
                                aria-label="Delete event"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ));
              })()}
            </div>
          )}
          
          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Recent Searches
              </h4>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchTerm(term);
                      handleSearch();
                    }}
                    className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 
                      text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    {term}
                  </button>
                ))}
                <button
                  onClick={() => setRecentSearches([])}
                  className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 
                    text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/30"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventSearch;