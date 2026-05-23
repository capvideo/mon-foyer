import { MEMBERS, getMember } from '../../types';

interface Props {
  memberId: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

const sizes = {
  xs: 'w-5 h-5 text-xs',
  sm: 'w-7 h-7 text-sm',
  md: 'w-9 h-9 text-base',
  lg: 'w-12 h-12 text-xl',
};

export function MemberAvatar({ memberId, size = 'md', showName, className = '' }: Props) {
  const member = getMember(memberId);
  if (!member) return null;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div
        className={`${sizes[size]} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
        style={{ backgroundColor: member.color }}
        title={member.name}
      >
        {member.emoji}
      </div>
      {showName && <span className="text-sm text-gray-700 font-medium">{member.name}</span>}
    </div>
  );
}

export function MemberPicker({
  selected,
  onChange,
  multi = false,
}: {
  selected: string | string[];
  onChange: (val: string | string[]) => void;
  multi?: boolean;
}) {
  const selectedArr = Array.isArray(selected) ? selected : [selected];

  return (
    <div className="flex gap-2 flex-wrap">
      {MEMBERS.map(m => {
        const isSelected = selectedArr.includes(m.id);
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              if (multi) {
                const newArr = isSelected
                  ? selectedArr.filter(id => id !== m.id)
                  : [...selectedArr, m.id];
                onChange(newArr);
              } else {
                onChange(isSelected ? '' : m.id);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition-all ${
              isSelected ? 'border-current text-white' : 'border-gray-200 text-gray-600 bg-white'
            }`}
            style={isSelected ? { backgroundColor: m.color, borderColor: m.color } : {}}
          >
            <span>{m.emoji}</span>
            <span className="text-sm font-medium">{m.name}</span>
          </button>
        );
      })}
    </div>
  );
}
