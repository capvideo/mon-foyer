import { useEffect, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Download, ExternalLink, Link, Check } from 'lucide-react';
import { api } from '../utils/api';
import { Event, Member, MEMBERS, formatDate } from '../types';
import { MonthGrid } from '../components/agenda/MonthGrid';
import { EventForm } from '../components/agenda/EventForm';
import { MemberAvatar } from '../components/common/MemberAvatar';

interface Props { currentMember: Member }

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export function AgendaPage({ currentMember }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based, auto-updates to current month
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [defaultDate, setDefaultDate] = useState('');
  const [filterMember, setFilterMember] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const load = async () => {
    const params: Record<string, string> = { month: monthStr };
    if (filterMember) params.memberId = filterMember;
    const evs = await api.getEvents(params);
    setEvents(evs);
  };

  useEffect(() => { load(); }, [month, year, filterMember]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleSave = async (data: any) => {
    if (editEvent) {
      await api.updateEvent(editEvent.id, data);
    } else {
      await api.createEvent(data);
    }
    setEditEvent(null);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cet événement ?')) {
      await api.deleteEvent(id);
      load();
    }
  };

  const selectedDayEvents = selectedDay ? events.filter(e => e.date === selectedDay) : [];
  const upcomingEvents = events
    .filter(e => e.date >= new Date().toISOString().split('T')[0])
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Agenda</h2>
        <button
          onClick={() => { setEditEvent(null); setDefaultDate(''); setShowForm(true); }}
          className="w-9 h-9 bg-foyer-500 text-white rounded-full flex items-center justify-center"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Member filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterMember('')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-colors ${
            !filterMember ? 'bg-foyer-500 text-white border-foyer-500' : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          Tous
        </button>
        {MEMBERS.map(m => (
          <button
            key={m.id}
            onClick={() => setFilterMember(filterMember === m.id ? '' : m.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
              filterMember === m.id ? 'text-white' : 'bg-white text-gray-600 border-gray-200'
            }`}
            style={filterMember === m.id ? { backgroundColor: m.color, borderColor: m.color } : {}}
          >
            {m.emoji} {m.name}
          </button>
        ))}
      </div>

      {/* Month navigation */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <ChevronLeft size={18} />
          </button>
          <h3 className="font-bold text-gray-800">
            {MONTH_NAMES_FR[month]} {year}
          </h3>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <ChevronRight size={18} />
          </button>
        </div>

        <MonthGrid
          year={year}
          month={month}
          events={events}
          onDayClick={(date) => {
            setSelectedDay(selectedDay === date ? null : date);
            setDefaultDate(date);
          }}
          onEventClick={(ev) => { setEditEvent(ev); setShowForm(true); }}
        />
      </div>

      {/* Selected day events */}
      {selectedDay && selectedDayEvents.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">{formatDate(selectedDay)}</h3>
          <div className="space-y-2">
            {selectedDayEvents.map(ev => (
              <EventCard key={ev.id} event={ev} onEdit={() => { setEditEvent(ev); setShowForm(true); }} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">À venir</h3>
          <div className="space-y-2">
            {upcomingEvents.map(ev => (
              <EventCard key={ev.id} event={ev} onEdit={() => { setEditEvent(ev); setShowForm(true); }} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Calendar sync */}
      <CalendarSync />

      <EventForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditEvent(null); }}
        onSave={handleSave}
        event={editEvent}
        defaultDate={defaultDate}
      />
    </div>
  );
}

function CalendarSync() {
  const [copied, setCopied] = useState(false);
  const apiBase = import.meta.env.VITE_API_URL ?? window.location.origin;
  const token = localStorage.getItem('auth_token') ?? '';
  const feedUrl = `${apiBase}/api/events/calendar.ics?token=${token}`;
  const webcalUrl = feedUrl.replace(/^https?:/, 'webcal:');
  const googleUrl = `https://www.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(webcalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100">
      <h3 className="font-semibold text-gray-700 text-sm mb-1">Synchroniser le calendrier</h3>
      <p className="text-xs text-gray-400 mb-3">Abonnez-vous pour voir les événements en temps réel dans votre appli calendrier.</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={webcalUrl}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-white text-xs font-medium rounded-xl hover:bg-gray-700 transition-colors"
        >
          Apple Calendar
        </a>
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white text-xs font-medium rounded-xl hover:bg-blue-600 transition-colors"
        >
          <ExternalLink size={12} />
          Google Calendar
        </a>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-xl hover:bg-gray-200 transition-colors"
        >
          {copied ? <Check size={12} className="text-green-500" /> : <Link size={12} />}
          {copied ? 'Copié !' : 'Copier l\'URL'}
        </button>
      </div>
    </div>
  );
}

function EventCard({ event, onEdit, onDelete }: { event: Event; onEdit: () => void; onDelete: (id: number) => void }) {
  const handleDownloadIcs = () => {
    window.open(`${import.meta.env.VITE_API_URL ?? ''}/api/events/${event.id}/ics`, '_blank');
  };

  const handleGoogleCalendar = () => {
    const fmt = (date: string, time?: string | null) =>
      time ? `${date.replace(/-/g, '')}T${time.replace(':', '')}00` : date.replace(/-/g, '');
    const start = fmt(event.date, event.time);
    const end = fmt(event.end_date || event.date, event.end_time || event.time);
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${start}/${end}`,
      ...(event.description ? { details: event.description } : {}),
      ...(event.location    ? { location: event.location }    : {}),
    });
    window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank');
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
      <div
        className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
        style={{ backgroundColor: event.color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{event.title}</p>
        <p className="text-xs text-gray-400">
          {event.time ? `${event.time}${event.end_time ? ` – ${event.end_time}` : ''}` : 'Toute la journée'}
          {event.location ? ` · 📍 ${event.location}` : ''}
        </p>
        {event.description && (
          <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {event.memberIds.map(id => <MemberAvatar key={id} memberId={id} size="xs" />)}
        </div>
      </div>
      <div className="flex gap-1">
        <button onClick={handleDownloadIcs} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100" title="Télécharger .ics">
          <Download size={13} />
        </button>
        <button onClick={handleGoogleCalendar} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100" title="Google Calendar">
          <ExternalLink size={13} />
        </button>
        <button onClick={onEdit} className="text-xs text-foyer-500 px-2 py-1 rounded-lg hover:bg-foyer-50">
          Modifier
        </button>
        <button onClick={() => onDelete(event.id)} className="text-xs text-red-400 px-2 py-1 rounded-lg hover:bg-red-50">
          ✕
        </button>
      </div>
    </div>
  );
}
