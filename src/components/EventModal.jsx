import React, { useState, useEffect, useRef } from 'react';
import { format, addMinutes } from 'date-fns';

const EventModal = ({ 
  date, 
  event, 
  timeSlot,
  onClose, 
  
  onSave, 
  onDelete,
  categories,
  existingEvents = [] 
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState('default');
  const [color, setColor] = useState('blue');
  const [reminder, setReminder] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [recurring, setRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState('daily');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [theme, setTheme] = useState('system');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('medium');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [colorPalette, setColorPalette] = useState(false);
  
  // References
  const titleRef = useRef(null);
  const formRef = useRef(null);

  // Form validation
  const [errors, setErrors] = useState({});
  const [formChanged, setFormChanged] = useState(false);
  
  // Animation state
  const [isClosing, setIsClosing] = useState(false);

  // Initialize form with event data if editing
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setStartTime(event.startTime || '09:00');
      setEndTime(event.endTime || '10:00');
      setCategory(event.category || 'default');
      setColor(event.color || 'blue');
      setReminder(event.reminder || false);
      setReminderMinutes(event.reminderMinutes || 15);
      setRecurring(event.recurring || false);
      setRecurringType(event.recurringType || 'daily');
      setRecurringEndDate(event.recurringEndDate || '');
      setTheme(event.theme || 'system');
      setLocation(event.location || '');
      setNotes(event.notes || '');
      setPriority(event.priority || 'medium');
    } else if (timeSlot) {
      setStartTime(timeSlot);
      // Set end time to 1 hour after start time
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const startDateTime = new Date();
      startDateTime.setHours(hours, minutes, 0, 0);
      const endDateTime = addMinutes(startDateTime, 60);
      setEndTime(format(endDateTime, 'HH:mm'));
    } else {
      // Default to current time if no time slot specified
      const now = new Date();
      setStartTime(format(now, 'HH:mm'));
      setEndTime(format(addMinutes(now, 60), 'HH:mm'));
    }
    
    // Focus on title field when modal opens
    if (titleRef.current) {
      setTimeout(() => titleRef.current.focus(), 100);
    }
    
    // Add event listener for escape key
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [event, timeSlot]);
  
  // Handle draft auto-save
  useEffect(() => {
    if (formChanged && !event) {
      const draftTimeout = setTimeout(() => {
        localStorage.setItem('eventDraft', JSON.stringify({
          title,
          description,
          startTime,
          endTime,
          category,
          color,
          reminder,
          reminderMinutes,
          recurring,
          recurringType,
          recurringEndDate,
          theme,
          location,
          notes,
          priority,
          lastUpdated: new Date().toISOString()
        }));
      }, 2000);
      
      return () => clearTimeout(draftTimeout);
    }
  }, [
    title, description, startTime, endTime, category, color, 
    reminder, reminderMinutes, recurring, recurringType, 
    recurringEndDate, theme, location, notes, priority, formChanged
  ]);

  // Check for conflicts
  const checkTimeConflicts = () => {
    if (!date) return [];
    
    const newStart = startTimeToMinutes(startTime);
    const newEnd = startTimeToMinutes(endTime);
    
    return existingEvents.filter(existingEvent => {
      if (event && existingEvent.id === event.id) return false; // Skip current event when editing
      
      const eventStart = startTimeToMinutes(existingEvent.startTime);
      const eventEnd = startTimeToMinutes(existingEvent.endTime);
      
      // Check if the time ranges overlap
      return (
        (newStart >= eventStart && newStart < eventEnd) || // New event starts during existing event
        (newEnd > eventStart && newEnd <= eventEnd) || // New event ends during existing event
        (newStart <= eventStart && newEnd >= eventEnd) // New event spans the entire existing event
      );
    });
  };
  
  const startTimeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Detect conflicts in real-time
  const conflicts = checkTimeConflicts();

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormChanged(false);

    // Form validation
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';

    // Allow past times - do NOT block events in the past
    const startMinutes = startTimeToMinutes(startTime);
    const endMinutes = startTimeToMinutes(endTime);

    if (startMinutes >= endMinutes) {
      newErrors.time = 'End time must be after start time';
    }

    // Prevent adding events that end in the past
    const eventDateStr = format(date, 'yyyy-MM-dd');
    const now = new Date();
    const eventEnd = new Date(`${eventDateStr}T${endTime}`);
    if (!event || !event.id) { // Only for new events, not editing
      if (eventEnd < now) {
        newErrors.time = 'Cannot add events that end in the past';
      }
    }

    if (recurring && !recurringEndDate) newErrors.recurringEndDate = 'End date is required for recurring events';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Clear any previous errors
    setErrors({});
    
    // Clear the draft if exists
    localStorage.removeItem('eventDraft');
    
    onSave({
      title,
      description,
      date: format(date, 'yyyy-MM-dd'),
      startTime,
      endTime,
      category,
      color,
      theme,
      reminder,
      reminderMinutes: reminder ? reminderMinutes : null,
      recurring,
      recurringType: recurring ? recurringType : null,
      recurringEndDate: recurring ? recurringEndDate : null,
      location,
      notes,
      priority
    });
    
    handleClose();
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(event.id);
    } else {
      setShowDeleteConfirm(true);
    }
  };
  
  const handleClose = () => {
    if (formChanged) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        setIsClosing(true);
        setTimeout(() => onClose(), 300);
      }
    } else {
      setIsClosing(true);
      setTimeout(() => onClose(), 300);
    }
  };
  
  const handleFormChange = () => {
    if (!formChanged) setFormChanged(true);
  };
  
  const reminderOptions = [
    { label: '5 minutes before', value: 5 },
    { label: '15 minutes before', value: 15 },
    { label: '30 minutes before', value: 30 },
    { label: '1 hour before', value: 60 },
    { label: '2 hours before', value: 120 },
    { label: '1 day before', value: 1440 },
  ];

  const recurringOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ];

  const themeOptions = [
    { label: 'System', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ];
  
  const priorityOptions = [
    { label: 'Low', value: 'low', color: 'blue' },
    { label: 'Medium', value: 'medium', color: 'yellow' },
    { label: 'High', value: 'high', color: 'red' },
  ];

  const colorOptions = [
    'blue', 'green', 'red', 'purple', 'yellow', 'indigo', 'pink', 'gray'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 overflow-auto transition-opacity duration-300">
      <div 
        className={`bg-white dark:bg-gray-800 rounded-t-lg sm:rounded-lg shadow-xl w-full max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-hidden mt-8 sm:mt-0 transform transition-transform duration-300 ${
          isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 px-4 sm:px-6 py-3 sm:py-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold dark:text-gray-100">
            {event ? 'Edit Event' : 'New Event'}
          </h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white p-1"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form 
          ref={formRef}
          onSubmit={handleSubmit} 
          onChange={handleFormChange}
          className="overflow-y-auto p-4 sm:p-6 space-y-4"
          style={{ maxHeight: 'calc(90vh - 60px)' }}
        >
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {date ? format(date, 'EEEE, MMMM d, yyyy') : ''}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-1" htmlFor="title">
                Title*
              </label>
              <input
                ref={titleRef}
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`shadow appearance-none border ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Add title"
                required
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-1" htmlFor="startTime">
                  Start Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    id="startTime"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      // Auto-adjust end time to be 1 hour after start time
                      const [hours, minutes] = e.target.value.split(':').map(Number);
                      const startDateTime = new Date();
                      startDateTime.setHours(hours, minutes, 0, 0);
                      const endDateTime = addMinutes(startDateTime, 60);
                      setEndTime(format(endDateTime, 'HH:mm'));
                    }}
                    className={`shadow appearance-none border ${errors.time ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-1" htmlFor="endTime">
                  End Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    id="endTime"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={`shadow appearance-none border ${errors.time ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              {errors.time && (
                <div className="col-span-2">
                  <p className="text-red-500 text-xs mt-1">{errors.time}</p>
                </div>
              )}
            </div>
            
            {conflicts.length > 0 && (
              <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <p className="text-yellow-800 dark:text-yellow-200 text-xs flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-medium">Time conflicts with {conflicts.length} other {conflicts.length === 1 ? 'event' : 'events'}:</span>
                </p>
                <ul className="mt-1 ml-5 list-disc text-xs text-yellow-700 dark:text-yellow-300">
                  {conflicts.slice(0, 2).map((conflict, idx) => (
                    <li key={idx}>
                      {conflict.title} ({conflict.startTime} - {conflict.endTime})
                    </li>
                  ))}
                  {conflicts.length > 2 && (
                    <li>...and {conflicts.length - 2} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-1" htmlFor="location">
                Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 pr-3 py-2.5 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100"
                  placeholder="Add location (optional)"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Remove Category selection */}
              {/* <div>
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-1" htmlFor="category">
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    const selectedCategory = categories.find(c => c.value === e.target.value);
                    if (selectedCategory) {
                      setColor(selectedCategory.color);
                    }
                  }}
                  className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div> */}
              <div className="col-span-2">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-1">
                  Priority
                </label>
                <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  {priorityOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPriority(option.value)}
                      className={`flex-1 py-2.5 text-xs ${
                        priority === option.value 
                          ? `bg-${option.color}-100 dark:bg-${option.color}-900/30 text-${option.color}-800 dark:text-${option.color}-200 font-medium border-b-2 border-${option.color}-500`
                          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-1">
                Color
              </label>
              <div className="flex flex-wrap gap-2.5">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    onClick={() => setColor(colorOption)}
                    className={`w-8 h-8 rounded-full bg-${colorOption}-500 cursor-pointer transition-all ${
                      color === colorOption 
                        ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                        : 'hover:scale-105'
                    }`}
                    title={colorOption.charAt(0).toUpperCase() + colorOption.slice(1)}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setColorPalette(!colorPalette)}
                  className="w-8 h-8 rounded-full border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="More colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-1" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add description (optional)"
                rows="3"
              />
            </div>
            
            {/* Collapsible Advanced Options */}
            <div className="mb-2">
              <button 
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 mr-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Advanced Options
              </button>
            </div>

            {showAdvanced && (
              <div className="space-y-4 pt-2 pb-1 border-t dark:border-gray-700 animate-fadeIn">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reminder}
                        onChange={(e) => setReminder(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 block text-gray-700 dark:text-gray-200 text-sm font-bold">
                        Set reminder
                      </span>
                    </label>
                  </div>
                  
                  {reminder && (
                    <div className="mt-2 pl-6">
                      <select
                        value={reminderMinutes}
                        onChange={(e) => setReminderMinutes(Number(e.target.value))}
                        className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {reminderOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={recurring}
                        onChange={(e) => setRecurring(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 block text-gray-700 dark:text-gray-200 text-sm font-bold">
                        Recurring event
                      </span>
                    </label>
                  </div>
                  
                  {recurring && (
                    <div className="mt-2 pl-6 space-y-2">
                      <div>
                        <label className="block text-gray-700 dark:text-gray-200 text-sm mb-1" htmlFor="recurringType">
                          Repeat
                        </label>
                        <select
                          id="recurringType"
                          value={recurringType}
                          onChange={(e) => setRecurringType(e.target.value)}
                          className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {recurringOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 dark:text-gray-200 text-sm mb-1" htmlFor="recurringEndDate">
                          End date*
                        </label>
                        <input
                          type="date"
                          id="recurringEndDate"
                          value={recurringEndDate}
                          onChange={(e) => setRecurringEndDate(e.target.value)}
                          min={format(date, 'yyyy-MM-dd')}
                          className={`shadow appearance-none border ${errors.recurringEndDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        {errors.recurringEndDate && (
                          <p className="text-red-500 text-xs mt-1">{errors.recurringEndDate}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-1" htmlFor="notes">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes or details (optional)"
                    rows="2"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t dark:border-gray-700">
            {event ? (
              <button
                type="button"
                onClick={handleDelete}
                className={`px-3 sm:px-4 py-2.5 rounded-md ${
                  showDeleteConfirm 
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
              >
                {showDeleteConfirm ? 'Confirm' : 'Delete'}
              </button>
            ) : (
              <div></div>
            )}
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-3 sm:px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 sm:px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {event ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
