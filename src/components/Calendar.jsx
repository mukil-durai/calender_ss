import React, { useState, useEffect, useRef } from 'react';
import { 
  format, addDays, startOfWeek, addMonths, subMonths, 
  getYear, getMonth, startOfMonth, endOfMonth, 
  isToday, isSameMonth, addYears, subYears, getDate, 
  isSameDay, parseISO, formatISO, addMinutes,
  getDaysInMonth
} from 'date-fns';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import EventModal from './EventModal';
import MiniCalendar from './MiniCalendar';
import { categoriesData } from '../data/categories';
import { useSwipeable } from 'react-swipeable'; // You'll need to install this package
import { isHoliday, getHolidayDetails, isSunday, getHolidayInfo, getHolidayTypeColor, getHolidayClasses } from '../data/holidays';
import YearDetailsModal from './YearDetailsModal'; // Import the new modal component
import AllEventsModal from './AllEventsModal';
import { CheckCircle, ListFilter, Info } from 'lucide-react'; // You can use any icon here, e.g. Lightbulb, HelpCircle, etc.
import eventsData from '../data/events.json'; // <-- Add this import

const loadLocalEvents = () => {
  try {
    const local = localStorage.getItem('userEvents');
    return local ? JSON.parse(local) : [];
  } catch {
    return [];
  }
};

const saveLocalEvents = (events) => {
  try {
    localStorage.setItem('userEvents', JSON.stringify(events));
  } catch {}
};

const getHolidayEvents = () => {
  // Convert Kerala holidays to event format
  return (require('../data/holidays').keralaHolidays || []).map(h => ({
    id: `holiday-${h.date}`,
    title: h.name,
    date: h.date,
    startTime: '00:00',
    endTime: '23:59',
    color: 'emerald',
    description: h.description,
    type: h.type || 'Holiday',
    isHoliday: true
  }));
};

