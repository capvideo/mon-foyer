import { useState, useEffect } from 'react';
import { MessageCircle, Bell, LogOut, UserPlus, Copy, Check } from 'lucide-react';
import { Member } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

interface Props {
  currentMember: Member;
  onChangeMember: (m: Member) => void;
  onOpenChat: () => void;
  unreadCount?: number;
}

export function TopBar({ currentMember, onChangeMember, onOpenChat, unreadCount = 0 }: Props) {
  const { user, logout } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteFor, setInviteFor] = useState<Member | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getMembers().then(setMembers).catch(() => {});
  }, [user?.id]);

  const isAdmin = user?.is_admin === 1;

  const handleMemberClick = (m: Member) => {
    if (m.has_account) {
      onChangeMember(m);
    } else if (isAdmin) {
      setInviteFor(m);
      setInviteEmail('');
      setInviteUrl('');
      setInviteError('');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteFor || !inviteEmail) return;
    setInviteLoading(true);
    setInviteError('');
    try {
      const { inviteUrl: url } = await api.createInvite(inviteFor.id, inviteEmail);
      setInviteUrl(url);
    } catch (err: any) {
      setInviteError(err.message ?? 'Erreur');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          {members.map(m => (
            <button
              key={m.id}
              onClick={() => handleMemberClick(m)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                currentMember.id === m.id
                  ? 'ring-2 ring-offset-1 scale-110'
                  : m.has_account
                  ? 'opacity-60 hover:opacity-80'
                  : isAdmin ? 'opacity-40 hover:opacity-60' : 'opacity-20 cursor-default'
              }`}
              style={{ backgroundColor: m.color, '--tw-ring-color': m.color } as React.CSSProperties}
              title={m.has_account ? m.name : `${m.name} — ${isAdmin ? 'cliquer pour inviter' : 'pas encore inscrit'}`}
            >
              {m.has_account
                ? m.emoji
                : isAdmin
                ? <UserPlus size={13} className="text-white" />
                : m.emoji}
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
          <button
            onClick={logout}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            title="Se déconnecter"
          >
            <LogOut size={18} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Invite dialog */}
      {inviteFor && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
          onClick={() => setInviteFor(null)}
        >
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: inviteFor.color }}>
                {inviteFor.emoji}
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Inviter {inviteFor.name}</h3>
                <p className="text-xs text-gray-400">Créer un lien d'inscription</p>
              </div>
            </div>

            {!inviteUrl ? (
              <form onSubmit={handleInvite} className="space-y-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder={`Email de ${inviteFor.name}`}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foyer-400"
                  autoFocus
                />
                {inviteError && <p className="text-red-500 text-xs">{inviteError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setInviteFor(null)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading || !inviteEmail}
                    className="flex-1 py-2.5 rounded-xl bg-foyer-500 text-white text-sm font-medium disabled:opacity-60"
                  >
                    {inviteLoading ? 'Création…' : 'Générer le lien'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-green-600 font-medium">Lien créé !</p>
                <p className="text-xs text-gray-500">Partagez ce lien avec {inviteFor.name} pour qu'il/elle crée son compte. Valable 7 jours.</p>
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 break-all">{inviteUrl}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setInviteFor(null)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex-1 py-2.5 rounded-xl bg-foyer-500 text-white text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
