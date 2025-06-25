import React, { useState, useEffect, useRef } from 'react';
import { format, isToday, isTomorrow, isYesterday, isThisWeek, isThisMonth } from 'date-fns';

const EventSearch = ({ onSearch, events = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showAllDropdown, setShowAllDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  // Save recent searches to localStorage
  useEffect(() => {
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Generate search suggestions based on events
  useEffect(() => {
    if (searchTerm.length > 0) {
      const suggestions = [];
      const searchLower = searchTerm.toLowerCase();
      events.forEach(event => {
        if (event.title.toLowerCase().includes(searchLower) && 
            !suggestions.find(s => s.text === event.title)) {
          suggestions.push({
            type: 'title',
            text: event.title,
            icon: '📅'
            // removed: category: event.category
          });
        }
        if (event.description && event.description.toLowerCase().includes(searchLower) && 
            suggestions.length < 8) {
          suggestions.push({
            type: 'description',
            text: event.description,
            icon: '📝',
            event: event.title
          });
        }
        if (event.location && event.location.toLowerCase().includes(searchLower) && 
            !suggestions.find(s => s.text === event.location)) {
          suggestions.push({
            type: 'location',
            text: event.location,
            icon: '📍',
            count: events.filter(e => e.location === event.location).length
          });
        }
      });
      setSearchSuggestions(suggestions.slice(0, 6));
    } else {
      setSearchSuggestions([]);
    }
  }, [searchTerm, events]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      onSearch(value);
      setIsSearching(false);
    }, 300);
  };

  const handleAdvancedSearch = () => {
    const filters = {
      search: searchTerm,
      category: 'all',
      date: dateFilter,
      priority: priorityFilter,
      sort: sortBy,
      order: sortOrder
    };
    
    onSearch(searchTerm, filters);
  };

  const saveRecentSearch = () => {
    if (searchTerm.trim() && !recentSearches.includes(searchTerm)) {
      const updated = [searchTerm, ...recentSearches.slice(0, 6)];
      setRecentSearches(updated);
    }
  };
  
  const selectRecentSearch = (term) => {
    setSearchTerm(term);
    onSearch(term);
    setShowRecentSearches(false);
  };

  const selectSuggestion = (suggestion) => {
    setSearchTerm(suggestion.text);
    onSearch(suggestion.text);
    setShowSuggestions(false);
    saveRecentSearch();
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
    setSearchSuggestions([]);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setDateFilter('all');
    setPriorityFilter('all');
    onSearch('');
  };

  const getMatchingEventsCount = () => {
    if (!searchTerm) return events.length;
    return events.filter(event => 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
    ).length;
  };

  // Date filter options
  const dateFilters = [
    { label: 'All', value: 'all', icon: '📅' },
    { label: 'Today', value: 'today', icon: '🌅' },
    { label: 'Tomorrow', value: 'tomorrow', icon: '🌄' },
    { label: 'This Week', value: 'week', icon: '📆' },
    { label: 'This Month', value: 'month', icon: '🗓️' },
  ];

  const priorityFilters = [
    { label: 'All', value: 'all', color: 'gray' },
    { label: 'High', value: 'high', color: 'red' },
    { label: 'Medium', value: 'medium', color: 'yellow' },
    { label: 'Low', value: 'low', color: 'blue' },
  ];

  // Add these event listeners in useEffect to handle edit/delete from dropdown:
  useEffect(() => {
    const handleOpenEventModal = (e) => {
      if (typeof window !== "undefined" && window.openEventModal) {
        window.openEventModal(e.detail.event);
      }
    };
    const handleDeleteEvent = (e) => {
      if (typeof window !== "undefined" && window.deleteEvent) {
        window.deleteEvent(e.detail.eventId);
      }
    };
    window.addEventListener('openEventModal', handleOpenEventModal);
    window.addEventListener('deleteEvent', handleDeleteEvent);
    return () => {
      window.removeEventListener('openEventModal', handleOpenEventModal);
      window.removeEventListener('deleteEvent', handleDeleteEvent);
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* All Events Dropdown with search/filter inside */}
      <div className="relative">
        <button
          className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          onClick={() => setShowAllDropdown((v) => !v)}
          type="button"
        >
          <span>All Events</span>
          <svg className={`h-4 w-4 ml-2 transition-transform ${showAllDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showAllDropdown && (
          <div className="absolute z-30 mt-2 w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-[32rem] overflow-auto">
            {/* Search & Filter inside dropdown */}
            <div className="p-3 border-b dark:border-gray-700">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search events, descriptions, locations..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                aria-label="Search events"
              />
              {/* Date filter dropdown */}
              <div className="mt-2">
                <select
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                >
                  {dateFilters.map(filter => (
                    <option key={filter.value} value={filter.value}>
                      {filter.icon} {filter.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Events list */}
            {events.length === 0 && (
              <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm">No events</div>
            )}
            {events
              .filter(event => {
                // Filter by search term
                const term = searchTerm.toLowerCase();
                const matchesSearch =
                  !term ||
                  event.title.toLowerCase().includes(term) ||
                  (event.description && event.description.toLowerCase().includes(term)) ||
                  (event.location && event.location.toLowerCase().includes(term));
                // Filter by date
                let matchesDate = true;
                if (dateFilter === 'today') {
                  matchesDate = isToday(new Date(event.date));
                } else if (dateFilter === 'tomorrow') {
                  matchesDate = isTomorrow(new Date(event.date));
                } else if (dateFilter === 'week') {
                  matchesDate = isThisWeek(new Date(event.date));
                } else if (dateFilter === 'month') {
                  matchesDate = isThisMonth(new Date(event.date));
                }
                return matchesSearch && matchesDate;
              })
              .map((event) => (
                <div key={event.id} className="flex items-center justify-between px-4 py-2 border-b last:border-b-0 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition group">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-gray-900 dark:text-gray-100">{event.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {event.date} • {event.startTime} - {event.endTime}
                    </div>
                  </div>
                  <div className="flex items-center ml-2 gap-1">
                    {/* Edit */}
                    <button
                      className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
                      title="Edit"
                      onClick={() => {
                        if (typeof window !== "undefined" && window.dispatchEvent) {
                          window.dispatchEvent(new CustomEvent('openEventModal', { detail: { event } }));
                        }
                      }}
                    >
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" />
                      </svg>
                    </button>
                    {/* Delete */}
                    <button
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"
                      title="Delete"
                      onClick={() => {
                        if (typeof window !== "undefined" && window.dispatchEvent) {
                          window.dispatchEvent(new CustomEvent('deleteEvent', { detail: { eventId: event.id } }));
                        }
                      }}
                    >
                      <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Date Filter Dropdown */}
      <div className="relative">
        <button
          className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          onClick={() => setShowDateDropdown((v) => !v)}
          type="button"
        >
          <span>
            {dateFilters.find(f => f.value === dateFilter)?.icon} {dateFilters.find(f => f.value === dateFilter)?.label || 'Date'}
          </span>
          <svg className={`h-4 w-4 ml-2 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showDateDropdown && (
          <div className="absolute z-30 mt-2 w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg">
            {dateFilters.map(filter => (
              <button
                key={filter.value}
                onClick={() => {
                  setShowDateDropdown(false);
                  setDateFilter(filter.value);
                  onSearch('', { date: filter.value });
                }}
                className={`w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 ${
                  dateFilter === filter.value ? 'bg-blue-100 dark:bg-blue-900/30 font-bold' : ''
                }`}
              >
                <span>{filter.icon}</span>
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg dark:text-gray-100 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search & Filter
        </h3>
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Advanced
        </button>
      </div>

      {/* Main Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isSearching ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search events, descriptions, locations..."
          value={searchTerm}
          onChange={handleSearch}
          onFocus={() => {
            setShowRecentSearches(true);
            setShowSuggestions(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setShowRecentSearches(false);
              setShowSuggestions(false);
            }, 200);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              saveRecentSearch();
              setShowSuggestions(false);
            }
            if (e.key === 'Escape') {
              setShowRecentSearches(false);
              setShowSuggestions(false);
            }
          }}
          className="pl-10 pr-12 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-base shadow-sm transition-all"
          aria-label="Search events"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {searchTerm && (
            <>
              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                {getMatchingEventsCount()} results
              </span>
              <button
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-1"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </>
          )}
        </div>
        
        {/* Search Suggestions */}
        {showSuggestions && (searchSuggestions.length > 0 || (showRecentSearches && recentSearches.length > 0)) && (
          <div className="absolute w-full mt-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-80 overflow-auto">
            {searchSuggestions.length > 0 && (
              <div>
                <div className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  💡 Suggestions
                </div>
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <span className="text-lg mr-3">{suggestion.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {suggestion.text}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {/* removed: category info */}
                            {suggestion.type === 'description' && `from "${suggestion.event}"`}
                            {suggestion.type === 'location' && `${suggestion.count} event${suggestion.count !== 1 ? 's' : ''}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                        {suggestion.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {showRecentSearches && recentSearches.length > 0 && (
              <div>
                <div className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  🕐 Recent Searches
                </div>
                {recentSearches.map((term, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm flex items-center justify-between border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    onClick={() => selectRecentSearch(term)}
                  >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">{term}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecentSearches(prev => prev.filter(t => t !== term));
                      }}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="space-y-4 pt-4 border-t dark:border-gray-700 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                ⚡ Priority
              </label>
              <div className="space-y-1">
                {priorityFilters.map(priority => (
                  <button
                    key={priority.value}
                    onClick={() => setPriorityFilter(priority.value)}
                    className={`w-full px-3 py-2 text-sm rounded-md flex items-center ${
                      priorityFilter === priority.value
                        ? `bg-${priority.color}-100 dark:bg-${priority.color}-900/30 text-${priority.color}-700 dark:text-${priority.color}-300 font-medium`
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mr-2 bg-${priority.color}-500`}></div>
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                🔄 Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm mb-2"
              >
                <option value="date">Date</option>
                <option value="title">Title</option>
                <option value="category">Category</option>
                <option value="priority">Priority</option>
              </select>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setSortOrder('asc')}
                  className={`flex-1 px-3 py-1.5 text-sm rounded-md ${
                    sortOrder === 'asc'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  ↑ Asc
                </button>
                <button
                  onClick={() => setSortOrder('desc')}
                  className={`flex-1 px-3 py-1.5 text-sm rounded-md ${
                    sortOrder === 'desc'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  ↓ Desc
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {(searchTerm || dateFilter !== 'all' || priorityFilter !== 'all') && (
        <div className="pt-2 border-t dark:border-gray-700">
          <button
            onClick={clearAllFilters}
            className="w-full px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default EventSearch;
 