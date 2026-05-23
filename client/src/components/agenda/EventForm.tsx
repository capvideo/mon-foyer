import { useState } from 'react';
import { Event, MEMBERS } from '../../types';
import { Modal } from '../common/Modal';
import { MemberPicker } from '../common/MemberAvatar';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  event?: Event | null;
  defaultDate?: string;
}

const COLORS = ['#378ADD', '#D4537E', '#639922', '#FF6B35', '#8b5cf6', '#06b6d4', '#f59e0b'];

export function EventForm({ open, onClose, onSave, event, defaultDate }: Props) {
  const [form, setForm] = useState({
    title: event?.title || '',
    date: event?.date || defaultDate || new Date().toISOString().split('T')[0],
    time: event?.time || '',
    endDate: event?.end_date || '',
    endTime: event?.end_time || '',
    description: event?.description || '',
    memberIds: event?.memberIds || ['jose', 'anais', 'lucas'],
    color: event?.color || '#378ADD',
    location: event?.location || '',
    reminderMinutes: event?.reminder_minutes ?? 30,
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={event ? 'Modifier l\'événement' : 'Nouvel événement'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foyer-300"
            placeholder="Ex: Réunion parents d'élèves"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date début *</label>
            <input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
            <input
              type="time"
              value={form.time}
              onChange={e => set('time', e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
            <input
              type="date"
              value={form.endDate}
              onChange={e => set('endDate', e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heure fin</label>
            <input
              type="time"
              value={form.endTime}
              onChange={e => set('endTime', e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
          <input
            type="text"
            value={form.location}
            onChange={e => set('location', e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="Adresse ou lieu"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Participants</label>
          <MemberPicker
            selected={form.memberIds}
            onChange={v => set('memberIds', v)}
            multi
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => set('color', c)}
                className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 scale-110' : ''}`}
                style={{ backgroundColor: c, ringColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rappel</label>
          <select
            value={form.reminderMinutes}
            onChange={e => set('reminderMinutes', Number(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            <option value={0}>Pas de rappel</option>
            <option value={15}>15 min avant</option>
            <option value={30}>30 min avant</option>
            <option value={60}>1h avant</option>
            <option value={1440}>La veille</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-foyer-500 text-white rounded-xl font-semibold hover:bg-foyer-600 transition-colors"
        >
          {event ? 'Enregistrer' : 'Créer l\'événement'}
        </button>
      </form>
    </Modal>
  );
}
