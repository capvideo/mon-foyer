import { Event, MEMBERS, getMember } from '../../types';

interface Props {
  year: number;
  month: number; // 0-based
  events: Event[];
  onDayClick: (date: string) => void;
  onEventClick: (event: Event) => void;
}

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function MonthGrid({ year, month, events, onDayClick, onEventClick }: Props) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Monday-based: 0=Mon, 6=Sun
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();
  const today = new Date().toISOString().split('T')[0];

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const pad = cells.length % 7;
  if (pad) cells.push(...Array(7 - pad).fill(null));

  const getDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getEventsForDay = (day: number) => {
    const ds = getDateStr(day);
    return events.filter(e => {
      const end = e.end_date || e.date;
      return e.date <= ds && end >= ds;
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_FR.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="aspect-square" />;

          const dateStr = getDateStr(day);
          const dayEvents = getEventsForDay(day);
          const isToday = dateStr === today;
          const isPast = dateStr < today;

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`aspect-square flex flex-col items-center justify-start pt-1 rounded-lg transition-colors text-xs hover:bg-gray-100 ${
                isToday ? 'bg-foyer-500 text-white hover:bg-foyer-600' : isPast ? 'text-gray-400' : 'text-gray-700'
              }`}
            >
              <span className={`font-medium ${isToday ? 'font-bold' : ''}`}>{day}</span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {dayEvents.slice(0, 3).map((ev, j) => (
                    <button
                      key={j}
                      onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ev.color }}
                      title={ev.title}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
