import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { ShoppingItem, SHOPPING_CATEGORIES } from '../../types';
import { ShoppingItemComp } from './ShoppingItemComp';

interface Props {
  category: typeof SHOPPING_CATEGORIES[0];
  items: ShoppingItem[];
  onCheck: (id: number, checked: boolean) => void;
  onDelete: (id: number) => void;
  onAdd: (name: string, category: string) => void;
}

export function ShoppingSection({ category, items, onCheck, onDelete, onAdd }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState('');

  const unchecked = items.filter(i => !i.checked);
  const checked = items.filter(i => i.checked);

  if (items.length === 0 && !adding) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.trim()) {
      onAdd(newItem.trim(), category.id);
      setNewItem('');
      setAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{category.icon}</span>
          <span className="font-semibold text-gray-800 text-sm">{category.label}</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {unchecked.length}/{items.length}
          </span>
        </div>
        {collapsed ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-3 space-y-1">
          {unchecked.map(item => (
            <ShoppingItemComp key={item.id} item={item} onCheck={onCheck} onDelete={onDelete} />
          ))}
          {checked.map(item => (
            <ShoppingItemComp key={item.id} item={item} onCheck={onCheck} onDelete={onDelete} />
          ))}

          {adding ? (
            <form onSubmit={handleAdd} className="flex gap-2 mt-2">
              <input
                autoFocus
                type="text"
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-foyer-300"
                placeholder="Nom de l'article..."
              />
              <button type="submit" className="px-3 py-1.5 bg-foyer-500 text-white rounded-lg text-sm font-medium">
                OK
              </button>
              <button type="button" onClick={() => setAdding(false)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 text-xs text-foyer-500 hover:text-foyer-600 mt-1 py-1"
            >
              <Plus size={13} /> Ajouter dans {category.label.toLowerCase()}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
