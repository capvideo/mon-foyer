export interface Member {
  id: string;
  name: string;
  color: string;
  emoji: string;
  is_admin?: number;
  has_account?: boolean;
}

export interface Account {
  id: number;
  name: string;
  bank: string;
  initialBalance: number;
  initial_balance: number;
  color: string;
  balance: number;
}

export interface Transaction {
  id: number;
  account_id: number;
  label: string;
  amount: number;
  type: 'income' | 'expense' | 'internal';
  category: string;
  date: string;
  validated: boolean;
  member_id: string | null;
  notes: string | null;
  is_rental: boolean;
}

export interface Event {
  id: number;
  title: string;
  date: string;
  time: string | null;
  end_date: string | null;
  end_time: string | null;
  description: string | null;
  memberIds: string[];
  color: string;
  location: string | null;
  reminder_minutes: number | null;
}

export interface ShoppingItem {
  id: number;
  name: string;
  category: string;
  quantity: string | null;
  unit: string | null;
  checked: boolean;
  added_by: string | null;
  created_at: string;
}

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  priority: 'high' | 'normal' | 'low';
  assigned_to: string | null;
  status: 'pending' | 'done';
  due_date: string | null;
  event_id: number | null;
  created_at: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  memberIds: string[];
  icon: string | null;
}

export interface Message {
  id: number;
  channel_id: string;
  member_id: string;
  content: string;
  type: 'text' | 'action' | 'system';
  timestamp: string;
  metadata: string | null;
}

export const MEMBERS: Member[] = [
  { id: 'jose', name: 'José', color: '#378ADD', emoji: '👨' },
  { id: 'anais', name: 'Anaïs', color: '#D4537E', emoji: '👩' },
  { id: 'lucas', name: 'Lucas', color: '#639922', emoji: '🧒' },
];

export const SHOPPING_CATEGORIES = [
  { id: 'fruits_legumes', label: 'Fruits & Légumes', icon: '🥦' },
  { id: 'laitiers', label: 'Produits laitiers', icon: '🥛' },
  { id: 'epicerie', label: 'Épicerie', icon: '🥫' },
  { id: 'viandes', label: 'Viandes & Poissons', icon: '🥩' },
  { id: 'surgeles', label: 'Surgelés', icon: '❄️' },
  { id: 'hygiene', label: 'Hygiène & Beauté', icon: '🧴' },
];

export const TRANSACTION_CATEGORIES = [
  { id: 'salaires', label: 'Salaires', type: 'income', icon: '💼' },
  { id: 'loyers_percus', label: 'Loyers perçus', type: 'income', icon: '🏠' },
  { id: 'cip_gestion', label: 'CIP Gestion', type: 'income', icon: '📋' },
  { id: 'caf', label: 'CAF', type: 'income', icon: '👶' },
  { id: 'loyer_residence', label: 'Loyer résidence', type: 'expense', icon: '🏘️' },
  { id: 'courses', label: 'Courses', type: 'expense', icon: '🛒' },
  { id: 'assurances', label: 'Assurances', type: 'expense', icon: '🛡️' },
  { id: 'abonnements', label: 'Abonnements', type: 'expense', icon: '📺' },
  { id: 'telecom', label: 'Télécom', type: 'expense', icon: '📱' },
  { id: 'sante', label: 'Santé', type: 'expense', icon: '⚕️' },
  { id: 'epargne', label: 'Épargne', type: 'expense', icon: '🏦' },
  { id: 'dons', label: 'Dons', type: 'expense', icon: '❤️' },
  { id: 'credit_immo', label: 'Crédit immobilier', type: 'expense', icon: '🏗️' },
  { id: 'autre', label: 'Autre', type: 'expense', icon: '📝' },
];

export function getMember(id: string | null): Member | undefined {
  return MEMBERS.find(m => m.id === id);
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateStr));
}

export function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(dateStr));
}
