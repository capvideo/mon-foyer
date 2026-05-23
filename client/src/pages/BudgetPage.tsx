import { useEffect, useState } from 'react';
import { Plus, Upload, Filter, BarChart2, PieChart as PieIcon, Home } from 'lucide-react';
import { api } from '../utils/api';
import { Account, Transaction, Member, formatAmount } from '../types';
import { AccountCard } from '../components/budget/AccountCard';
import { TransactionItem } from '../components/budget/TransactionItem';
import { TransactionForm } from '../components/budget/TransactionForm';
import { RentalBlock } from '../components/budget/RentalBlock';
import { CSVImport } from '../components/budget/CSVImport';
import { BudgetChart } from '../components/budget/BudgetChart';
import { parseCsv } from '../utils/csvParser';

interface Props { currentMember: Member }

export function BudgetPage({ currentMember }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [chartView, setChartView] = useState<'bar' | 'pie'>('bar');
  const [showRental, setShowRental] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [month, setMonth] = useState('2026-05');

  const load = async () => {
    const [accs, txs] = await Promise.all([
      api.getAccounts(),
      api.getTransactions({ month }),
    ]);
    setAccounts(accs);
    setTransactions(txs);
    if (!selectedAccount && accs.length) setSelectedAccount(accs[0].id);
  };

  useEffect(() => { load(); }, [month]);

  const filteredTx = transactions.filter(t => {
    if (selectedAccount && t.account_id !== selectedAccount) return false;
    if (filter === 'income') return t.type === 'income';
    if (filter === 'expense') return t.type === 'expense';
    return true;
  });

  const visibleTx = filteredTx.filter(t => !t.is_rental || showRental);

  const getAccountStats = (accountId: number) => {
    const txs = transactions.filter(t => t.account_id === accountId && t.validated);
    return {
      income: txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  };

  const handleSave = async (data: any) => {
    if (editTx) {
      await api.updateTransaction(editTx.id, data);
    } else {
      await api.createTransaction(data);
    }
    setEditTx(null);
    load();
  };

  const handleValidate = async (id: number, validated: boolean) => {
    await api.validateTransaction(id, validated);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cette transaction ?')) {
      await api.deleteTransaction(id);
      load();
    }
  };

  const handleImportCsv = async (rows: any[], accountId: number) => {
    await api.importCsv(rows, accountId);
    load();
  };

  const pendingCount = transactions.filter(t => !t.validated).length;
  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  return (
    <div className="space-y-4">
      {/* Month picker */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Budget</h2>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-foyer-300"
        />
      </div>

      {/* Total balance */}
      <div className="bg-gradient-to-r from-foyer-500 to-foyer-600 rounded-2xl p-4 text-white">
        <p className="text-white/70 text-xs">Solde total</p>
        <p className="text-3xl font-bold">{formatAmount(totalBalance)}</p>
        {pendingCount > 0 && (
          <p className="text-white/70 text-xs mt-1">⏳ {pendingCount} transaction(s) en attente</p>
        )}
      </div>

      {/* Account cards */}
      <div className="grid grid-cols-2 gap-3">
        {accounts.map(acc => {
          const stats = getAccountStats(acc.id);
          return (
            <AccountCard
              key={acc.id}
              account={acc}
              income={stats.income}
              expense={stats.expense}
              active={selectedAccount === acc.id}
              onClick={() => setSelectedAccount(selectedAccount === acc.id ? null : acc.id)}
            />
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-sm">Analyse du mois</h3>
          <div className="flex gap-1">
            <button
              onClick={() => setChartView('bar')}
              className={`p-1.5 rounded-lg transition-colors ${chartView === 'bar' ? 'bg-foyer-100 text-foyer-600' : 'text-gray-400'}`}
            >
              <BarChart2 size={16} />
            </button>
            <button
              onClick={() => setChartView('pie')}
              className={`p-1.5 rounded-lg transition-colors ${chartView === 'pie' ? 'bg-foyer-100 text-foyer-600' : 'text-gray-400'}`}
            >
              <PieIcon size={16} />
            </button>
          </div>
        </div>
        <BudgetChart transactions={transactions} view={chartView} />
      </div>

      {/* Rental block toggle */}
      <button
        onClick={() => setShowRental(!showRental)}
        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${
          showRental ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-center gap-2">
          <Home size={16} className={showRental ? 'text-blue-500' : 'text-gray-400'} />
          <span className={`text-sm font-medium ${showRental ? 'text-blue-700' : 'text-gray-600'}`}>
            Bloc Locatif
          </span>
        </div>
        <span className="text-xs text-gray-400">{showRental ? 'Masquer' : 'Afficher'}</span>
      </button>

      {showRental && <RentalBlock transactions={transactions} />}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => { setEditTx(null); setShowForm(true); }}
          className="flex-1 flex items-center justify-center gap-2 bg-foyer-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-foyer-600 transition-colors"
        >
          <Plus size={16} /> Ajouter
        </button>
        <button
          onClick={() => setShowCsv(true)}
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Upload size={16} /> CSV
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {([['all', 'Tout'], ['income', 'Entrées'], ['expense', 'Sorties']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              filter === val ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Transactions */}
      <div className="space-y-2">
        {visibleTx.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">Aucune transaction</p>
          </div>
        ) : (
          visibleTx.map(tx => (
            <TransactionItem
              key={tx.id}
              tx={tx}
              onValidate={handleValidate}
              onEdit={(t) => { setEditTx(t); setShowForm(true); }}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <TransactionForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditTx(null); }}
        onSave={handleSave}
        accounts={accounts}
        tx={editTx}
      />

      <CSVImport
        open={showCsv}
        onClose={() => setShowCsv(false)}
        accounts={accounts}
        onImport={handleImportCsv}
      />
    </div>
  );
}
