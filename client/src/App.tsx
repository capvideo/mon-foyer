import { useState, useEffect, useRef } from 'react';
import { Member } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useNotifications } from './hooks/useNotifications';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { HomePage } from './pages/HomePage';
import { BudgetPage } from './pages/BudgetPage';
import { AgendaPage } from './pages/AgendaPage';
import { CoursesPage } from './pages/CoursesPage';
import { TodoPage } from './pages/TodoPage';
import { ChatPage } from './pages/ChatPage';

type Tab = 'home' | 'budget' | 'agenda' | 'courses' | 'todo';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [inviteToken] = useState(() => new URLSearchParams(window.location.search).get('token'));
  const { subscribe } = useNotifications();
  const subscribedRef = useRef<string | null>(null);

  useEffect(() => {
    if (user) {
      setCurrentMember({ id: user.id, name: user.name, color: user.color, emoji: user.emoji });
      if (subscribedRef.current !== user.id) {
        subscribedRef.current = user.id;
        subscribe(user.id).catch(() => {});
      }
    } else {
      setCurrentMember(null);
      subscribedRef.current = null;
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-foyer-50 flex items-center justify-center">
        <span className="text-gray-400 text-sm">Chargement…</span>
      </div>
    );
  }

  if (inviteToken) return <SignupPage token={inviteToken} />;
  if (!user || !currentMember) return <LoginPage />;

  const renderPage = () => {
    switch (activeTab) {
      case 'home':    return <HomePage currentMember={currentMember} onNavigate={(t) => setActiveTab(t as Tab)} />;
      case 'budget':  return <BudgetPage currentMember={currentMember} />;
      case 'agenda':  return <AgendaPage currentMember={currentMember} />;
      case 'courses': return <CoursesPage currentMember={currentMember} />;
      case 'todo':    return <TodoPage currentMember={currentMember} />;
      default:        return null;
    }
  };

  return (
    <div className="min-h-screen bg-foyer-50 flex flex-col">
      <TopBar
        currentMember={currentMember}
        onChangeMember={setCurrentMember}
        onOpenChat={() => setChatOpen(true)}
      />
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="max-w-lg mx-auto px-4 py-4">
          {renderPage()}
        </div>
      </main>
      <BottomNav active={activeTab} onChange={setActiveTab} />
      {chatOpen && (
        <ChatPage currentMember={currentMember} onClose={() => setChatOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