const Calendar = ({ searchQuery = '' }) => {
  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [events, setEvents] = useState([]);
  const [localEvents, setLocalEvents] = useState(loadLocalEvents());
  const [categories, setCategories] = useState(categoriesData);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toast, setToast] = useState(null);
  const [showYearDetailsModal, setShowYearDetailsModal] = useState(false);
  const [showAllEventsModal, setShowAllEventsModal] = useState(false);
  const [showTips, setShowTips] = useState(false); // <-- Add this line
  const yearDetailsButtonRef = useRef(null); // <-- Add this ref
  const calendarRef = useRef(null); // <-- Add this line

  // Load events from static JSON file on mount
  useEffect(() => {
    setEvents(eventsData);
  }, []);

  // Improved search filtering
  useEffect(() => {
    console.log("Events:", events);
    console.log("Search query:", searchQuery);
    
    if (searchQuery) {
      const filtered = events.filter(event => {
        // Make search case-insensitive and more robust
        const matchesSearch = 
          (event.title && event.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()));
        
        if (matchesSearch) {
          console.log("Match found:", event.title);
        }
        
        return matchesSearch;
      });
      console.log("Filtered events:", filtered);
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents(events);
    }
  }, [events, searchQuery]);

  // Check for reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      events.forEach(event => {
        if (event.reminder && !event.reminderShown) {
          const reminderTime = new Date(event.date);
          const [hours, minutes] = event.startTime.split(':');
          reminderTime.setHours(parseInt(hours));
          reminderTime.setMinutes(parseInt(minutes) - event.reminderMinutes);
          
          if (now >= reminderTime && now <= new Date(event.date)) {
            // Show reminder notification
            if (Notification.permission === "granted") {
              new Notification(`Reminder: ${event.title}`, {
                body: `Event starts in ${event.reminderMinutes} minutes`,
                icon: '/calendar-icon.png'
              });
              
              // Mark reminder as shown
              setEvents(prev => prev.map(e => 
                e.id === event.id ? { ...e, reminderShown: true } : e
              ));
            }
          }
        }
      });
    };
    
    // Check for reminders every minute
    const intervalId = setInterval(checkReminders, 60000);
    
    // Request notification permission
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    
    return () => clearInterval(intervalId);
  }, [events]);

  // Responsive: detect mobile on mount and on resize
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 640;
      setIsMobile(newIsMobile);
      setShowSidebar(!newIsMobile);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Navigation functions
  const goToToday = () => setCurrentDate(new Date());
  const nextPeriod = () => {
    switch(view) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addDays(currentDate, 7));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'year':
        setCurrentDate(addYears(currentDate, 1));
        break;
    }
  };
  
  const prevPeriod = () => {
    switch(view) {
      case 'day':
        setCurrentDate(addDays(currentDate, -1));
        break;
      case 'week':
        setCurrentDate(addDays(currentDate, -7));
        break;
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'year':
        setCurrentDate(subYears(currentDate, 1));
        break;
    }
  };

  // Get header text based on view
  const getHeaderText = () => {
    switch(view) {
      case 'day':
        return format(currentDate, 'MMMM d, yyyy');
      case 'week': {
        const start = startOfWeek(currentDate, { weekStartsOn: 0 });
        const end = addDays(start, 6);
        const isSameMonth = getMonth(start) === getMonth(end);
        const isSameYear = getYear(start) === getYear(end);
        
        if (isSameMonth && isSameYear) {
          return `${format(start, 'MMMM yyyy')} - Week ${format(start, 'w')}`;
        } else if (isSameYear) {
          return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        } else {
          return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
        }
      }
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'year':
        return format(currentDate, 'yyyy');
      default:
        return '';
    }
  };

  // Day View Component with improved time display
  const DayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const eventsForDay = getEventsForDate(currentDate);

    return (
      <div className="grid grid-cols-1 border-t border-l dark:border-gray-700 text-sm">
        {/* Header with real-time clock */}
        <div className="border-r border-b dark:border-gray-700 p-2 text-center font-semibold bg-gray-100 dark:bg-gray-800 dark:text-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div>{format(currentDate, 'EEEE, MMMM d, yyyy')}</div>
            <div className="flex items-center text-sm font-mono bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-800 dark:text-blue-200">{format(currentTime, 'HH:mm:ss')}</span>
            </div>
          </div>
        </div>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          {hours.map((hour) => {
            const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
            const eventsForTimeSlot = getEventsForDateAndTime(currentDate, timeSlot);
            const isCurrentHour = isToday(currentDate) && hour === currentTime.getHours();
            
            return (
              <div 
                key={hour} 
                className={`grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] border-b dark:border-gray-700 ${isCurrentHour ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                onClick={() => handleDateClick(currentDate, timeSlot)}
              >
                <div className={`border-r dark:border-gray-700 p-2 text-center text-sm bg-gray-50 dark:bg-gray-800 dark:text-gray-300 font-medium ${isCurrentHour ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200' : ''}`}>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold">
                      {hour === 0 ? '12' : hour > 12 ? hour - 12 : hour}
                    </span>
                    <span className="text-xs"/>

                      {hour < 12 ? 'AM' : 'PM'}
                    </div>
                </div>
                <Droppable droppableId={`0-${timeSlot}`}>
                  {(provided) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-16 hover:bg-gray-50 dark:hover:bg-gray-800/50 relative cursor-pointer ${isCurrentHour ? 'border-l-2 border-blue-500' : ''}`}
                    >
                      {/* Show events for this time slot (stacked, not absolute) */}
                      <div className="flex flex-col gap-1">
                        {eventsForTimeSlot.map((event, idx) => (
                          <Draggable key={event.id} draggableId={event.id} index={idx}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`relative min-h-8 bg-${event.color || 'blue'}-100 dark:bg-${event.color || 'blue'}-800/40 border-l-4 border-${event.color || 'blue'}-500 p-2 text-xs z-10 dark:text-white rounded-r-md shadow-sm calendar-event mb-1`}
                                onClick={(e) => handleEventClick(event, e)}
                              >
                                <div className="font-medium">{event.title}</div>
                                <div className="text-xs opacity-80">{event.startTime} - {event.endTime}</div>
                                {event.description && <div className="truncate text-xs mt-1 opacity-70">{event.description}</div>}
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </div>
                      {provided.placeholder}
                      
                      {/* Current time indicator */}
                      {isCurrentHour && isToday(currentDate) && (
                        <div 
                          className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 shadow-sm"
                          style={{ 
                            top: `${(currentTime.getMinutes() / 60) * 100}%`,
                          }}
                        >
                          <div className="absolute right-0 top-0 transform -translate-y-1/2 bg-red-500 text-white text-xs px-1 rounded-l-sm font-mono">
                            {format(currentTime, 'HH:mm')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </DragDropContext>
      </div>
    );
  };

  // Week View Component with improved time display and mobile responsiveness
  const WeekView = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="grid grid-cols-8 border-t border-l dark:border-gray-700 text-sm overflow-x-auto">
        {/* Headers */}
        <div className="border-r border-b dark:border-gray-700 p-1 sm:p-2 text-center font-semibold bg-gray-100 dark:bg-gray-800 dark:text-gray-200 sticky top-0 z-10 min-w-[50px] sm:min-w-[80px]">
          <div className="flex flex-col items-center">
            <span className="text-xs hidden xs:block">Time</span>
            <div className="flex items-center text-xs font-mono bg-blue-100 dark:bg-blue-900/30 px-1 py-0.5 rounded mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-800 dark:text-blue-200 text-2xs sm:text-xs">{format(currentTime, 'HH:mm')}</span>
            </div>
          </div>
        </div>
        {days.map((day, i) => {
          const dayIsSunday = isSunday(day);
          const dayIsHoliday = isHoliday(day);
          const holidayInfo = dayIsHoliday ? getHolidayDetails(day) : null;
          const holidayColor = dayIsSunday ? 'red' : (holidayInfo ? getHolidayTypeColor(holidayInfo.type) : '');
          
          return (
            <div key={i} className={`
              border-r border-b dark:border-gray-700 p-1 sm:p-2 text-center font-semibold sticky top-0 z-10 min-w-[70px] sm:min-w-[100px]
              ${isToday(day) ? 'bg-blue-100 dark:bg-blue-900 dark:text-blue-100' : 
                dayIsSunday ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 
                dayIsHoliday ? `bg-${holidayColor}-50 dark:bg-${holidayColor}-900/30 text-${holidayColor}-700 dark:text-${holidayColor}-300` : 
                'bg-gray-100 dark:bg-gray-800 dark:text-gray-200'}`}
            >
              <div className="text-2xs sm:text-xs">{format(day, 'EEE')}</div>
              <div className={`text-base sm:text-lg font-bold ${isToday(day) ? 'bg-blue-500 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center mx-auto' : ''}`}>
                {format(day, 'd')}
              </div>
              
              {/* Holiday name */}
              {(dayIsSunday || dayIsHoliday) && (
                <div className="text-2xs mt-1 truncate font-normal" title={holidayInfo?.type || 'Weekly Holiday'}>
                  {dayIsSunday ? 'Sunday' : holidayInfo?.name}
                </div>
              )}
            </div>
          );
        })}

        {/* Time Slots */}
        <DragDropContext onDragEnd={handleDragEnd}>
          {hours.map((hour) => {
            const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
            const isCurrentHour = hour === currentTime.getHours();
            
            return (
              <React.Fragment key={hour}>
                <div className={`border-r border-b p-1 sm:p-2 text-center bg-gray-50 dark:bg-gray-800 dark:text-gray-300 ${isCurrentHour ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200' : ''}`}>
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold">
                      {hour === 0 ? '12' : hour > 12 ? hour - 12 : hour}
                    </span>
                    <span className="text-2xs">
                      {hour < 12 ? 'AM' : 'PM'}
                    </span>
                  </div>
                </div>
                {days.map((day, dayIndex) => {
                  const eventsForTimeSlot = getEventsForDateAndTime(day, timeSlot);
                  const isDayToday = isToday(day);
                  const isCurrentTimeSlot = isDayToday && isCurrentHour;
                  
                  return (
                    <Droppable key={dayIndex} droppableId={`${dayIndex}-${timeSlot}`}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          onClick={() => handleDateClick(day, timeSlot)}
                          className={`border-r border-b dark:border-gray-700 min-h-16 relative hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer
                            ${isDayToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                            ${isCurrentTimeSlot ? 'border-l-2 border-blue-500' : ''}`}
                        >
                          {/* Show events for this time slot and day (stacked, not absolute) */}
                          <div className="flex flex-col gap-1">
                            {eventsForTimeSlot.map((event, idx) => (
                              <Draggable key={event.id} draggableId={event.id} index={idx}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`relative min-h-8 bg-${event.color || 'blue'}-100 border-l-4 border-${event.color || 'blue'}-500 p-1 text-xs z-10 rounded-r-sm shadow-sm mb-1 calendar-event`}
                                    onClick={(e) => handleEventClick(event, e)}
                                  >
                                    <div className="font-medium truncate">{event.title}</div>
                                    <div className="truncate text-2xs opacity-80">{event.startTime} - {event.endTime}</div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </div>
                          {provided.placeholder}
                          
                          {/* Current time indicator */}
                          {isCurrentTimeSlot && (
                            <div 
                              className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 shadow-sm"
                              style={{ 
                                top: `${(currentTime.getMinutes() / 60) * 100}%`,
                              }}
                            >
                              <div className="absolute right-0 top-0 transform -translate-y-1/2 bg-red-500 text-white text-2xs px-1 rounded-l-sm font-mono">
                                {format(currentTime, 'HH:mm')}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </React.Fragment>
            );
          })}
        </DragDropContext>
      </div>
    );
  };

  // Month View Component - improve responsiveness
  const MonthView = () => {
    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);
    const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 });
    
    // Generate 6 weeks of days to ensure we cover the month
    const days = Array.from({ length: 42 }, (_, i) => addDays(startDate, i));
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Helper to check for overlapping events on a date
    const hasOverlappingEvents = (date) => {
      const dayEvents = getEventsForDate(date);
      for (let i = 0; i < dayEvents.length; i++) {
        for (let j = i + 1; j < dayEvents.length; j++) {
          const a = dayEvents[i], b = dayEvents[j];
          // Check for time overlap
          if (
            a.startTime < b.endTime && a.endTime > b.startTime
          ) {
            return true;
          }
        }
      }
      return false;
    };

    // Helper to get conflicting event IDs for a date
    const getConflictingEventIds = (date) => {
      const dayEvents = getEventsForDate(date);
      const conflicts = new Set();
      for (let i = 0; i < dayEvents.length; i++) {
        for (let j = i + 1; j < dayEvents.length; j++) {
          const a = dayEvents[i], b = dayEvents[j];
          if (a.startTime < b.endTime && a.endTime > b.startTime) {
            conflicts.add(a.id);
            conflicts.add(b.id);
          }
        }
      }
      return conflicts;
    };

    return (
      <div className="border-t border-l dark:border-gray-700">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 text-sm sticky top-0 z-10 bg-white dark:bg-gray-800">
          {weekdays.map((day, i) => (
            <div key={i} className={`
              border-r border-b dark:border-gray-700 p-1 sm:p-2 text-center font-semibold font-montserrat
              ${i === 0 ? 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 text-red-700 dark:text-red-300' : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-200'}
            `}>
              <span className="hidden xxs:inline">{day}</span>
              <span className="xxs:hidden">{day[0]}</span>
            </div>
          ))}
        </div>
        
        {/* Calendar days - improve cell height for mobile */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const dayIsSunday = isSunday(day);
            const dayIsHoliday = isHoliday(day);
            const holidayInfo = getHolidayDetails(day);
            const isHolidayDate = dayIsSunday || dayIsHoliday;
            const holidayColor = dayIsSunday ? 'red' : (holidayInfo ? getHolidayTypeColor(holidayInfo.type) : '');
            const holidayClasses = holidayInfo ? getHolidayClasses(holidayInfo.type) : 
              { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-500', icon: '🌞', gradient: 'from-rose-500 to-red-600' };
            const isConflict = hasOverlappingEvents(day);
            const conflictingIds = getConflictingEventIds(day);
            
            return (
              <div 
                key={i} 
                className={`border-r border-b dark:border-gray-700 min-h-14 xs:min-h-16 sm:min-h-24 p-1 sm:p-2 group
                  ${isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500'} 
                  ${isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  ${isHolidayDate && isCurrentMonth ? 'relative overflow-visible' : ''}
                  ${isConflict && isCurrentMonth ? 'bg-red-100 dark:bg-red-900/30' : ''}
                  transition duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/80`}
                onClick={() => handleDateClick(day)}
              >
                {/* Day number and conflict icon with improved mobile layout */}
                <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                  <div className={`
                    font-medium w-4 h-4 xs:w-5 xs:h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-2xs xs:text-xs sm:text-sm
                    ${isToday(day) ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm' : 
                      dayIsSunday ? 'text-red-600 dark:text-red-400' : 
                      dayIsHoliday ? holidayClasses.text : 
                      'dark:text-gray-200'}`}
                  >
                    {getDate(day)}
                  </div>
                  {/* Show conflict icon inline with the day number - smaller on mobile */}
                  {isConflict && isCurrentMonth && (
                    <span
                      title="Overlapping events"
                      className="ml-1 w-3 h-3 xs:w-4 xs:h-4 bg-red-500 text-white text-2xs xs:text-xs rounded-full flex items-center justify-center font-bold shadow"
                    >
                      ⚠️
                    </span>
                  )}
                </div>
                
                {/* Holiday banner - optimized for mobile */}
                {isHolidayDate && isCurrentMonth && (
                  <div className={`
                    relative text-[8px] xs:text-2xs sm:text-xs font-medium py-0.5 xs:py-1 sm:py-2 px-1 sm:px-3 mb-0.5 sm:mb-2 rounded-md overflow-visible
                    ${dayIsSunday ? 
                      'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' : 
                      dayIsHoliday && holidayInfo?.type === 'government' ? 
                        'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' :
                        'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    }
                    hover:shadow-md transition-shadow
                  `}>
                    <div className="flex items-center gap-0.5 sm:gap-2">
                      <span className="text-xs sm:text-base">{dayIsSunday ? '🌞' : holidayInfo?.icon || '📅'}</span>
                      <div className="flex-1 overflow-hidden">
                        <span className="font-semibold whitespace-normal break-words leading-tight text-[8px] xs:text-2xs sm:text-xs">
                          {dayIsSunday ? 'Sun' : (holidayInfo?.name || '').substring(0, 10) + (holidayInfo?.name?.length > 10 ? '...' : '')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Events with improved mobile display */}
                <div className="space-y-0.5">
                  {isCurrentMonth && getEventsForDate(day).slice(0, isMobile ? 1 : 3).map((event, idx) => (
                    <div key={idx} className="group/event relative">
                      <div className={`
                        text-[8px] xs:text-2xs sm:text-xs p-0.5 xs:p-1 sm:p-1.5
                        ${conflictingIds.has(event.id)
                          ? 'bg-gradient-to-r from-red-400 via-yellow-200 to-orange-400 dark:from-red-700 dark:via-yellow-600 dark:to-orange-600 text-red-900 dark:text-yellow-100 border-l-2 border-red-600 dark:border-yellow-400 animate-pulse-strong'
                          : `bg-gradient-to-r from-${event.color}-50 to-${event.color}-100 
                            dark:from-${event.color}-900/40 dark:to-${event.color}-900/30 
                            text-${event.color}-800 dark:text-${event.color}-200 
                            border-l-2 border-${event.color}-500 dark:border-${event.color}-400`
                      }
                      rounded truncate font-poppins shadow-sm
                      `}>
                        {event.title}
                      </div>
                      {/* Event tooltip - optimized position for mobile */}
                      <div className={`invisible group-hover/event:visible absolute z-50 w-48 xs:w-64 p-2 xs:p-3
                        bg-white dark:bg-gray-800 shadow-xl rounded-lg border dark:border-gray-700 text-xs sm:text-sm
                        ${i % 7 >= 3 ? 'right-0' : 'left-0'} 
                        ${Math.floor(i / 7) >= 3 ? 'bottom-full mb-2' : 'top-full mt-2'}`}
                      >
                        <div className="font-semibold text-gray-900 dark:text-white mb-1">{event.title}</div>
                        <div className="text-2xs xs:text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {event.startTime} - {event.endTime}
                        </div>
                        {event.description && (
                          <div className="text-2xs xs:text-xs text-gray-600 dark:text-gray-300 mb-2">
                            {event.description}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center text-2xs xs:text-xs text-gray-500 dark:text-gray-400">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* More compact "+X more" indicator for mobile */}
                  {isCurrentMonth && getEventsForDate(day).length > (isMobile ? 1 : 3) && (
                    <div className="text-[8px] xs:text-2xs text-center text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 py-0.5 rounded">
                      +{getEventsForDate(day).length - (isMobile ? 1 : 3)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Year View Component
  const YearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    const year = getYear(currentDate);
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
        {months.map((month) => {
          const monthDate = new Date(year, month, 1);
          const firstDayOfMonth = startOfMonth(monthDate);
          const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 });
          const days = Array.from({ length: 42 }, (_, i) => addDays(startDate, i));
          const isCurrentMonth = getMonth(new Date()) === month && getYear(new Date()) === year;

          return (
            <div
              key={month}
              className={`relative overflow-hidden border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow ${
                isCurrentMonth ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Month Header */}
              <div className={`p-2 text-center font-semibold ${
                isCurrentMonth 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-200'
              }`}>
                {format(monthDate, 'MMMM')}
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 text-xs bg-gray-50 dark:bg-gray-900/50">
                {weekdays.map((day, i) => (
                  <div
                    key={i}
                    className={`p-1 text-center font-medium ${
                      i === 0 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7">
                {days.map((day, i) => {
                  const isMonth = getMonth(day) === month;
                  const isTodayCell = isToday(day);
                  const dayIsSunday = isSunday(day);
                  const dayIsHoliday = isHoliday(day);
                  const holidayInfo = dayIsHoliday ? getHolidayDetails(day) : null;
                  const hasEvents = getEventsForDate(day).length > 0;
                  
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setCurrentDate(day);
                        setView('month');
                      }}
                      className="group relative h-8 flex items-center justify-center cursor-pointer"
                    >
                      <div className={`
                        text-xs font-medium transition-all
                        ${!isMonth ? 'text-gray-400 dark:text-gray-600' : ''}
                        ${isTodayCell ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
                        ${dayIsSunday && isMonth ? 'text-red-600 dark:text-red-400' : ''}
                        ${dayIsHoliday && isMonth ? 'text-green-600 dark:text-green-400' : ''}
                        hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full w-6 h-6 flex items-center justify-center
                      `}>
                        {getDate(day)}
                      </div>

                      {/* Holiday tooltip */}
                      {isMonth && (dayIsSunday || dayIsHoliday) && (
                        <div className="absolute z-30 invisible group-hover:visible w-48 bg-white dark:bg-gray-800 p-2 rounded-md shadow-lg border dark:border-gray-700 
                          -translate-x-1/2 left-1/2 bottom-full mb-2 text-center">
                          {dayIsSunday ? (
                            <div className="text-red-600 dark:text-red-400 text-xs font-medium">
                              Sunday Holiday
                            </div>
                          ) : (
                            <>
                              <div className="text-green-600 dark:text-green-400 text-xs font-medium">
                                {holidayInfo?.name}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400 text-[10px] mt-0.5">
                                {holidayInfo?.type}
                              </div>
                            </>
                          )}
                          <div className="absolute w-2 h-2 bg-white dark:bg-gray-800 border-r dark:border-gray-700 border-b dark:border-gray-700 
                            left-1/2 bottom-0 transform translate-y-1/2 -translate-x-1/2 rotate-45"></div>
                        </div>
                      )}
                      
                      {/* Event indicator for days with events */}
                      {isMonth && hasEvents && (
                        <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Event handling functions - Allow event creation at any time
  const handleDateClick = (date, timeSlot = null) => {
    // Check if the event would end in the past
    let isPast = false;
    if (date) {
      const eventDateStr = format(date, 'yyyy-MM-dd');
      let endTime = timeSlot || '23:59';
      if (timeSlot) {
        // Default to 1 hour after start time
        const [hours, minutes] = timeSlot.split(':').map(Number);
        const endDateTime = new Date();
        endDateTime.setHours(hours, minutes, 0, 0);
        endDateTime.setMinutes(endDateTime.getMinutes() + 60);
        endTime = format(endDateTime, 'HH:mm');
      }
      const eventEnd = new Date(`${eventDateStr}T${endTime}`);
      if (eventEnd < new Date()) {
        isPast = true;
      }
    }
    if (isPast) {
      setToast('Cannot add events that end in the past');
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setSelectedDate(date);
    setSelectedEvent(null);
    setSelectedSlot(timeSlot);
    setShowEventModal(true);
  };
  
  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setSelectedDate(new Date(event.date));
    setShowEventModal(true);
  };
  
  const handleSaveEvent = (eventData) => {
    // Check if event ends in the past
    const eventEnd = new Date(`${eventData.date}T${eventData.endTime}`);
    if (eventEnd < new Date()) {
      setToast('Time is finished, add for a future date');
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (selectedEvent) {
      // Update existing event
      setEvents(prev => prev.map(event => 
        event.id === selectedEvent.id ? { ...eventData, id: event.id } : event
      ));
      setLocalEvents(prev => prev.map(event => 
        event.id === selectedEvent.id ? { ...eventData, id: event.id } : event
      ));
    } else {
      // Add new event
      const newEvent = {
        ...eventData,
        id: Date.now().toString(),
        reminderShown: false
      };
      setEvents(prev => [...prev, newEvent]);
      setLocalEvents(prev => [...prev, newEvent]);
    }
  };
  
  const generateRecurringEvents = (baseEvent) => {
    const events = [baseEvent];
    const { recurringType, recurringEndDate } = baseEvent;
    
    if (!recurringEndDate) return events;
    
    const endDate = new Date(recurringEndDate);
    let currentDate = new Date(baseEvent.date);
    
    while (true) {
      // Calculate next occurrence based on recurrence type
      if (recurringType === 'daily') {
        currentDate = addDays(currentDate, 1);
      } else if (recurringType === 'weekly') {
        currentDate = addDays(currentDate, 7);
      } else if (recurringType === 'monthly') {
        currentDate = addMonths(currentDate, 1);
      } else if (recurringType === 'yearly') {
        currentDate = addYears(currentDate, 1);
      }
      
      // Stop if we've passed the end date
      if (currentDate > endDate) break;
      
      events.push({
        ...baseEvent,
        id: Date.now().toString() + '-' + events.length,
        date: formatISO(currentDate, { representation: 'date' }),
        reminderShown: false
      });
    }
    
    return events;
  };
  
  const handleDeleteEvent = (eventId) => {
    setEvents(prev => prev.filter((event) => event.id !== eventId));
    setLocalEvents(prev => prev.filter((event) => event.id !== eventId));
    setShowEventModal(false);
  };
  
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const [dayIndex, timeSlot] = destination.droppableId.split('-');
    
    // Get the correct day from the current view
    let targetDay;
    if (view === 'day') {
      targetDay = currentDate;
    } else if (view === 'week') {
      const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 0 });
      targetDay = addDays(startOfCurrentWeek, parseInt(dayIndex));
    }
    
    setEvents(prev => prev.map(event => {
      if (event.id === draggableId) {
        // Calculate new date and time
        const newDate = formatISO(targetDay, { representation: 'date' });
        let [hours, minutes] = timeSlot.split(':');
        
        return {
          ...event,
          date: newDate,
          startTime: timeSlot,
          endTime: format(addMinutes(new Date().setHours(parseInt(hours), parseInt(minutes)), 
            getEventDuration(event)), 'HH:mm')
        };
      }
      return event;
    }));
  };
  
  const getEventDuration = (event) => {
    const [startHours, startMinutes] = event.startTime.split(':').map(Number);
    const [endHours, endMinutes] = event.endTime.split(':').map(Number);
    
    return (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  };
  
  const getEventsForDate = (date) => {
    return filteredEvents.filter(event => 
      isSameDay(parseISO(event.date), date)
    );
  };
  
  const getEventsForDateAndTime = (date, timeSlot) => {
    return getEventsForDate(date).filter(event => {
      const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
      const [startHour, startMinute] = event.startTime.split(':').map(Number);
      const [endHour, endMinute] = event.endTime.split(':').map(Number);
      
      const slotTime = slotHour * 60 + slotMinute;
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;
      
      return slotTime >= startTime && slotTime < endTime;
    });
  };
  
  const exportCalendar = () => {
    // Create iCalendar format
    let icalContent = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Calendar App//EN\r\n';
    
    events.forEach(event => {
      icalContent += 'BEGIN:VEVENT\r\n';
      icalContent += `UID:${event.id}@calendar-app\r\n`;
      
      const eventDate = parseISO(event.date);
      const [startHours, startMinutes] = event.startTime.split(':').map(Number);
      const [endHours, endMinutes] = event.endTime.split(':').map(Number);
      
      const startDate = new Date(eventDate);
      startDate.setHours(startHours, startMinutes);
      
      const endDate = new Date(eventDate);
      endDate.setHours(endHours, endMinutes);
      
      icalContent += `DTSTART:${format(startDate, 'yyyyMMddTHHmmss')}\r\n`;
      icalContent += `DTEND:${format(endDate, 'yyyyMMddTHHmmss')}\r\n`;
      icalContent += `SUMMARY:${event.title}\r\n`;
      
      if (event.description) {
        icalContent += `DESCRIPTION:${event.description}\r\n`;
      }
      
      icalContent += 'END:VEVENT\r\n';
    });
    
    icalContent += 'END:VCALENDAR';
    
    // Create and download file
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'calendar.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const shareCalendar = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Calendar',
        text: 'Check out my calendar',
        url: 'https://calender-ss-nine.vercel.app/',
      });
    } else {
      // Fallback
      navigator.clipboard.writeText(window.location.href);
      alert('Calendar URL copied to clipboard!');
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => nextPeriod(),
    onSwipedRight: () => prevPeriod(),
    preventScrollOnSwipe: true,
    trackMouse: false,
  });

  // Function to calculate year details
  const getYearDetails = () => {
    const year = getYear(currentDate);
    const isLeapYear = new Date(year, 1, 29).getDate() === 29;
    const holidays = events.filter(event => isHoliday(parseISO(event.date)) && getYear(parseISO(event.date)) === year);
    const govtHolidays = holidays.filter(event => {
      const h = getHolidayDetails(parseISO(event.date));
      return h && h.type === 'government';
    });
    const sundays = Array.from({ length: 12 }, (_, month) => {
      const firstDay = new Date(year, month, 1);
      return Array.from({ length: getDaysInMonth(firstDay) }, (_, day) => {
        const date = new Date(year, month, day + 1);
        return isSunday(date) ? date : null;
      }).filter(Boolean);
    }).flat();
    const weeks = Array.from({ length: 53 }, (_, i) => i + 1).filter(w => {
      // Check if week exists in this year
      const d = new Date(year, 0, 1 + (w - 1) * 7);
      return d.getFullYear() === year;
    });
    const jan1 = new Date(year, 0, 1);
    const dec31 = new Date(year, 11, 31);
    return {
      year,
      isLeapYear,
      holidays,
      govtHolidays,
      sundays,
      weeks: weeks.length,
      startDay: format(jan1, 'EEEE, MMMM d'),
      endDay: format(dec31, 'EEEE, MMMM d'),
      allGovtHolidays: govtHolidays.map(e => ({
        date: format(parseISO(e.date), 'MMM d, yyyy'),
        name: getHolidayDetails(parseISO(e.date))?.name || '',
      })),
    };
  };

  // Add this to the existing useEffect section after the events useState
  useEffect(() => {
    // Apply smooth scroll to calendar view changes
    const applyScrollEffects = () => {
      // Get all event elements that should animate in
      const eventElements = document.querySelectorAll('.calendar-event');
      
      eventElements.forEach((element, index) => {
        // Add a small delay based on index for cascade effect
        setTimeout(() => {
          element.classList.add('event-visible');
        }, index * 50);
      });
    };
    
    // Apply effects when view or date changes
    applyScrollEffects();
    
    // Scroll to current time in day and week views
    if (view === 'day' || view === 'week') {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Calculate position to scroll to (current hour minus 2 to show context)
      const scrollHour = Math.max(0, currentHour - 2);
      const hourHeight = 64; // Approximate height of an hour block
      
      // Scroll the calendar view
      if (calendarRef.current) {
        calendarRef.current.scrollTop = scrollHour * hourHeight;
      }
    }
  }, [view, currentDate]);

  // Floating Action Button (FAB) handler
  const handleFabClick = () => {
    setSelectedDate(null); // No date pre-selected, force user to pick
    setSelectedEvent(null);
    setSelectedSlot(null);
    setShowEventModal(true);
  };

  // Listen for spacebar to allow quick add (without date prompt)
  useEffect(() => {
    const handleSpace = (e) => {
      // Only trigger if not focused on input/textarea and not already in modal
      if (
        e.code === 'Space' &&
        !showEventModal &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA'
      ) {
        setQuickAddMode(false); // Quick add: don't ask for date
        setSelectedDate(currentDate);
        setSelectedEvent(null);
        setSelectedSlot(null);
        setShowEventModal(true);
      }
    };
    window.addEventListener('keydown', handleSpace);
    return () => window.removeEventListener('keydown', handleSpace);
  }, [showEventModal, currentDate]);

  // Show summary toast only once per user, not the tips modal
  useEffect(() => {
    if (!localStorage.getItem('gestureSeen')) {
      setToast('Events from JSON loaded, calendar grid ready, conflict coloring done');
      localStorage.setItem('gestureSeen', '1');
      setTimeout(() => setToast(null), 3000);
    }
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 dark:bg-gray-900">
      {/* Toast notification - more compact on mobile */}
      {toast && (
        <div className="fixed top-2 sm:top-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-lg shadow-2xl bg-green-600 text-white text-xs sm:text-sm font-semibold border border-green-700 animate-fade-in-down relative max-w-[90vw] sm:max-w-md">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="flex-1">{toast}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 p-1 rounded-full hover:bg-green-700/60 transition"
              aria-label="Close notification"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      {/* Mobile sidebar toggle */}
      {isMobile && !showSidebar && (
        <button 
          onClick={() => setShowSidebar(true)}
          className="fixed top-16 left-2 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border dark:border-gray-700"
          aria-label="Show sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      
      {/* Sidebar (fullscreen on mobile) */}
      {showSidebar && (
        <div className={`fixed inset-0 z-40 md:static md:z-auto bg-white dark:bg-gray-800 border-r dark:border-gray-700 w-full md:w-64 flex flex-col h-screen overflow-hidden transition-all duration-200 ${isMobile ? 'max-w-full' : ''}`}>
          {/* Mobile close button */}
          {isMobile && (
            <div className="sticky top-0 z-10 flex justify-between items-center p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
              <h2 className="font-bold text-lg">Calendar Menu</h2>
              <button 
                onClick={() => setShowSidebar(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4">
            <MiniCalendar 
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              events={events}
            />
            <div>
              <h3 className="font-bold text-lg mb-2 dark:text-gray-100">Tools</h3>
              <div className="space-y-2">
                <button 
                  onClick={exportCalendar}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-left text-xs sm:text-sm"
                >
                  Export Calendar
                </button>
                <button 
                  onClick={shareCalendar}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-left text-xs sm:text-sm"
                >
                  Share Calendar
                </button>
              </div>
            </div>
          </div>
          {isMobile && <div className="h-6 safe-area-inset-bottom"></div>}
        </div>
      )}
      
      {/* Main Calendar Area */}
      <div className="flex-1 overflow-hidden flex flex-col h-screen">
        {/* Header - more compact on mobile */}
        <div className="py-1 px-1 sm:py-2 sm:px-2 md:p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-3 w-full sm:w-auto">
              <div className="flex items-center space-x-1">
                <button onClick={prevPeriod} className="p-1 sm:p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button onClick={nextPeriod} className="p-1 sm:p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <h2 className="text-sm sm:text-base md:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {getHeaderText()}
              </h2>
              <button
                ref={yearDetailsButtonRef}
                className="p-1 sm:p-1.5 rounded-full bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800 transition-colors text-green-700 dark:text-green-300"
                title="Show Year Details"
                onClick={() => setShowYearDetailsModal(true)}
              >
                <CheckCircle size={isMobile ? 14 : 18} />
              </button>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
              <button 
                onClick={goToToday} 
                className="bg-blue-600 text-white px-2 py-1 sm:px-3 sm:py-1.5 text-2xs sm:text-xs rounded-md hover:bg-blue-700 transition"
              >
                Today
              </button>
              <button
                onClick={() => setShowTips(true)}
                className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 sm:px-2 sm:py-1.5 text-2xs sm:text-xs rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-800 transition flex items-center"
                title="Show calendar tips and gestures"
              >
                <Info className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1">Tips</span>
              </button>
              <button 
                onClick={() => setShowAllEventsModal(true)} 
                className="bg-purple-600 text-white px-2 py-1 sm:px-3 sm:py-1.5 text-2xs sm:text-xs rounded-md hover:bg-purple-700 transition flex items-center"
                title="View all events"
              >
                <ListFilter className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1">All Events</span>
              </button>
              <div className="border rounded-md overflow-hidden flex dark:border-gray-700">
                <button 
                  onClick={() => setView('day')} 
                  className={`text-2xs sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 ${view === 'day' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  D
                </button>
                <button 
                  onClick={() => setView('week')} 
                  className={`text-2xs sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 border-l dark:border-gray-700 ${view === 'week' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  W
                </button>
                <button 
                  onClick={() => setView('month')} 
                  className={`text-2xs sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 border-l dark:border-gray-700 ${view === 'month' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  M
                </button>
                <button 
                  onClick={() => setView('year')} 
                  className={`text-2xs sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 border-l dark:border-gray-700 ${view === 'year' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  Y
                </button>
              </div>
            </div>
          </div>
          {/* Compact date/time info for mobile */}
          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between text-2xs xs:text-xs text-gray-500 dark:text-gray-400 mt-1 gap-1">
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 xs:h-4 xs:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium text-[9px] xs:text-xs">
                Today: {format(new Date(), isMobile ? 'MMM d' : 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center mt-1 xs:mt-0">
              <div className="bg-blue-50 dark:bg-blue-900/30 px-1 xs:px-2 py-0.5 xs:py-1 rounded-md flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-blue-700 dark:text-blue-300 font-mono text-[9px] xs:text-xs">{format(currentTime, 'HH:mm:ss')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div 
          className="flex-1 overflow-auto mobile-padding bg-gray-50 dark:bg-gray-900 scroll-smooth"
          ref={calendarRef}
          {...swipeHandlers}
        >
          {view === 'day' && <DayView />}
          {view === 'week' && <WeekView />}
          {view === 'month' && <MonthView />}
          {view === 'year' && <YearView />}
        </div>
        
        {/* Floating Action Button - adjusted position for mobile */}
        <button 
          onClick={handleFabClick}
          className="fixed bottom-4 right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-20 safe-area-inset-bottom text-xl"
          title="Add new event"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
      
      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          date={selectedDate}
          event={selectedEvent}
          timeSlot={selectedSlot}
          onClose={() => {
            setShowEventModal(false);
          }}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          categories={categories}
          existingEvents={selectedDate ? getEventsForDate(selectedDate) : []}
          requireDate={true} // Always require date selection
        />
      )}

      {/* Year Details Modal */}
      {showYearDetailsModal && (
        <YearDetailsModal
          yearDetails={getYearDetails()}
          onClose={() => setShowYearDetailsModal(false)}
          anchorRef={yearDetailsButtonRef}
        />
      )}

      {/* All Events Modal */}
      {showAllEventsModal && (
        <AllEventsModal
          events={events}
          onClose={() => setShowAllEventsModal(false)}
          onEdit={(event) => {
            setSelectedEvent(event);
            setSelectedDate(new Date(event.date));
            setShowEventModal(true);
            setShowAllEventsModal(false);
          }}
          onDelete={handleDeleteEvent}
          onAdd={() => {
            setSelectedDate(new Date());
            setSelectedEvent(null);
            setShowEventModal(true);
            setShowAllEventsModal(false);
          }}
        />
      )}

      {/* Tips Modal */}
      {showTips && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-xl shadow-2xl border dark:border-gray-700 w-full max-w-md sm:max-w-md p-4 sm:p-6 relative max-h-[90vh] flex flex-col mx-0 sm:mx-auto"
            style={{
              bottom: 0,
              left: 0,
              right: 0,
              position: 'fixed',
              margin: 'auto',
              ...(window.innerWidth < 640
                ? { borderRadius: '1.25rem 1.25rem 0 0', maxWidth: '100vw', width: '100vw', minHeight: '40vh' }
                : {}),
            }}
          >
            <button
              onClick={() => setShowTips(false)}
              className="absolute top-2 right-2 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-lg font-bold mb-3 text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Info className="h-5 w-5" /> Calendar Tips & Gestures
            </h2>
            <div className="overflow-y-auto pr-2" style={{ maxHeight: window.innerWidth < 640 ? '50vh' : '60vh' }}>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
                <li>
                  <span className="font-semibold">Swipe left/right</span> on the calendar to move between weeks/months (on touch devices).
                </li>
                <li>
                  <span className="font-semibold">Spacebar</span> to quickly add an event for the current date.
                </li>
                <li>
                  <span className="font-semibold">+</span> button to add an event (will ask for date).
                </li>
                <li>
                  <span className="font-semibold">Click on a day/time slot</span> to add an event at that time.
                </li>
                <li>
                  <span className="font-semibold">Drag & drop</span> events to reschedule them in day/week view.
                </li>
                <li>
                  <span className="font-semibold">Search bar</span> for fuzzy search (even with typos).
                </li>
                <li>
                  <span className="font-semibold">All Events</span> button to view, edit, or delete all events.
                </li>
                <li>
                  <span className="font-semibold">Conflict detection:</span> If you try to add or edit an event that overlaps with another, you'll see a warning about the conflict. Conflicting events are also color-highlighted in the calendar.
                </li>
                <li>
                  <span className="font-semibold">Color coding:</span> Events are color-coded for easy identification. You can pick a color when creating or editing an event.
                </li>
                <li>
                  <span className="font-semibold">Recurring events:</span> You can set events to repeat daily, weekly, monthly, or yearly.
                </li>
                <li>
                  <span className="font-semibold">Reminders:</span> Enable reminders to get notified before your event starts.
                </li>
                <li>
                  <span className="font-semibold">Export/Share:</span> Use the sidebar tools to export your calendar or share it.
                </li>
                <li>
                  <span className="font-semibold">Holiday highlighting:</span> Sundays and holidays are automatically highlighted in the calendar.
                </li>
                <li>
                  <span className="font-semibold">Tips</span> button (this one) to view these instructions anytime.
                </li>
              </ul>
            </div>
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
              Need more help? Contact support or check the documentation.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;