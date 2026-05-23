import { Home, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction, formatAmount } from '../../types';

interface Props {
  transactions: Transaction[];
}

const RENTAL_ITEMS = [
  { label: 'Crédit LCL 09/10', amount: 927.71, type: 'expense' as const },
  { label: 'Crédit LCL 20/21', amount: 337.77, type: 'expense' as const },
  { label: 'CIP Gestion (recettes)', amount: 465.91, type: 'income' as const },
  { label: 'Remboursement locataire', amount: 1500, type: 'income' as const },
];

export function RentalBlock({ transactions }: Props) {
  const rentalTx = transactions.filter(t => t.is_rental);
  const income = rentalTx.filter(t => t.type === 'income' && t.validated).reduce((s, t) => s + t.amount, 0);
  const expense = rentalTx.filter(t => t.type === 'expense' && t.validated).reduce((s, t) => s + t.amount, 0);
  const net = income - expense;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
          <Home size={16} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-blue-900 text-sm">Bloc Locatif</h3>
          <p className="text-blue-600 text-xs">Appartements loués</p>
        </div>
        <div className="ml-auto text-right">
          <p className={`font-bold text-sm ${net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {net >= 0 ? '+' : ''}{formatAmount(net)}
          </p>
          <p className="text-blue-500 text-xs">Net mensuel</p>
        </div>
      </div>

      <div className="space-y-2">
        {RENTAL_ITEMS.map((item, i) => {
          const matching = rentalTx.find(t =>
            t.amount === item.amount || t.label.toLowerCase().includes(item.label.toLowerCase().split(' ')[0])
          );
          return (
            <div key={i} className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                {item.type === 'income'
                  ? <TrendingUp size={13} className="text-green-500" />
                  : <TrendingDown size={13} className="text-red-500" />
                }
                <span className="text-xs text-gray-700">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${item.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                  {item.type === 'income' ? '+' : '-'}{formatAmount(item.amount)}
                </span>
                {matching?.validated ? (
                  <span className="text-green-500 text-[10px]">✓</span>
                ) : (
                  <span className="text-amber-500 text-[10px]">⏳</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between text-xs">
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp size={12} />
          <span>Entrées : {formatAmount(income)}</span>
        </div>
        <div className="flex items-center gap-1 text-red-500">
          <TrendingDown size={12} />
          <span>Sorties : {formatAmount(expense)}</span>
        </div>
      </div>
    </div>
  );
}
