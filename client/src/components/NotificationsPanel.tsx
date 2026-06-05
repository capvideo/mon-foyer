import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../utils/api';

interface NotifItem {
  icon: string;
  text: string;
  ts: string;
}

function relativeTime(ts: string): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

interface Props {
  onClose: () => void;
}

export function NotificationsPanel({ onClose }: Props) {
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getNotifications()
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
    localStorage.setItem('notif_seen', new Date().toISOString());
  }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', handle), 0);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 mt-1 w-80 max-w-[calc(100vw-16px)] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-bold text-gray-800 text-sm">Activité récente</h3>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <X size={14} className="text-gray-400" />
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-16 text-gray-400 text-sm">Chargement…</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-16 text-gray-400 text-sm gap-1">
            <span className="text-2xl">🔔</span>
            <span>Aucune activité récente</span>
          </div>
        ) : (
          <ul>
            {items.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <span className="text-base mt-0.5 flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-snug line-clamp-2">{item.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{relativeTime(item.ts)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
