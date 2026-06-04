const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const r = await fetch(BASE + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  });
  if (r.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.reload();
    throw new Error('Session expirée');
  }
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export const api = {
  // Members
  getMembers: () => req<any[]>('/members'),

  // Auth (invite & register)
  createInvite: (memberId: string, email: string) =>
    req<{ inviteUrl: string; expiresAt: string; emailSent: boolean }>('/auth/invite', { method: 'POST', body: JSON.stringify({ memberId, email }) }),
  getInvite: (token: string) =>
    req<{ memberId: string; name: string; color: string; emoji: string; email: string }>(`/auth/invite/${token}`),
  register: (token: string, password: string) =>
    req<{ token: string; member: any }>('/auth/register', { method: 'POST', body: JSON.stringify({ token, password }) }),

  // Accounts
  getAccounts: () => req<any[]>('/accounts'),
  createAccount: (data: any) => req<any>('/accounts', { method: 'POST', body: JSON.stringify(data) }),
  updateAccount: (id: number, data: any) => req<any>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Transactions
  getTransactions: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return req<any[]>(`/transactions${qs}`);
  },
  createTransaction: (data: any) => req<any>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id: number, data: any) => req<any>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  validateTransaction: (id: number, validated: boolean) =>
    req<any>(`/transactions/${id}/validate`, { method: 'PATCH', body: JSON.stringify({ validated }) }),
  deleteTransaction: (id: number) => req<any>(`/transactions/${id}`, { method: 'DELETE' }),
  importCsv: (rows: any[], accountId: number) =>
    req<any>('/transactions/import-csv', { method: 'POST', body: JSON.stringify({ rows, accountId }) }),

  // Events
  getEvents: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return req<any[]>(`/events${qs}`);
  },
  createEvent: (data: any) => req<any>('/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id: number, data: any) => req<any>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id: number) => req<any>(`/events/${id}`, { method: 'DELETE' }),

  // Shopping
  getShopping: () => req<any[]>('/shopping'),
  createShoppingItem: (data: any) => req<any>('/shopping', { method: 'POST', body: JSON.stringify(data) }),
  checkShoppingItem: (id: number, checked: boolean) =>
    req<any>(`/shopping/${id}/check`, { method: 'PATCH', body: JSON.stringify({ checked }) }),
  deleteShoppingItem: (id: number) => req<any>(`/shopping/${id}`, { method: 'DELETE' }),
  clearCheckedItems: () => req<any>('/shopping/checked/all', { method: 'DELETE' }),
  updateShoppingItem: (id: number, data: any) => req<any>(`/shopping/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Todos
  getTodos: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return req<any[]>(`/todos${qs}`);
  },
  createTodo: (data: any) => req<any>('/todos', { method: 'POST', body: JSON.stringify(data) }),
  updateTodo: (id: number, data: any) => req<any>(`/todos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setTodoStatus: (id: number, status: string) =>
    req<any>(`/todos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteTodo: (id: number) => req<any>(`/todos/${id}`, { method: 'DELETE' }),

  // Chat
  getChannels: () => req<any[]>('/chat/channels'),
  getMessages: (channelId: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return req<any[]>(`/chat/channels/${channelId}/messages${qs}`);
  },
  sendMessage: (channelId: string, data: any) =>
    req<any>(`/chat/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify(data) }),

  // Push
  getVapidKey: () => req<{ key: string }>('/push/vapid-public'),
  subscribePush: (memberId: string, subscription: any) =>
    req<any>('/push/subscribe', { method: 'POST', body: JSON.stringify({ memberId, subscription }) }),
};
