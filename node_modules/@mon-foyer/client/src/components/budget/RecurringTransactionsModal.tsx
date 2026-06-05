import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, RefreshCw } from 'lucide-react';
import { api } from '../../utils/api';
import { Account, RecurringTransaction, TRANSACTION_CATEGORIES, formatAmount } from '../../types';

interface ApplyState {
  enabled: boolean;
  accountId: number;
  date: string;
  amount: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  month: string;
  onApplied: () => void;
}

const BLANK_TEMPLATE = {
  label: '',
  amount: 0,
  type: 'expense' as 'income' | 'expense',
  category: 'autre',
  default_account_id: null as number | null,
  default_day: 1,
};

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));
}

function defaultDate(month: string, day: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = Math.min(day, new Date(y, m, 0).getDate());
  return `${month}-${String(d).padStart(2, '0')}`;
}

export function RecurringTransactionsModal({ open, onClose, accounts, month, onApplied }: Props) {
  const [templates, setTemplates] = useState<RecurringTransaction[]>([]);
  const [selections, setSelections] = useState<Record<number, ApplyState>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newTpl, setNewTpl] = useState(BLANK_TEMPLATE);
  const [applying, setApplying] = useState(false);
  const [tab, setTab] = useState<'apply' | 'manage'>('apply');

  const loadTemplates = async () => {
    const rows = await api.getRecurring();
    setTemplates(rows);
    const sel: Record<number, ApplyState> = {};
    for (const t of rows) {
      if (t.active) {
        sel[t.id] = {
          enabled: false,
          accountId: t.default_account_id ?? accounts[0]?.id ?? 0,
          date: defaultDate(month, t.default_day),
          amount: t.amount,
        };
      }
    }
    setSelections(sel);
  };

  useEffect(() => {
    if (open) loadTemplates();
  }, [open, month]);

  const updateSel = (id: number, patch: Partial<ApplyState>) =>
    setSelections(s => ({ ...s, [id]: { ...s[id], ...patch } }));

  const handleApply = async () => {
    const enabled = templates.filter(t => selections[t.id]?.enabled);
    if (!enabled.length) return;
    setApplying(true);
    try {
      const payload = enabled.map(t => ({
        recurringId: t.id,
        accountId: selections[t.id].accountId,
        date: selections[t.id].date,
        amount: selections[t.id].amount,
        label: t.label,
        type: t.type,
        category: t.category,
      }));
      await api.applyRecurring(payload);
      onApplied();
      onClose();
    } finally {
      setApplying(false);
    }
  };

  const handleAddTemplate = async () => {
    if (!newTpl.label || !newTpl.amount) return;
    await api.createRecurring(newTpl);
    setNewTpl(BLANK_TEMPLATE);
    setShowAdd(false);
    loadTemplates();
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Supprimer ce récurrent ?')) return;
    await api.deleteRecurring(id);
    loadTemplates();
  };

  const handleToggleActive = async (t: RecurringTransaction) => {
    await api.updateRecurring(t.id, { ...t, active: t.active ? 0 : 1 });
    loadTemplates();
  };

  if (!open) return null;

  const activeTemplates = templates.filter(t => t.active);
  const selectedCount = Object.values(selections).filter(s => s.enabled).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Transactions récurrentes</h2>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{monthLabel(month)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mx-5 mb-3 bg-gray-100 rounded-xl p-1">
          {([['apply', 'Appliquer ce mois'], ['manage', 'Gérer']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
          {tab === 'apply' && (
            <>
              {activeTemplates.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">
                  Aucun récurrent actif.<br />
                  <button onClick={() => setTab('manage')} className="text-foyer-500 underline mt-1">Gérer les récurrents</button>
                </p>
              ) : (
                activeTemplates.map(t => {
                  const sel = selections[t.id];
                  if (!sel) return null;
                  const cat = TRANSACTION_CATEGORIES.find(c => c.id === t.category);
                  return (
                    <div
                      key={t.id}
                      className={`border rounded-2xl p-3 transition-colors ${
                        sel.enabled ? 'border-foyer-300 bg-foyer-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateSel(t.id, { enabled: !sel.enabled })}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                            sel.enabled ? 'bg-foyer-500 text-white' : 'border-2 border-gray-300'
                          }`}
                        >
                          {sel.enabled && <Check size={14} />}
                        </button>
                        <span className="text-lg">{cat?.icon ?? '📝'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{t.label}</p>
                          <p className="text-xs text-gray-400">{cat?.label}</p>
                        </div>
                        <span className={`text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatAmount(sel.amount)}
                        </span>
                      </div>

                      {sel.enabled && (
                        <div className="mt-3 pt-3 border-t border-foyer-200 grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Compte</label>
                            <select
                              value={sel.accountId}
                              onChange={e => updateSel(t.id, { accountId: Number(e.target.value) })}
                              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-foyer-300"
                            >
                              {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.bank} – {a.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Date</label>
                            <input
                              type="date"
                              value={sel.date}
                              onChange={e => updateSel(t.id, { date: e.target.value })}
                              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-foyer-300"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-xs text-gray-500 mb-1 block">Montant (€)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={sel.amount}
                              onChange={e => updateSel(t.id, { amount: Number(e.target.value) })}
                              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-foyer-300"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

          {tab === 'manage' && (
            <>
              {templates.map(t => {
                const cat = TRANSACTION_CATEGORIES.find(c => c.id === t.category);
                return (
                  <div key={t.id} className={`flex items-center gap-3 border rounded-2xl p-3 ${t.active ? 'border-gray-200' : 'border-gray-100 opacity-50'}`}>
                    <span className="text-lg">{cat?.icon ?? '📝'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{t.label}</p>
                      <p className="text-xs text-gray-400">
                        {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount)} · j-{t.default_day}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleActive(t)}
                      className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                        t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {t.active ? 'Actif' : 'Inactif'}
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(t.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}

              {!showAdd ? (
                <button
                  onClick={() => setShowAdd(true)}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-2xl py-3 text-sm text-gray-400 hover:border-foyer-300 hover:text-foyer-500 transition-colors"
                >
                  <Plus size={16} /> Ajouter un récurrent
                </button>
              ) : (
                <div className="border-2 border-foyer-200 rounded-2xl p-4 space-y-3 bg-foyer-50">
                  <p className="text-sm font-semibold text-gray-700">Nouveau récurrent</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Libellé</label>
                      <input
                        type="text"
                        value={newTpl.label}
                        onChange={e => setNewTpl(s => ({ ...s, label: e.target.value }))}
                        placeholder="Ex: Salaire Cap Video"
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-foyer-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Montant (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newTpl.amount || ''}
                        onChange={e => setNewTpl(s => ({ ...s, amount: Number(e.target.value) }))}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-foyer-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Jour du mois</label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={newTpl.default_day}
                        onChange={e => setNewTpl(s => ({ ...s, default_day: Number(e.target.value) }))}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-foyer-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Type</label>
                      <select
                        value={newTpl.type}
                        onChange={e => setNewTpl(s => ({ ...s, type: e.target.value as 'income' | 'expense', category: 'autre' }))}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-foyer-300"
                      >
                        <option value="income">Entrée</option>
                        <option value="expense">Sortie</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Catégorie</label>
                      <select
                        value={newTpl.category}
                        onChange={e => setNewTpl(s => ({ ...s, category: e.target.value }))}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-foyer-300"
                      >
                        {TRANSACTION_CATEGORIES.filter(c => c.type === newTpl.type).map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Compte par défaut</label>
                      <select
                        value={newTpl.default_account_id ?? ''}
                        onChange={e => setNewTpl(s => ({ ...s, default_account_id: e.target.value ? Number(e.target.value) : null }))}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-foyer-300"
                      >
                        <option value="">— Aucun —</option>
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.bank} – {a.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setShowAdd(false); setNewTpl(BLANK_TEMPLATE); }}
                      className="flex-1 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleAddTemplate}
                      className="flex-1 py-2 text-sm font-semibold text-white bg-foyer-500 rounded-xl hover:bg-foyer-600"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer (apply tab) */}
        {tab === 'apply' && (
          <div className="px-5 pb-6 pt-2 border-t border-gray-100">
            <button
              onClick={handleApply}
              disabled={selectedCount === 0 || applying}
              className="w-full flex items-center justify-center gap-2 bg-foyer-500 text-white rounded-2xl py-3.5 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-foyer-600 transition-colors"
            >
              <RefreshCw size={16} className={applying ? 'animate-spin' : ''} />
              {applying ? 'Application...' : `Appliquer ${selectedCount > 0 ? `(${selectedCount})` : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
