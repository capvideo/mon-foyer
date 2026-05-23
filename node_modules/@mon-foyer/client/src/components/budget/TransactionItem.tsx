import { Check, Clock, Trash2, Edit2 } from 'lucide-react';
import { Transaction, TRANSACTION_CATEGORIES, getMember, formatAmount, formatDateShort } from '../../types';
import { MemberAvatar } from '../common/MemberAvatar';

interface Props {
  tx: Transaction;
  onValidate: (id: number, validated: boolean) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: number) => void;
}

export function TransactionItem({ tx, onValidate, onEdit, onDelete }: Props) {
  const cat = TRANSACTION_CATEGORIES.find(c => c.id === tx.category);
  const isIncome = tx.type === 'income';

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
      tx.validated ? 'bg-white border-gray-100' : 'bg-amber-50 border-amber-200'
    }`}>
      {/* Category icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base ${
        isIncome ? 'bg-green-100' : 'bg-red-50'
      }`}>
        {cat?.icon || '📝'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{tx.label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400">{formatDateShort(tx.date)}</span>
          {cat && <span className="text-xs text-gray-400">· {cat.label}</span>}
          {tx.member_id && <MemberAvatar memberId={tx.member_id} size="xs" />}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className={`font-bold text-sm ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
          {isIncome ? '+' : '-'}{formatAmount(tx.amount)}
        </p>
        <div className="flex items-center justify-end gap-1 mt-1">
          {tx.is_rental && (
            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">🏠</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onValidate(tx.id, !tx.validated)}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
            tx.validated
              ? 'bg-green-100 text-green-600'
              : 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-600'
          }`}
          title={tx.validated ? 'Validée' : 'En attente'}
        >
          {tx.validated ? <Check size={13} /> : <Clock size={13} />}
        </button>
        <button
          onClick={() => onEdit(tx)}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
        >
          <Edit2 size={12} />
        </button>
        <button
          onClick={() => onDelete(tx.id)}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
