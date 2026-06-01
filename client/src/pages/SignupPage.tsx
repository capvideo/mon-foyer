import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface Props { token: string }

export function SignupPage({ token }: Props) {
  const { register } = useAuth();
  const [invite, setInvite] = useState<{ name: string; color: string; emoji: string; email: string } | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    api.getInvite(token)
      .then(setInvite)
      .catch(() => setError('Invitation invalide ou expirée'))
      .finally(() => setValidating(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('6 caractères minimum'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    setLoading(true);
    setError('');
    try {
      await register(token, password);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (validating) return (
    <div className="min-h-screen bg-foyer-50 flex items-center justify-center">
      <span className="text-gray-400 text-sm">Validation de l'invitation…</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-foyer-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-foyer-500 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🏠</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Mon Foyer</h1>
          <p className="text-sm text-gray-500 mt-1">Créer votre compte</p>
        </div>

        {!invite ? (
          <p className="text-red-500 text-sm text-center">{error || 'Invitation invalide.'}</p>
        ) : (
          <>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: invite.color }}
              >
                {invite.emoji}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{invite.name}</p>
                <p className="text-xs text-gray-400">{invite.email}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="6 caractères minimum"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foyer-400"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foyer-400"
                  autoComplete="new-password"
                />
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-foyer-500 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60"
              >
                {loading ? 'Création…' : 'Créer mon compte'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
