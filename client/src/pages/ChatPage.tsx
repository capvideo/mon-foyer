import { useEffect, useState, useRef, useCallback } from 'react';
import { Send, X, Zap } from 'lucide-react';
import { api } from '../utils/api';
import { Channel, Message, Member, getMember } from '../types';
import { MessageBubble, DateSeparator } from '../components/chat/MessageBubble';
import { useWebSocket } from '../hooks/useWebSocket';

interface Props {
  currentMember: Member;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  { label: 'Salaire reçu 💼', action: 'salary_received', template: (m: Member) => `Mon salaire a été versé ce mois ✅` },
  { label: 'Loyer validé 🏠', action: 'rent_validated', template: () => `Le loyer locatif a été validé ✅` },
  { label: 'Voir solde 💰', action: 'show_balance', template: () => `Quelqu'un peut partager le solde des comptes ?` },
];

function groupMessagesByDate(messages: Message[]): Array<{ type: 'date'; date: string } | { type: 'message'; message: Message }> {
  const result: Array<{ type: 'date'; date: string } | { type: 'message'; message: Message }> = [];
  let lastDate = '';

  for (const msg of messages) {
    const date = msg.timestamp.split('T')[0];
    if (date !== lastDate) {
      result.push({ type: 'date', date });
      lastDate = date;
    }
    result.push({ type: 'message', message: msg });
  }
  return result;
}

export function ChatPage({ currentMember, onClose }: Props) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('famille');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleWsMessage = useCallback((data: any) => {
    if (data.type === 'message' && data.data?.channel_id === activeChannel) {
      setMessages(prev => {
        if (prev.find(m => m.id === data.data.id)) return prev;
        return [...prev, data.data];
      });
    }
  }, [activeChannel]);

  const { connected, sendMessage, sendTyping } = useWebSocket({
    channelId: activeChannel,
    memberId: currentMember.id,
    onMessage: handleWsMessage,
  });

  useEffect(() => {
    api.getChannels().then(setChannels);
  }, []);

  useEffect(() => {
    api.getMessages(activeChannel).then(setMessages);
  }, [activeChannel]);

  // Re-fetch on reconnect to catch messages missed while disconnected
  const wasConnected = useRef(false);
  useEffect(() => {
    const justReconnected = connected && !wasConnected.current;
    wasConnected.current = connected;
    if (!justReconnected) return;
    api.getMessages(activeChannel).then(setMessages);
  }, [connected, activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const content = input.trim();
    if (!content) return;

    sendMessage(activeChannel, content, currentMember.id, 'text');
    setInput('');
    inputRef.current?.focus();
  };

  const handleQuickAction = (qa: typeof QUICK_ACTIONS[0]) => {
    const content = qa.template(currentMember);
    sendMessage(activeChannel, content, currentMember.id, 'action', { action: qa.action });
    setShowQuick(false);
  };

  const grouped = groupMessagesByDate(messages);
  const activeChannelData = channels.find(c => c.id === activeChannel);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white safe-area-pt">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100">
          <X size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <p className="font-bold text-gray-800">
            {activeChannelData?.icon} {activeChannelData?.name}
          </p>
          <p className={`text-xs ${connected ? 'text-green-500' : 'text-gray-400'}`}>
            {connected ? 'Connecté' : 'Reconnexion...'}
          </p>
        </div>
      </div>

      {/* Channel tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-gray-100 overflow-x-auto">
        {channels.map(ch => (
          <button
            key={ch.id}
            onClick={() => setActiveChannel(ch.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeChannel === ch.id
                ? 'bg-foyer-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{ch.icon}</span>
            <span>{ch.name}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {grouped.map((item, i) => {
          if (item.type === 'date') {
            return <DateSeparator key={`date-${item.date}`} date={item.date} />;
          }
          const msg = item.message;
          const isMine = msg.member_id === currentMember.id;
          const prevMsg = i > 0 && grouped[i - 1].type === 'message' ? (grouped[i - 1] as any).message : null;
          const showAvatar = !isMine && (!prevMsg || prevMsg.member_id !== msg.member_id);

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={isMine}
              showAvatar={showAvatar}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {showQuick && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 mb-2">Actions rapides</p>
          <div className="flex gap-2 flex-wrap">
            {QUICK_ACTIONS.map(qa => (
              <button
                key={qa.action}
                onClick={() => handleQuickAction(qa)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:bg-foyer-50 hover:border-foyer-300 transition-colors"
              >
                {qa.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white safe-area-pb">
        <button
          onClick={() => setShowQuick(!showQuick)}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
            showQuick ? 'bg-foyer-100 text-foyer-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <Zap size={16} />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => {
            setInput(e.target.value);
            sendTyping(activeChannel, currentMember.id);
          }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foyer-300"
          placeholder="Écrire un message..."
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-foyer-500 text-white disabled:opacity-40 hover:bg-foyer-600 transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
