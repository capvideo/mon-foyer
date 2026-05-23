import { useState } from 'react';
import { Transaction, Account, TRANSACTION_CATEGORIES, MEMBERS } from '../../types';
import { Modal } from '../common/Modal';
import { MemberPicker } from '../common/MemberAvatar';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  accounts: Account[];
  tx?: Transaction | null;
}

export function TransactionForm({ open, onClose, onSave, accounts, tx }: Props) {
  const [form, setForm] = useState({
    accountId: tx?.account_id || accounts[0]?.id || 1,
    label: tx?.label || '',
    amount: tx?.amount || '',
    type: tx?.type || 'expense',
    category: tx?.category || 'autre',
    date: tx?.date || new Date().toISOString().split('T')[0],
    validated: tx?.validated ?? false,
    memberId: tx?.member_id || '',
    notes: tx?.notes || '',
    isRental: tx?.is_rental ?? false,
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      accountId: Number(form.accountId),
      label: form.label,
      amount: Number(form.amount),
      type: form.type,
      category: form.category,
      date: form.date,
      validated: form.validated,
      memberId: form.memberId || null,
      notes: form.notes || null,
      isRental: form.isRental,
    });
    onClose();
  };

  const filteredCats = TRANSACTION_CATEGORIES.filter(c =>
    form.type === 'income' ? c.type === 'income' : c.type === 'expense'
  );

  return (
    <Modal open={open} onClose={onClose} title={tx ? 'Modifier la transaction' : 'Nouvelle transaction'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {(['income', 'expense'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { set('type', t); set('category', t === 'income' ? 'salaires' : 'autre'); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                form.type === t
                  ? t === 'income' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t === 'income' ? '↑ Entrée' : '↓ Sortie'}
            </button>
          ))}
        </div>

        {/* Account */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Compte</label>
          <select
            value={form.accountId}
            onChange={e => set('accountId', e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foyer-300"
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.bank})</option>
            ))}
          </select>
        </div>

        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Libellé</label>
          <input
            type="text"
            value={form.label}
            onChange={e => set('label', e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foyer-300"
            placeholder="Ex: Salaire, Courses..."
          />
        </div>

        {/* Amount + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (€)</label>
            <input
              type="number"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              required
              min="0"
              step="0.01"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foyer-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foyer-300"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
          <select
            value={form.category}
            onChange={e => set('category', e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foyer-300"
          >
            {filteredCats.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>
        </div>

        {/* Member */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Membre concerné</label>
          <MemberPicker selected={form.memberId} onChange={v => set('memberId', v)} />
        </div>

        {/* Options */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.validated}
              onChange={e => set('validated', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Validée</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRental}
              onChange={e => set('isRental', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Locatif</span>
          </label>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foyer-300 resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-foyer-500 text-white rounded-xl font-semibold hover:bg-foyer-600 transition-colors"
        >
          {tx ? 'Enregistrer' : 'Ajouter'}
        </button>
      </form>
    </Modal>
  );
}
