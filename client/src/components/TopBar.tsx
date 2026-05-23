import { MessageCircle, Bell } from 'lucide-react';
import { MEMBERS, Member } from '../types';

interface Props {
  currentMember: Member;
  onChangeMember: (m: Member) => void;
  onOpenChat: () => void;
  unreadCount?: number;
}

export function TopBar({ currentMember, onChangeMember, onOpenChat, unreadCount = 0 }: Props) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 safe-area-pt">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-foyer-500 flex items-center justify-center">
            <span className="text-white text-sm">🏠</span>
          </div>
          <span className="font-bold text-gray-800 text-lg">Mon Foyer</span>
        </div>

        {/* Member selector */}
        <div className="flex items-center gap-1.5">
          {MEMBERS.map(m => (
            <button
              key={m.id}
              onClick={() => onChangeMember(m)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                currentMember.id === m.id
                  ? 'ring-2 ring-offset-1 scale-110'
                  : 'opacity-60 hover:opacity-80'
              }`}
              style={{
                backgroundColor: m.color,
                ringColor: m.color,
              }}
              title={m.name}
            >
              {m.emoji}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenChat}
            className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <MessageCircle size={20} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-foyer-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <Bell size={20} className="text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
}
