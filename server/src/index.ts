import fs from 'fs';
import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { WebSocketServer } from 'ws';

// Load .env in development (no dotenv dependency needed)
const _envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(_envPath)) {
  for (const line of fs.readFileSync(_envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#\s][^=]*)=(.*)$/);
    if (m) process.env[m[1].trim()] ??= m[2].trim();
  }
}

import { initDb, getDb } from './db/index';
import { setupWebSocket } from './websocket';
import { requireAuth } from './middleware/auth';

import authRouter from './routes/auth';
import accountsRouter from './routes/accounts';
import transactionsRouter from './routes/transactions';
import eventsRouter from './routes/events';
import shoppingRouter from './routes/shopping';
import todosRouter from './routes/todos';
import chatRouter from './routes/chat';
import pushRouter from './routes/push';
import recurringRouter from './routes/recurring';
import rentalRouter from './routes/rental';

const PORT = process.env.PORT || 3001;

async function main() {
  await initDb();

  const app = express();
  const server = http.createServer(app);

  const allowedOrigins = [
    'https://mon-foyerclient-production.up.railway.app',
    'http://localhost:5173',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : []),
  ];
  const corsOptions = { origin: allowedOrigins };
  app.options('*', cors(corsOptions));
  app.use(cors(corsOptions));
  app.use(express.json());

  // Public routes
  app.use('/api/auth', authRouter);

  // Protected API routes
  app.use('/api/accounts', requireAuth, accountsRouter);
  app.use('/api/transactions', requireAuth, transactionsRouter);
  app.use('/api/events', requireAuth, eventsRouter);
  app.use('/api/shopping', requireAuth, shoppingRouter);
  app.use('/api/todos', requireAuth, todosRouter);
  app.use('/api/chat', requireAuth, chatRouter);
  app.use('/api/push', requireAuth, pushRouter);
  app.use('/api/recurring', requireAuth, recurringRouter);
  app.use('/api/rental', requireAuth, rentalRouter);

  // Members endpoint
  app.get('/api/members', requireAuth, async (_req, res) => {
    const db = await getDb();
    res.json(await db.all('SELECT id, name, color, emoji, email, is_admin, (password_hash IS NOT NULL) as has_account FROM members'));
  });

  // Serve client build in production
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  // WebSocket
  const wss = new WebSocketServer({ server, path: '/ws' });
  setupWebSocket(wss);

  server.listen(PORT, () => {
    console.log(`🏠 Mon Foyer - Serveur démarré sur http://localhost:${PORT}`);
    console.log(`🔌 WebSocket sur ws://localhost:${PORT}/ws`);
  });
}

main().catch(err => {
  console.error('Erreur au démarrage :', err);
  process.exit(1);
});
