import { useEffect, useState } from 'react';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';
import { api } from '../utils/api';
import { ShoppingItem, SHOPPING_CATEGORIES, Member } from '../types';
import { ShoppingSection } from '../components/shopping/ShoppingSection';

interface Props { currentMember: Member }

export function CoursesPage({ currentMember }: Props) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [showAddGlobal, setShowAddGlobal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState(SHOPPING_CATEGORIES[0].id);

  const load = async () => {
    const data = await api.getShopping();
    setItems(data);
  };

  useEffect(() => { load(); }, []);

  const handleCheck = async (id: number, checked: boolean) => {
    await api.checkShoppingItem(id, checked);
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked } : i));
  };

  const handleDelete = async (id: number) => {
    await api.deleteShoppingItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleAdd = async (name: string, category: string) => {
    const item = await api.createShoppingItem({
      name, category, addedBy: currentMember.id,
    });
    setItems(prev => [...prev, item]);
  };

  const handleClearChecked = async () => {
    const count = items.filter(i => i.checked).length;
    if (count === 0) return;
    if (confirm(`Vider ${count} article(s) coché(s) ?`)) {
      await api.clearCheckedItems();
      setItems(prev => prev.filter(i => !i.checked));
    }
  };

  const handleAddGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      handleAdd(newName.trim(), newCat);
      setNewName('');
      setShowAddGlobal(false);
    }
  };

  const checkedCount = items.filter(i => i.checked).length;
  const totalCount = items.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Liste de courses</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {totalCount - checkedCount} à prendre · {checkedCount} coché(s)
          </p>
        </div>
        <div className="flex gap-2">
          {checkedCount > 0 && (
            <button
              onClick={handleClearChecked}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors"
            >
              <Trash2 size={13} /> Vider les cochés
            </button>
          )}
          <button
            onClick={() => setShowAddGlobal(!showAddGlobal)}
            className="w-9 h-9 bg-foyer-500 text-white rounded-full flex items-center justify-center"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAddGlobal && (
        <form onSubmit={handleAddGlobal} className="bg-white rounded-2xl p-4 border border-foyer-200 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">Ajouter un article</p>
          <div className="space-y-3">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foyer-300"
              placeholder="Nom de l'article..."
            />
            <select
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foyer-300"
            >
              {SHOPPING_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-2 bg-foyer-500 text-white rounded-xl text-sm font-semibold">
                Ajouter
              </button>
              <button type="button" onClick={() => setShowAddGlobal(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm">
                Annuler
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Shopping sections by category */}
      {SHOPPING_CATEGORIES.map(cat => {
        const catItems = items.filter(i => i.category === cat.id);
        return (
          <ShoppingSection
            key={cat.id}
            category={cat}
            items={catItems}
            onCheck={handleCheck}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />
        );
      })}

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <ShoppingCart size={48} className="mb-3 opacity-50" />
          <p className="text-sm font-medium">La liste est vide !</p>
          <p className="text-xs mt-1">Appuyez sur + pour ajouter des articles</p>
        </div>
      )}
    </div>
  );
}
