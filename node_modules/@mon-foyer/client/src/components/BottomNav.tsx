import { Home, Wallet, Calendar, ShoppingCart, CheckSquare } from 'lucide-react';

type Tab = 'home' | 'budget' | 'agenda' | 'courses' | 'todo';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs = [
  { id: 'home' as Tab, label: 'Accueil', icon: Home },
  { id: 'budget' as Tab, label: 'Budget', icon: Wallet },
  { id: 'agenda' as Tab, label: 'Agenda', icon: Calendar },
  { id: 'courses' as Tab, label: 'Courses', icon: ShoppingCart },
  { id: 'todo' as Tab, label: 'Tâches', icon: CheckSquare },
];

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex items-center justify-around px-1 h-16">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                isActive ? 'text-foyer-500' : 'text-gray-400'
              }`}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={isActive ? 'text-foyer-500' : 'text-gray-400'}
              />
              <span className={`text-[10px] font-medium ${isActive ? 'text-foyer-500' : 'text-gray-400'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
