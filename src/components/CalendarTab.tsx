import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  MapPin, 
  Clock, 
  Eye, 
  Lock, 
  Trash2, 
  Pencil, 
  ChevronLeft, 
  ChevronRight, 
  Tag, 
  Briefcase, 
  GraduationCap, 
  UserCheck, 
  Sparkles, 
  X,
  Bell,
  BellRing,
  BellOff,
  Mail,
  Send,
  Check
} from 'lucide-react';
import { CalendarEvent } from '../types';

interface CalendarTabProps {
  events: CalendarEvent[];
  userEmail?: string;
  onAddEvent: (evt: Omit<CalendarEvent, 'id'>) => void;
  onUpdateEvent: (evt: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
}

export default function CalendarTab({
  events,
  userEmail,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent
}: CalendarTabProps) {
  // Current viewed month and year
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)); // Default June 2026
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-06-22'); // Match default interview date
  
  // Active Event Type filter
  const [filterType, setFilterType] = useState<string>('all');
  
  // Show Add/Edit state
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Form local fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'interview' | 'class' | 'work' | 'other'>('interview');
  const [dateVal, setDateVal] = useState('2026-06-22');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:30');
  const [location, setLocation] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState<number>(15);
  const [sendGmail, setSendGmail] = useState<boolean>(true);
  const [gmailAddress, setGmailAddress] = useState<string>(userEmail || 'ramachandramurthymamidipalli1@gmail.com');

  // Notification Enable/Disable State
  const [notifEnabled, setNotifEnabled] = useState<boolean>(true);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const toggleNotifications = async () => {
    if (notifEnabled) {
      setNotifEnabled(false);
    } else {
      if ('Notification' in window && Notification.permission !== 'granted') {
        try {
          const perm = await Notification.requestPermission();
          setNotifPermission(perm);
          if (perm === 'granted') {
            setNotifEnabled(true);
          } else {
            alert('Notification permission was denied. Please allow notifications in browser settings.');
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setNotifEnabled(true);
      }
    }
  };

  // Helper to open Gmail web compose prefilled with event details
  const sendGmailReminder = (evt: CalendarEvent, targetAddr?: string) => {
    const emailTo = targetAddr || evt.gmailAddress || gmailAddress || userEmail || 'ramachandramurthymamidipalli1@gmail.com';
    const subject = encodeURIComponent(`📅 Calendar Reminder: ${evt.title}`);
    const bodyText = encodeURIComponent(
      `Hello Ramachandra,\n\nHere is your scheduled event notification from MyDocVault Calendar:\n\n` +
      `📌 Event: ${evt.title}\n` +
      `📂 Type: ${evt.type.toUpperCase()}\n` +
      `📅 Date: ${evt.date}\n` +
      `⏰ Time: ${evt.startTime || '00:00'} - ${evt.endTime || '23:59'}\n` +
      `📍 Location / Link: ${evt.location || 'N/A'}\n` +
      `📝 Description: ${evt.description || 'N/A'}\n\n` +
      `Sent via MyDocVault Personal Calendar Reminders.`
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${emailTo}&su=${subject}&body=${bodyText}`;
    window.open(gmailUrl, '_blank');
  };

  // Live timer check for upcoming event notifications
  useEffect(() => {
    if (!notifEnabled || notifPermission !== 'granted') return;

    const notifiedEvents = new Set<string>();

    const checkInterval = setInterval(() => {
      const now = new Date();

      events.forEach(evt => {
        if (!evt.startTime || !evt.date) return;
        try {
          const [h, m] = evt.startTime.split(':').map(Number);
          const eventDate = new Date(`${evt.date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
          const diffMins = Math.floor((eventDate.getTime() - now.getTime()) / 60000);
          const targetReminderMins = evt.reminderMinutes ?? 15;

          if (diffMins >= 0 && diffMins <= targetReminderMins && !notifiedEvents.has(`${evt.id}-${targetReminderMins}`)) {
            notifiedEvents.add(`${evt.id}-${targetReminderMins}`);
            
            // Trigger desktop notification
            new Notification(`🔔 Reminder: ${evt.title}`, {
              body: diffMins === 0 
                ? `Starting right now (${evt.startTime})${evt.location ? ` at ${evt.location}` : ''}`
                : `Starting in ${diffMins} minute${diffMins > 1 ? 's' : ''} (${evt.startTime})${evt.location ? ` at ${evt.location}` : ''}`,
              tag: evt.id
            });

            // If sendGmail is enabled for this event, offer Gmail alert
            if (evt.sendGmail) {
              sendGmailReminder(evt);
            }
          }
        } catch (e) {
          // invalid date parsing ignore
        }
      });
    }, 20000); // Check every 20s

    return () => clearInterval(checkInterval);
  }, [events, notifEnabled, notifPermission]);

  const viewYear = currentDate.getFullYear();
  const viewMonth = currentDate.getMonth(); // 0-indexed

  // Month information
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Handle month browsing
  const prevMonth = () => {
    setCurrentDate(new Date(viewYear, viewMonth - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(viewYear, viewMonth + 1, 1));
  };

  // Setup form states when editing
  const handleStartEdit = (evt: CalendarEvent) => {
    setEditingEvent(evt);
    setTitle(evt.title);
    setDescription(evt.description || '');
    setType(evt.type);
    setDateVal(evt.date);
    setStartTime(evt.startTime || '');
    setEndTime(evt.endTime || '');
    setLocation(evt.location || '');
    setIsPublic(evt.isPublic !== false);
    setReminderMinutes(evt.reminderMinutes ?? 15);
    setSendGmail(evt.sendGmail !== false);
    setGmailAddress(evt.gmailAddress || userEmail || 'ramachandramurthymamidipalli1@gmail.com');
    setShowForm(true);
  };

  const handleStartAdd = (preselectedDate?: string) => {
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setType('interview');
    setDateVal(preselectedDate || selectedDateStr);
    setStartTime('10:00');
    setEndTime('11:30');
    setLocation('');
    setIsPublic(true);
    setReminderMinutes(15);
    setSendGmail(true);
    setGmailAddress(userEmail || 'ramachandramurthymamidipalli1@gmail.com');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dateVal) return;

    const payload: CalendarEvent = {
      id: editingEvent ? editingEvent.id : `evt-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      date: dateVal,
      startTime: startTime.trim() || undefined,
      endTime: endTime.trim() || undefined,
      location: location.trim() || undefined,
      isPublic,
      reminderMinutes,
      sendGmail,
      gmailAddress: sendGmail ? (gmailAddress.trim() || userEmail || 'ramachandramurthymamidipalli1@gmail.com') : undefined
    };

    if (editingEvent) {
      onUpdateEvent(payload);
    } else {
      const { id, ...newEvtData } = payload;
      onAddEvent(newEvtData);
    }

    // If user asked to send Gmail notification on creation, launch Gmail Compose
    if (sendGmail) {
      sendGmailReminder(payload, gmailAddress);
    }

    // Reset
    setShowForm(false);
    setEditingEvent(null);
    setTitle('');
    setDescription('');
  };

  // Helper to format/match date strings "YYYY-MM-DD"
  const formatDateString = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Filter events based on filterType
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      if (filterType === 'all') return true;
      return evt.type === filterType;
    });
  }, [events, filterType]);

  // Group events by date for easy visualization indicators
  const eventsByDate = useMemo(() => {
    const groups: { [date: string]: CalendarEvent[] } = {};
    filteredEvents.forEach(evt => {
      if (!groups[evt.date]) {
        groups[evt.date] = [];
      }
      groups[evt.date].push(evt);
    });
    return groups;
  }, [filteredEvents]);

  // Selected date's events
  const selectedDateEvents = useMemo(() => {
    return events.filter(evt => evt.date === selectedDateStr);
  }, [events, selectedDateStr]);

  // Render correct color presets based on schedule type
  const getTypeBadgeStyles = (type: 'interview' | 'class' | 'work' | 'other') => {
    switch(type) {
      case 'interview':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'class':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'work':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'other':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };

  const getTypeIcon = (type: 'interview' | 'class' | 'work' | 'other', sizeClass = "w-4 h-4") => {
    switch(type) {
      case 'interview':
        return <UserCheck className={`${sizeClass} text-amber-400`} />;
      case 'class':
        return <GraduationCap className={`${sizeClass} text-blue-400`} />;
      case 'work':
        return <Briefcase className={`${sizeClass} text-emerald-400`} />;
      case 'other':
        return <Tag className={`${sizeClass} text-purple-400`} />;
    }
  };

  return (
    <div className="space-y-6" id="calendar-workspace">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            Schedule & Smart Calendar
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Organize core interviews scheduling, classes, work timelines, and custom milestones.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Explicit Enable / Disable Notifications Toggle Button */}
          <button
            onClick={toggleNotifications}
            title={notifEnabled ? 'Click to Disable Notifications' : 'Click to Enable Notifications'}
            className={`font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shrink-0 border ${
              notifEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-red-500/10 text-rose-400 border-red-500/30 hover:bg-red-500/20'
            }`}
          >
            {notifEnabled ? (
              <>
                <BellRing className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Disable Notifications</span>
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4 text-rose-400" />
                <span>Enable Notifications</span>
              </>
            )}
          </button>

          {/* Quick Gmail Alert trigger */}
          <button
            onClick={() => {
              if (events.length > 0) {
                sendGmailReminder(events[0]);
              } else {
                alert('No scheduled events available to compose Gmail reminder.');
              }
            }}
            title="Open Gmail compose with reminder"
            className="bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-rose-400 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shrink-0"
          >
            <Mail className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Gmail Alert</span>
          </button>

          <button
            onClick={() => handleStartAdd()}
            className="bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Main Filter and Metric Bar */}
      <div className="bg-[#0b0c10]/40 border border-slate-850 p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition border cursor-pointer ${
              filterType === 'all' 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                : 'bg-slate-950/60 text-gray-400 border-slate-850 hover:text-white'
            }`}
          >
            All Scheduled ({events.length})
          </button>
          <button
            onClick={() => setFilterType('interview')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition border flex items-center gap-1.5 cursor-pointer ${
              filterType === 'interview' 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                : 'bg-slate-950/60 text-gray-400 border-slate-850 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            Interviews ({events.filter(e => e.type === 'interview').length})
          </button>
          <button
            onClick={() => setFilterType('class')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition border flex items-center gap-1.5 cursor-pointer ${
              filterType === 'class' 
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                : 'bg-slate-950/60 text-gray-400 border-slate-850 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
            Classes ({events.filter(e => e.type === 'class').length})
          </button>
          <button
            onClick={() => setFilterType('work')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition border flex items-center gap-1.5 cursor-pointer ${
              filterType === 'work' 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                : 'bg-slate-950/60 text-gray-400 border-slate-850 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
            Work ({events.filter(e => e.type === 'work').length})
          </button>
          <button
            onClick={() => setFilterType('other')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition border flex items-center gap-1.5 cursor-pointer ${
              filterType === 'other' 
                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
                : 'bg-slate-950/60 text-gray-400 border-slate-850 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-purple-400" />
            Other ({events.filter(e => e.type === 'other').length})
          </button>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-gray-400 font-mono">
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Public: {events.filter(e => e.isPublic !== false).length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>Private: {events.filter(e => e.isPublic === false).length}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Calendar Grid & Day Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Calendar Grid Selector (8/12) */}
        <div className="lg:col-span-7 bg-[#0b0c10]/60 border border-slate-850 rounded-2xl p-6 space-y-4">
          
          {/* Month Header Controller */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-850">
            <button 
              onClick={prevMonth}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-white text-base">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button 
              onClick={nextMonth}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Month Days */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty placeholders before first day */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square bg-transparent rounded-xl" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, dIdx) => {
              const day = dIdx + 1;
              const cellDateStr = formatDateString(viewYear, viewMonth, day);
              const isSelected = selectedDateStr === cellDateStr;
              const hasEvents = eventsByDate[cellDateStr] && eventsByDate[cellDateStr].length > 0;
              const dayEvents = eventsByDate[cellDateStr] || [];

              // Calculate custom style helper colors based on main event types on that day
              let ringColorClass = '';
              if (hasEvents) {
                const types = dayEvents.map(e => e.type);
                if (types.includes('interview')) {
                  ringColorClass = 'border border-amber-500/40';
                } else if (types.includes('work')) {
                  ringColorClass = 'border border-emerald-500/40';
                } else if (types.includes('class')) {
                  ringColorClass = 'border border-blue-500/40';
                } else {
                  ringColorClass = 'border border-purple-500/40';
                }
              }

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedDateStr(cellDateStr)}
                  className={`aspect-square flex flex-col justify-between p-1.5 rounded-xl text-left border relative transition group cursor-pointer ${
                    isSelected 
                      ? 'bg-emerald-500/10 border-emerald-400 text-white' 
                      : hasEvents 
                        ? 'bg-[#12141c]/80 border-slate-800 hover:border-slate-700 text-gray-100' 
                        : 'bg-[#0b0c10]/40 border-transparent hover:border-slate-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <span className={`text-[10px] font-mono leading-none ${
                    isSelected ? 'text-emerald-400 font-extrabold' : 'group-hover:text-emerald-400'
                  }`}>
                    {day}
                  </span>

                  {/* Little indicators for event counts */}
                  {hasEvents && (
                    <div className="flex gap-1 overflow-x-hidden pt-1 max-w-full">
                      {dayEvents.slice(0, 3).map((evt, i) => (
                        <span 
                          key={evt.id || i} 
                          title={evt.title}
                          className={`w-1.5 h-1.5 rounded-full block shrink-0 ${
                            evt.type === 'interview' 
                              ? 'bg-amber-400' 
                              : evt.type === 'class' 
                                ? 'bg-blue-400' 
                                : evt.type === 'work' 
                                  ? 'bg-emerald-400' 
                                  : 'bg-purple-400'
                          }`}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[7px] text-gray-400 leading-none font-sans font-semibold">+</span>
                      )}
                    </div>
                  )}

                  {/* Tiny ring hover identifier */}
                  {hasEvents && !isSelected && (
                    <div className={`absolute inset-0 rounded-xl pointer-events-none ${ringColorClass}`} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-850 text-xs">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              Selected: <strong className="text-white font-mono text-[11px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">{selectedDateStr}</strong>
            </span>
            <button
              onClick={() => handleStartAdd(selectedDateStr)}
              className="text-emerald-400 hover:text-emerald-300 font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add event here
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Targeted Date Detailed Schedule View (5/12) */}
        <div className="lg:col-span-5 bg-[#0b0c10]/60 border border-slate-850 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase tracking-wider font-mono text-gray-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                Schedule for {selectedDateStr}
              </h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'event' : 'events'}
              </span>
            </div>

            {selectedDateEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-850 rounded-xl space-y-2.5">
                <Calendar className="w-8 h-8 text-slate-700" />
                <div>
                  <p className="text-xs font-bold text-gray-300">Quiet Day! No events scheduled</p>
                  <p className="text-[10px] text-gray-500 mt-1">Add tasks, interviews, work shifts or classes for this day.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartAdd(selectedDateStr)}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-emerald-400 font-bold px-3 py-1.5 rounded-lg text-xs mt-2 transition cursor-pointer"
                >
                  Schedule Event
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {selectedDateEvents.map(evt => (
                  <div 
                    key={evt.id} 
                    className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 space-y-3 relative group"
                  >
                    {/* Event Type / Header */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(evt.type)}
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${getTypeBadgeStyles(evt.type)}`}>
                          {evt.type}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[7px] font-mono uppercase font-bold border ${
                          evt.isPublic !== false 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' 
                            : 'bg-red-500/10 text-rose-400 border-red-500/10'
                        }`}>
                          {evt.isPublic !== false ? 'Public' : 'Private'}
                        </span>
                      </div>

                      {/* Hover action bar */}
                      <div className="opacity-0 group-hover:opacity-100 transition duration-150 absolute top-3 right-3 flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-850">
                        <button
                          onClick={() => handleStartEdit(evt)}
                          className="p-1 hover:text-emerald-400 text-gray-400 transition"
                          title="Edit Event"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteEvent(evt.id)}
                          className="p-1 hover:text-rose-400 text-gray-400 transition"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Desc */}
                    <div className="space-y-1">
                      <h4 className="text-white font-bold text-sm leading-tight pr-[50px]">{evt.title}</h4>
                      {evt.description && (
                        <p className="text-gray-400 text-[11px] leading-relaxed font-sans">{evt.description}</p>
                      )}
                    </div>

                    {/* Time & Location */}
                    <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500 font-mono">
                      {(evt.startTime || evt.endTime) && (
                        <div className="flex items-center gap-1 text-gray-400">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          <span>
                            {evt.startTime || '00:00'} - {evt.endTime || '23:59'}
                          </span>
                        </div>
                      )}
                      {evt.location && (
                        <div className="flex items-center gap-1 text-gray-400 max-w-[200px] truncate" title={evt.location}>
                          <MapPin className="w-3.5 h-3.5 text-gray-500" />
                          <span>{evt.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-amber-400 font-mono text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        <Bell className="w-3 h-3 text-amber-400" />
                        <span>{evt.reminderMinutes === 0 ? 'Remind at start' : `Remind ${evt.reminderMinutes ?? 15}m before`}</span>
                      </div>
                    </div>

                    {/* Quick Gmail Send Action */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-850/60 mt-1">
                      <button
                        type="button"
                        onClick={() => sendGmailReminder(evt)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-rose-400 font-bold rounded-lg text-[10px] transition cursor-pointer"
                        title="Open Gmail compose window with pre-filled event details"
                      >
                        <Mail className="w-3.5 h-3.5 text-rose-400" />
                        <span>Send Gmail Reminder</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-850 bg-slate-950/20 p-4 rounded-xl space-y-2">
            <span className="text-[10px] text-emerald-400/90 font-mono tracking-widest uppercase flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 animate-pulse text-emerald-400" /> Help Tip
            </span>
            <p className="text-gray-400 text-[10px] leading-relaxed">
              Public events automatically appear in your live sharing portfolio directory. Use private mode for internal calendars and sensitive preparation time blocks.
            </p>
          </div>

        </div>

      </div>

      {/* MODAL LIGHT DIALOG FOR ADDING & EDITING EVENTS */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-[#0b0c10] border border-slate-850 rounded-2xl w-full max-w-md p-4 md:p-5 shadow-2xl relative max-h-[88vh] overflow-y-auto">
            <button 
              onClick={() => {
                setShowForm(false);
                setEditingEvent(null);
              }}
              className="absolute top-4 right-4 text-gray-450 hover:text-white transition p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-white font-extrabold text-base mb-1 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              {editingEvent ? 'Modify Scheduled Event' : 'Schedule New Event'}
            </h3>
            <p className="text-xs text-gray-400 mb-5">
              Confirm key event metrics, timing alignment, and display visibility credentials.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Event Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-gray-400 uppercase">Event Title / Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Meta Senior Technical Interview"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs md:text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Event Category & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-gray-400 uppercase">Event Category</label>
                  <select 
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs md:text-sm focus:border-emerald-500 outline-none"
                  >
                    <option value="interview">Interview Scheduling</option>
                    <option value="class">Class / Seminar</option>
                    <option value="work">Work Shift / Sprint</option>
                    <option value="other">Other Activity</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-gray-400 uppercase">Target Date</label>
                  <input 
                    type="date" 
                    required
                    value={dateVal}
                    onChange={e => setDateVal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs md:text-sm focus:border-emerald-500 outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Timing constraints */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-gray-400 uppercase">Start Time</label>
                  <input 
                    type="time" 
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs md:text-sm focus:border-emerald-500 outline-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-gray-400 uppercase">End Time</label>
                  <input 
                    type="time" 
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs md:text-sm focus:border-emerald-500 outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Location credentials */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-gray-400 uppercase">Venue / Online Link</label>
                <input 
                  type="text" 
                  placeholder="e.g. Zoom Conference, MS Teams, Room 402"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs md:text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Event Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-gray-400 uppercase">Detailed Description</label>
                <textarea 
                  placeholder="Review agenda items, key talking points, syllabus or preparation criteria."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              {/* Event Reminder Notification Time */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-gray-400 uppercase flex items-center gap-1.5">
                  <Bell className="w-3 h-3 text-amber-400" />
                  <span>Reminder Notification Trigger</span>
                </label>
                <select
                  value={reminderMinutes}
                  onChange={e => setReminderMinutes(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white text-xs md:text-sm focus:border-emerald-500 outline-none"
                >
                  <option value={0}>At event start time</option>
                  <option value={5}>5 minutes before</option>
                  <option value={10}>10 minutes before</option>
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                  <option value={60}>1 hour before</option>
                </select>
              </div>

              {/* Gmail Email Alert Configuration */}
              <div className="space-y-2 p-3 bg-slate-950 border border-slate-850 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-bold text-gray-300 uppercase flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-rose-400" />
                    <span>Send Reminder via Gmail</span>
                  </label>
                  <input
                    type="checkbox"
                    id="sendGmailCheck"
                    checked={sendGmail}
                    onChange={e => setSendGmail(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 border-slate-800 bg-slate-900 cursor-pointer"
                  />
                </div>

                {sendGmail && (
                  <div className="space-y-1 pt-1">
                    <label className="text-[9px] font-mono text-gray-400 uppercase">Target Gmail Address</label>
                    <input
                      type="email"
                      value={gmailAddress}
                      onChange={e => setGmailAddress(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:border-rose-500 outline-none font-mono"
                    />
                    <p className="text-[9px] text-gray-500">
                      When enabled, saving or triggering this event opens a pre-filled Gmail compose draft ready to send.
                    </p>
                  </div>
                )}
              </div>

              {/* Visibility parameters */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-gray-400 uppercase">Portfolio Visibility</label>
                <div className="flex gap-4 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      isPublic 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : 'bg-slate-950 text-gray-500 border-slate-850 hover:text-white'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Public (Visible in public portfolio)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      !isPublic 
                        ? 'bg-red-500/10 text-rose-400 border-red-500/20' 
                        : 'bg-slate-950 text-gray-500 border-slate-850 hover:text-white'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>Private (Hidden from public portfolio)</span>
                  </button>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2 text-xs font-bold pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingEvent(null);
                  }}
                  className="bg-slate-950 border border-slate-850 text-gray-400 hover:text-white px-4 py-2 rounded-xl hover:bg-slate-900 transition cursor-pointer"
                >
                  Discard Changes
                </button>
                <button 
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  {editingEvent ? 'Update Event' : 'Schedule Event'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
