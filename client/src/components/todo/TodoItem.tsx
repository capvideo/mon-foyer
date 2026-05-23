import { Trash2, Edit2, Calendar } from 'lucide-react';
import { Todo, getMember, formatDateShort } from '../../types';
import { MemberAvatar } from '../common/MemberAvatar';

interface Props {
  todo: Todo;
  onToggle: (id: number, status: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: number) => void;
}

const PRIORITY_CONFIG = {
  high: { label: 'Haute', color: 'bg-red-100 text-red-600', dot: 'bg-red-500' },
  normal: { label: 'Normale', color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-400' },
  low: { label: 'Basse', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-300' },
};

export function TodoItem({ todo, onToggle, onEdit, onDelete }: Props) {
  const isDone = todo.status === 'done';
  const priority = PRIORITY_CONFIG[todo.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;
  const isOverdue = todo.due_date && todo.due_date < new Date().toISOString().split('T')[0] && !isDone;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
      isDone ? 'bg-gray-50 border-gray-100 opacity-70' : 'bg-white border-gray-100'
    } ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
      {/* Priority dot + checkbox */}
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <div className={`w-2 h-2 rounded-full ${priority.dot}`} />
        <button
          onClick={() => onToggle(todo.id, isDone ? 'pending' : 'done')}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            isDone
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-foyer-400'
          }`}
        >
          {isDone && <span className="text-white text-xs">✓</span>}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {todo.title}
        </p>
        {todo.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{todo.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priority.color}`}>
            {priority.label}
          </span>
          {todo.due_date && (
            <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              <Calendar size={10} />
              {formatDateShort(todo.due_date)}
              {isOverdue && ' ⚠️'}
            </span>
          )}
          {todo.assigned_to && <MemberAvatar memberId={todo.assigned_to} size="xs" />}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(todo)}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
        >
          <Edit2 size={12} />
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
