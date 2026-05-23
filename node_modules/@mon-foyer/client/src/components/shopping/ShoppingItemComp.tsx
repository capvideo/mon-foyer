import { Trash2 } from 'lucide-react';
import { ShoppingItem } from '../../types';
import { MemberAvatar } from '../common/MemberAvatar';

interface Props {
  item: ShoppingItem;
  onCheck: (id: number, checked: boolean) => void;
  onDelete: (id: number) => void;
}

export function ShoppingItemComp({ item, onCheck, onDelete }: Props) {
  return (
    <div className={`flex items-center gap-3 py-2 px-1 rounded-lg transition-opacity ${item.checked ? 'opacity-50' : ''}`}>
      <button
        onClick={() => onCheck(item.id, !item.checked)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          item.checked
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-foyer-400'
        }`}
      >
        {item.checked && <span className="text-white text-xs">✓</span>}
      </button>

      <span className={`flex-1 text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
        {item.name}
        {item.quantity && (
          <span className="text-gray-400 ml-1 text-xs">
            {item.quantity}{item.unit ? ` ${item.unit}` : ''}
          </span>
        )}
      </span>

      {item.added_by && <MemberAvatar memberId={item.added_by} size="xs" />}

      <button
        onClick={() => onDelete(item.id)}
        className="w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
        style={{ opacity: undefined }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '')}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
