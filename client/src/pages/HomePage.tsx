import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Calendar, CheckSquare, ArrowRight } from 'lucide-react';
import { api } from '../utils/api';
import { Account, Event, Todo, Transaction, Member, formatAmount, formatDateShort, MEMBERS } from '../types';
import { MemberAvatar } from '../components/common/MemberAvatar';
import { BudgetChart } from '../components/budget/BudgetChart';

interface Props {
  currentMember: Member;
  onNavigate: (tab: string) => void;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function currentMonthLabel(): string {
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date());
}

const MONTHLY_MODE_FROM = '2026-06';

export function HomePage({ currentMember, onNavigate }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const month = currentMonth();
    const useMonthlyMode = month >= MONTHLY_MODE_FROM;
    Promise.all([
      api.getAccounts(useMonthlyMode ? month : undefined),
      api.getTransactions({ month }),
      api.getEvents({ month }),
      api.getTodos({ status: 'pending' }),
    ]).then(([accs, txs, evs, tds]) => {
      setAccounts(accs);
      setTransactions(txs);
      setEvents(evs.slice(0, 3));
      setTodos(tds.slice(0, 3));
      setLoading(false);
    });
  }, []);

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const totalIncome = transactions.filter(t => t.type === 'income' && t.validated && !t.is_rental).reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense' && t.validated && !t.is_rental).reduce((s, t) => s + t.amount, 0);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-foyer-200 border-t-foyer-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-foyer-500 to-foyer-700 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            {currentMember.emoji}
          </div>
          <div>
            <p className="text-white/70 text-sm">{greeting()}</p>
            <h2 className="text-xl font-bold">{currentMember.name} 👋</h2>
          </div>
        </div>

        <div className="bg-white/10 rounded-xl p-3">
          <p className="text-white/70 text-xs">Solde total du foyer</p>
          <p className="text-3xl font-bold mt-0.5">{formatAmount(totalBalance)}</p>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1">
              <TrendingUp size={13} className="text-green-300" />
              <span className="text-xs text-white/80">{formatAmount(totalIncome)}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown size={13} className="text-red-300" />
              <span className="text-xs text-white/80">{formatAmount(totalExpense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account cards */}
      <div className="grid grid-cols-2 gap-3">
        {accounts.map(acc => (
          <button
            key={acc.id}
            onClick={() => onNavigate('budget')}
            className="rounded-2xl p-3 text-left"
            style={{ background: `linear-gradient(135deg, ${acc.color}99, ${acc.color})` }}
          >
            <p className="text-white/70 text-[10px] font-medium uppercase">{acc.bank}</p>
            <p className="text-white font-bold text-lg mt-1">{formatAmount(acc.balance)}</p>
            <p className="text-white/70 text-xs">{acc.name}</p>
          </button>
        ))}
      </div>

      {/* Budget mini chart */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-sm capitalize">Budget {currentMonthLabel()}</h3>
          <button onClick={() => onNavigate('budget')} className="text-xs text-foyer-500 flex items-center gap-1">
            Voir tout <ArrowRight size={12} />
          </button>
        </div>
        <BudgetChart transactions={transactions} view="bar" />
      </div>

      {/* Upcoming events */}
      {events.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Calendar size={15} className="text-foyer-500" /> Prochains événements
            </h3>
            <button onClick={() => onNavigate('agenda')} className="text-xs text-foyer-500 flex items-center gap-1">
              Voir <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {events.map(ev => (
              <div key={ev.id} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: ev.color + '20' }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ev.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{ev.title}</p>
                  <p className="text-xs text-gray-400">
                    {formatDateShort(ev.date)}{ev.time ? ` · ${ev.time}` : ''}
                  </p>
                </div>
                <div className="flex -space-x-1">
                  {ev.memberIds.slice(0, 3).map(id => (
                    <MemberAvatar key={id} memberId={id} size="xs" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending todos */}
      {todos.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <CheckSquare size={15} className="text-foyer-500" /> Tâches urgentes
            </h3>
            <button onClick={() => onNavigate('todo')} className="text-xs text-foyer-500 flex items-center gap-1">
              Voir <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {todos.filter(t => t.priority === 'high').map(todo => (
              <div key={todo.id} className="flex items-center gap-3 bg-red-50 rounded-xl px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <span className="flex-1 text-sm text-gray-800 truncate">{todo.title}</span>
                {todo.assigned_to && <MemberAvatar memberId={todo.assigned_to} size="xs" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Family members */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <h3 className="font-bold text-gray-800 text-sm mb-3">Le foyer</h3>
        <div className="flex justify-around">
          {MEMBERS.map(m => (
            <div key={m.id} className="flex flex-col items-center gap-2">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-md"
                style={{ backgroundColor: m.color }}
              >
                {m.emoji}
              </div>
              <span className="text-xs font-medium text-gray-600">{m.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
