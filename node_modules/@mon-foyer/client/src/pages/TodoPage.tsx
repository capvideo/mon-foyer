import { useEffect, useState } from 'react';
import { Plus, CheckSquare } from 'lucide-react';
import { api } from '../utils/api';
import { Todo, Member, MEMBERS } from '../types';
import { TodoItem } from '../components/todo/TodoItem';
import { TodoForm } from '../components/todo/TodoForm';

interface Props { currentMember: Member }

export function TodoPage({ currentMember }: Props) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTodo, setEditTodo] = useState<Todo | null>(null);
  const [filterMember, setFilterMember] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'done'>('pending');

  const load = async () => {
    const params: Record<string, string> = {};
    if (filterMember) params.assignedTo = filterMember;
    if (filterStatus !== 'all') params.status = filterStatus;
    const data = await api.getTodos(params);
    setTodos(data);
  };

  useEffect(() => { load(); }, [filterMember, filterStatus]);

  const handleSave = async (data: any) => {
    if (editTodo) {
      await api.updateTodo(editTodo.id, data);
    } else {
      await api.createTodo(data);
    }
    setEditTodo(null);
    load();
  };

  const handleToggle = async (id: number, status: string) => {
    await api.setTodoStatus(id, status);
    setTodos(prev => prev.map(t => t.id === id ? { ...t, status: status as any } : t));
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cette tâche ?')) {
      await api.deleteTodo(id);
      setTodos(prev => prev.filter(t => t.id !== id));
    }
  };

  const highTodos = todos.filter(t => t.priority === 'high');
  const normalTodos = todos.filter(t => t.priority === 'normal');
  const lowTodos = todos.filter(t => t.priority === 'low');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Tâches</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {todos.filter(t => t.status === 'pending').length} en cours · {todos.filter(t => t.status === 'done').length} terminées
          </p>
        </div>
        <button
          onClick={() => { setEditTodo(null); setShowForm(true); }}
          className="w-9 h-9 bg-foyer-500 text-white rounded-full flex items-center justify-center"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {([
          ['pending', 'En cours'],
          ['done', 'Terminées'],
          ['all', 'Tout'],
        ] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilterStatus(val)}
            className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              filterStatus === val ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
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

      {/* Todo groups */}
      {todos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <CheckSquare size={48} className="mb-3 opacity-50" />
          <p className="text-sm font-medium">Aucune tâche</p>
          <p className="text-xs mt-1">Appuyez sur + pour créer une tâche</p>
        </div>
      ) : (
        <>
          {highTodos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-500 mb-2 flex items-center gap-1">
                🔴 Priorité haute ({highTodos.length})
              </p>
              <div className="space-y-2">
                {highTodos.map(todo => (
                  <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} onEdit={(t) => { setEditTodo(t); setShowForm(true); }} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          {normalTodos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-500 mb-2 flex items-center gap-1">
                🔵 Priorité normale ({normalTodos.length})
              </p>
              <div className="space-y-2">
                {normalTodos.map(todo => (
                  <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} onEdit={(t) => { setEditTodo(t); setShowForm(true); }} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          {lowTodos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                ⚪ Priorité basse ({lowTodos.length})
              </p>
              <div className="space-y-2">
                {lowTodos.map(todo => (
                  <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} onEdit={(t) => { setEditTodo(t); setShowForm(true); }} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <TodoForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditTodo(null); }}
        onSave={handleSave}
        todo={editTodo}
      />
    </div>
  );
}
