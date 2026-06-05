import { TrendingUp, TrendingDown } from 'lucide-react';
import { Account, formatAmount } from '../../types';

interface Props {
  account: Account;
  income: number;
  expense: number;
  showNotification?: boolean;
  onClick?: () => void;
  active?: boolean;
}

function getNotification(balance: number): { msg: string; bg: string } {
  if (balance > 100) return { msg: 'Bon mois ! 🎉', bg: 'bg-green-500/20' };
  if (balance >= 0) return { msg: 'Quelques ajustements 💡', bg: 'bg-yellow-500/20' };
  return { msg: 'Dans le rouge 🚨', bg: 'bg-red-500/20' };
}

export function AccountCard({ account, income, expense, showNotification, onClick, active }: Props) {
  const balance = account.balance;
  const isLow = balance < 300;
  const notif = showNotification ? getNotification(balance) : null;

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl p-4 text-left transition-all ${
        active ? 'ring-2 ring-offset-2' : ''
      }`}
      style={{
        background: `linear-gradient(135deg, ${account.color}CC, ${account.color})`,
        '--tw-ring-color': account.color,
      } as React.CSSProperties}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white/80 text-xs font-medium uppercase tracking-wide">{account.bank}</p>
          <p className="text-white font-semibold text-sm mt-0.5">{account.name}</p>
        </div>
        {isLow && !notif && (
          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            ⚠️ Bas
          </span>
        )}
      </div>

      <div className="mt-2">
        <p className="text-white/70 text-xs">Solde du mois</p>
        <p className={`text-white font-bold text-2xl ${isLow && !notif ? 'text-yellow-200' : ''}`}>
          {formatAmount(balance)}
        </p>
      </div>

      {notif && (
        <div className={`mt-2 px-2.5 py-1.5 rounded-xl ${notif.bg}`}>
          <p className="text-white text-xs leading-snug">{notif.msg}</p>
        </div>
      )}

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/20">
        <div className="flex items-center gap-1">
          <TrendingUp size={13} className="text-green-300" />
          <span className="text-white/80 text-xs">{formatAmount(income)}</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingDown size={13} className="text-red-300" />
          <span className="text-white/80 text-xs">{formatAmount(expense)}</span>
        </div>
      </div>
    </button>
  );
}
