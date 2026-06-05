import { Router } from 'express';
import { getDb } from '../db/index';

const router = Router();

router.get('/', async (_req, res) => {
  const db = await getDb();

  const [messages, shopping, todos, transactions, events] = await Promise.all([
    db.all('SELECT id, content, member_id, timestamp as ts FROM messages ORDER BY id DESC LIMIT 6'),
    db.all('SELECT id, name, created_at as ts FROM shopping_items ORDER BY id DESC LIMIT 4'),
    db.all('SELECT id, title, created_at as ts FROM todos ORDER BY id DESC LIMIT 4'),
    db.all('SELECT id, label, date as ts, type FROM transactions ORDER BY id DESC LIMIT 4'),
    db.all('SELECT id, title, date as ts FROM events ORDER BY id DESC LIMIT 4'),
  ]);

  const items = [
    ...messages.map((m: any) => ({
      icon: '💬',
      text: m.content.length > 55 ? m.content.slice(0, 55) + '…' : m.content,
      ts: m.ts,
    })),
    ...shopping.map((s: any) => ({
      icon: '🛒',
      text: `${s.name} ajouté à la liste`,
      ts: s.ts,
    })),
    ...todos.map((t: any) => ({
      icon: '✅',
      text: `Tâche : ${t.title}`,
      ts: t.ts,
    })),
    ...transactions.map((t: any) => ({
      icon: t.type === 'income' ? '💰' : '💳',
      text: `${t.type === 'income' ? 'Entrée' : 'Dépense'} : ${t.label}`,
      ts: t.ts,
    })),
    ...events.map((e: any) => ({
      icon: '📅',
      text: `Événement : ${e.title}`,
      ts: e.ts,
    })),
  ]
    .filter(item => item.ts)
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 15);

  res.json(items);
});

export default router;
