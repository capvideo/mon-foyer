import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Transaction, TRANSACTION_CATEGORIES, formatAmount } from '../../types';

interface Props {
  transactions: Transaction[];
  view?: 'bar' | 'pie';
}

export function BudgetChart({ transactions, view = 'bar' }: Props) {
  const validated = transactions.filter(t => t.validated);

  if (view === 'pie') {
    const expenseByCategory = TRANSACTION_CATEGORIES
      .filter(c => c.type === 'expense')
      .map(cat => {
        const total = validated
          .filter(t => t.type === 'expense' && t.category === cat.id)
          .reduce((s, t) => s + t.amount, 0);
        return { name: cat.label, value: total, icon: cat.icon, color: getCatColor(cat.id) };
      })
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);

    return (
      <div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={expenseByCategory}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
            >
              {expenseByCategory.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => formatAmount(v)} />
            <Legend iconSize={10} formatter={(value) => <span className="text-xs">{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const income = validated.filter(t => t.type === 'income' && !t.is_rental).reduce((s, t) => s + t.amount, 0);
  const expense = validated.filter(t => t.type === 'expense' && !t.is_rental).reduce((s, t) => s + t.amount, 0);
  const rentalIn = validated.filter(t => t.type === 'income' && t.is_rental).reduce((s, t) => s + t.amount, 0);
  const rentalOut = validated.filter(t => t.type === 'expense' && t.is_rental).reduce((s, t) => s + t.amount, 0);

  const data = [
    { name: 'Revenus', value: income, fill: '#22c55e' },
    { name: 'Dépenses', value: expense, fill: '#ef4444' },
    { name: 'Loyers +', value: rentalIn, fill: '#3b82f6' },
    { name: 'Crédits -', value: rentalOut, fill: '#f97316' },
  ];

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barSize={32}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}€`} />
        <Tooltip formatter={(v: number) => formatAmount(v)} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function getCatColor(id: string): string {
  const colors: Record<string, string> = {
    loyer_residence: '#ef4444', courses: '#f97316', assurances: '#eab308',
    abonnements: '#8b5cf6', telecom: '#06b6d4', sante: '#ec4899',
    epargne: '#22c55e', dons: '#f43f5e', credit_immo: '#3b82f6', autre: '#9ca3af',
  };
  return colors[id] || '#9ca3af';
}
