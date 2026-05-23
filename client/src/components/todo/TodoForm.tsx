import { useState } from 'react';
import { Todo } from '../../types';
import { Modal } from '../common/Modal';
import { MemberPicker } from '../common/MemberAvatar';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  todo?: Todo | null;
}

export function TodoForm({ open, onClose, onSave, todo }: Props) {
  const [form, setForm] = useState({
    title: todo?.title || '',
    description: todo?.description || '',
    priority: todo?.priority || 'normal',
    assignedTo: todo?.assigned_to || '',
    dueDate: todo?.due_date || '',
    status: todo?.status || 'pending',
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: form.title,
      description: form.description || null,
      priority: form.priority,
      assignedTo: form.assignedTo || null,
      dueDate: form.dueDate || null,
      status: form.status,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={todo ? 'Modifier la tâche' : 'Nouvelle tâche'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foyer-300"
            placeholder="Que faut-il faire ?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-foyer-300"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
          <div className="flex gap-2">
            {([
              ['high', '🔴 Haute'],
              ['normal', '🔵 Normale'],
              ['low', '⚪ Basse'],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => set('priority', val)}
                className={`flex-1 py-2 text-xs rounded-lg border-2 transition-all font-medium ${
                  form.priority === val ? 'border-foyer-400 bg-foyer-50 text-foyer-600' : 'border-gray-200 text-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Assignée à</label>
          <MemberPicker selected={form.assignedTo} onChange={v => set('assignedTo', v)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date limite</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={e => set('dueDate', e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-foyer-500 text-white rounded-xl font-semibold hover:bg-foyer-600 transition-colors"
        >
          {todo ? 'Enregistrer' : 'Créer la tâche'}
        </button>
      </form>
    </Modal>
  );
}
