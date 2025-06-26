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
import { CheckCircle, ListFilter } from 'lucide-react'; // Add ListFilter to imports

const Calendar = ({ searchQuery = '' }) => {
  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('calendarEvents');
    return saved ? JSON.parse(saved) : [];
  });
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
  const yearDetailsButtonRef = useRef(null); // <-- Add this ref
  const calendarRef = useRef(null); // <-- Add this line

  // Save events to localStorage when they change
  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
    
    // Improved search filtering
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
                    <span className="text-xs">
                      {hour < 12 ? 'AM' : 'PM'}
                    </span>
                  </div>
                </div>
                <Droppable droppableId={`0-${timeSlot}`}>
                  {(provided) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-16 hover:bg-gray-50 dark:hover:bg-gray-800/50 relative cursor-pointer ${isCurrentHour ? 'border-l-2 border-blue-500' : ''}`}
                    >
                      {eventsForTimeSlot.map((event, idx) => (
                        <Draggable key={event.id} draggableId={event.id} index={idx}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`absolute top-0 left-0 right-0 min-h-16 bg-${event.color || 'blue'}-100 dark:bg-${event.color || 'blue'}-800/40 border-l-4 border-${event.color || 'blue'}-500 p-2 text-xs z-10 dark:text-white rounded-r-md shadow-sm calendar-event opacity-0 translate-y-2`}
                              onClick={(e) => handleEventClick(event, e)}
                            >
                              <div className="font-medium">{event.title}</div>
                              <div className="text-xs opacity-80">{event.startTime} - {event.endTime}</div>
                              {event.description && <div className="truncate text-xs mt-1 opacity-70">{event.description}</div>}
                            </div>
                          )}
                        </Draggable>
                      ))}
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
    const hours = Array.from({ length: 24 }, (_, i) => i); // Show all 24 hours
    
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
                          {/* Fix: Use relative/static positioning for events so they don't disappear on scroll */}
                          <div className="flex flex-col gap-1">
                            {eventsForTimeSlot.map((event, idx) => (
                              <Draggable key={event.id} draggableId={event.id} index={idx}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`relative min-h-8 bg-${event.color || 'blue'}-100 border-l-4 border-${event.color || 'blue'}-500 p-1 text-xs z-10 rounded-r-sm shadow-sm mb-1 calendar-event opacity-0 translate-y-2`}
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
    
    return (
      <div className="border-t border-l dark:border-gray-700">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 text-sm">
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
            
            return (
              <div 
                key={i} 
                className={`border-r border-b dark:border-gray-700 mobile-calendar-cell min-h-16 sm:min-h-24 p-1 sm:p-2 group
                  ${isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500'} 
                  ${isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  ${isHolidayDate && isCurrentMonth ? 'relative overflow-visible' : ''}
                  transition duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/80`}
                onClick={() => handleDateClick(day)}
              >
                <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                  <div className={`
                    font-medium w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full font-poppins text-xs sm:text-sm
                    ${isToday(day) ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm' : 
                      dayIsSunday ? 'text-red-600 dark:text-red-400' : 
                      dayIsHoliday ? holidayClasses.text : 
                      'dark:text-gray-200'}`}
                  >
                    {getDate(day)}
                  </div>
                </div>
                
                {/* Holiday name as highlighted banner - make it smaller on mobile */}
                {isHolidayDate && isCurrentMonth && (
                  <div className={`
                    relative text-2xs sm:text-xs font-medium py-1 sm:py-2 px-1.5 sm:px-3 mb-1 sm:mb-2 rounded-md overflow-visible
                    ${dayIsSunday ? 
                      'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' : 
                      dayIsHoliday && holidayInfo?.type === 'government' ? 
                        'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' :
                        'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    }
                    hover:shadow-md transition-shadow
                  `}>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-sm sm:text-base">{dayIsSunday ? '🌞' : holidayInfo?.icon || '📅'}</span>
                      <div className="flex-1 overflow-hidden">
                        <span className="font-semibold whitespace-normal break-words leading-tight text-2xs sm:text-xs">
                          {dayIsSunday ? 'Sunday' : holidayInfo?.name}
                        </span>
                        {!dayIsSunday && holidayInfo && (
                          <div className="text-[8px] sm:text-[10px] mt-0.5 opacity-75 hidden xs:block">
                            {holidayInfo.type}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Optimize events for mobile view */}
                <div className="space-y-0.5 sm:space-y-1">
                  {isCurrentMonth && getEventsForDate(day).slice(0, isMobile ? 1 : 3).map((event, idx) => (
                    <div key={idx} className="group/event relative">
                      <div className={`text-2xs sm:text-xs p-1 sm:p-1.5 bg-gradient-to-r from-${event.color}-50 to-${event.color}-100 
                        dark:from-${event.color}-900/40 dark:to-${event.color}-900/30 
                        text-${event.color}-800 dark:text-${event.color}-200 
                        rounded truncate font-poppins shadow-sm border-l-2 border-${event.color}-500 dark:border-${event.color}-400`}
                      >
                        {event.title}
                      </div>
                      {/* Event tooltip */}
                      <div className={`invisible group-hover/event:visible absolute z-50 w-64 p-3 
                        bg-white dark:bg-gray-800 shadow-xl rounded-lg border dark:border-gray-700 text-sm
                        ${i % 7 >= 5 ? 'right-0' : 'left-0'} 
                        ${Math.floor(i / 7) >= 4 ? 'bottom-full mb-2' : 'top-full mt-2'}`}
                      >
                        <div className="font-semibold text-gray-900 dark:text-white mb-1">{event.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {event.startTime} - {event.endTime}
                        </div>
                        {event.description && (
                          <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                            {event.description}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Show "+X more" indicator if there are more events than we're showing */}
                  {isCurrentMonth && getEventsForDate(day).length > (isMobile ? 1 : 3) && (
                    <div className="text-2xs text-center text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 py-0.5 rounded">
                      +{getEventsForDate(day).length - (isMobile ? 1 : 3)} more
                    </div>
                  )}
                </div>
                
                {/* Event & Holiday Indicators - removed Sunday dot */}
                {isCurrentMonth && (isHolidayDate) && (
                  <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                    {isHolidayDate && !dayIsSunday && (
                      <div className="w-1 h-1 rounded-full bg-red-500"></div>
                    )}
                  </div>
                )}
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
                      
                      {/* Event indicator */}
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
    if (selectedEvent) {
      // Update existing event
      setEvents(prev => prev.map(event => 
        event.id === selectedEvent.id ? { ...eventData, id: event.id } : event
      ));
    } else {
      // Add new event
      const newEvent = {
        ...eventData,
        id: Date.now().toString(),
        reminderShown: false
      };
      
      // Handle recurring events
      if (eventData.recurring) {
        const recurringEvents = generateRecurringEvents(newEvent);
        setEvents(prev => [...prev, ...recurringEvents]);
      } else {
        setEvents(prev => [...prev, newEvent]);
      }
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

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 dark:bg-gray-900">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50 text-xs sm:text-sm">
          {toast}
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
        {/* Header */}
        <div className="py-2 px-2 sm:p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center space-x-1">
                <button onClick={prevPeriod} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button onClick={nextPeriod} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                {getHeaderText()}
              </h2>
              <button
                ref={yearDetailsButtonRef}
                className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800 transition-colors text-green-700 dark:text-green-300"
                title="Show Year Details"
                onClick={() => setShowYearDetailsModal(true)}
              >
                <CheckCircle size={isMobile ? 16 : 18} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowAllEventsModal(true)} 
                className="bg-purple-600 text-white px-3 py-1.5 text-xs sm:text-sm rounded-md hover:bg-purple-700 transition flex items-center"
                title="View all events"
              >
                <ListFilter className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">All Events</span>
              </button>
              <button 
                onClick={goToToday} 
                className="bg-blue-600 text-white px-3 py-1.5 text-xs sm:text-sm rounded-md hover:bg-blue-700 transition flex items-center"
              >
                Today
              </button>
              <div className="border rounded-md overflow-hidden flex dark:border-gray-700">
                <button 
                  onClick={() => setView('day')} 
                  className={`text-xs px-3 py-1.5 ${view === 'day' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  Day
                </button>
                <button 
                  onClick={() => setView('week')} 
                  className={`text-xs px-3 py-1.5 border-l dark:border-gray-700 ${view === 'week' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  Week
                </button>
                <button 
                  onClick={() => setView('month')} 
                  className={`text-xs px-3 py-1.5 border-l dark:border-gray-700 ${view === 'month' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  Month
                </button>
                <button 
                  onClick={() => setView('year')} 
                  className={`text-xs px-3 py-1.5 border-l dark:border-gray-700 ${view === 'year' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  Year
                </button>
              </div>
            </div>
          </div>
          {/* Bottom row: Current date and time display */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 gap-1">
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="flex flex-col">
                <span className="font-medium">Today: {format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
                <span className="text-2xs opacity-75">Selected: {format(currentDate, 'MMMM d, yyyy')}</span>
              </div>
            </div>
            <div className="flex items-center mt-1 sm:mt-0">
              <div className="bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-blue-700 dark:text-blue-300 font-mono">{format(currentTime, 'HH:mm:ss')}</span>
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
        
        {/* Floating Action Button */}
        <button 
          onClick={() => handleDateClick(currentDate)}
          className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-20 safe-area-inset-bottom text-xl"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          onClose={() => setShowEventModal(false)}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          categories={categories}
          existingEvents={selectedDate ? getEventsForDate(selectedDate) : []}
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
    </div>
  );
};

export default Calendar;