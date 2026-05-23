import { useState } from 'react';
import { MEMBERS, Member } from './types';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { HomePage } from './pages/HomePage';
import { BudgetPage } from './pages/BudgetPage';
import { AgendaPage } from './pages/AgendaPage';
import { CoursesPage } from './pages/CoursesPage';
import { TodoPage } from './pages/TodoPage';
import { ChatPage } from './pages/ChatPage';

type Tab = 'home' | 'budget' | 'agenda' | 'courses' | 'todo';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [currentMember, setCurrentMember] = useState<Member>(MEMBERS[0]); // José par défaut
  const [chatOpen, setChatOpen] = useState(false);

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage currentMember={currentMember} onNavigate={(t) => setActiveTab(t as Tab)} />;
      case 'budget':
        return <BudgetPage currentMember={currentMember} />;
      case 'agenda':
        return <AgendaPage currentMember={currentMember} />;
      case 'courses':
        return <CoursesPage currentMember={currentMember} />;
      case 'todo':
        return <TodoPage currentMember={currentMember} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-foyer-50 flex flex-col">
      <TopBar
        currentMember={currentMember}
        onChangeMember={setCurrentMember}
        onOpenChat={() => setChatOpen(true)}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-14 pb-20">
        <div className="max-w-lg mx-auto px-4 py-4">
          {renderPage()}
        </div>
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />

      {/* Chat overlay */}
      {chatOpen && (
        <ChatPage
          currentMember={currentMember}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
