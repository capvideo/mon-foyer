import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { WebSocketServer } from 'ws';

import { initDb, getDb } from './db/index';
import { setupWebSocket } from './websocket';

import accountsRouter from './routes/accounts';
import transactionsRouter from './routes/transactions';
import eventsRouter from './routes/events';
import shoppingRouter from './routes/shopping';
import todosRouter from './routes/todos';
import chatRouter from './routes/chat';
import pushRouter from './routes/push';

const PORT = process.env.PORT || 3001;

async function main() {
  await initDb();

  const app = express();
  const server = http.createServer(app);

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : ['http://localhost:5173'];
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json());

  // API routes
  app.use('/api/accounts', accountsRouter);
  app.use('/api/transactions', transactionsRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/shopping', shoppingRouter);
  app.use('/api/todos', todosRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/push', pushRouter);

  // Members endpoint
  app.get('/api/members', async (_req, res) => {
    const db = await getDb();
    res.json(await db.all('SELECT * FROM members'));
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
