import { WebSocket, WebSocketServer } from 'ws';
import { getDb } from './db/index';

interface WSClient {
  ws: WebSocket;
  memberId: string;
  channelId?: string;
}

const clients = new Set<WSClient>();

export function setupWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    const client: WSClient = { ws, memberId: 'unknown' };
    clients.add(client);

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        const db = await getDb();

        switch (msg.type) {
          case 'auth':
            client.memberId = msg.memberId;
            client.channelId = msg.channelId;
            ws.send(JSON.stringify({ type: 'auth_ok', memberId: msg.memberId }));
            break;

          case 'join_channel':
            client.channelId = msg.channelId;
            ws.send(JSON.stringify({ type: 'joined', channelId: msg.channelId }));
            break;

          case 'message': {
            const { channelId, memberId, content, msgType, metadata } = msg;
            const r = await db.run(
              'INSERT INTO messages (channel_id,member_id,content,type,timestamp,metadata) VALUES (?,?,?,?,?,?)',
              channelId, memberId, content, msgType || 'text',
              new Date().toISOString(), metadata ? JSON.stringify(metadata) : null
            );
            const saved = await db.get('SELECT * FROM messages WHERE id = ?', r.lastID);
            const broadcast = JSON.stringify({ type: 'message', data: saved });
            for (const c of clients) {
              if (c.channelId === channelId && c.ws.readyState === WebSocket.OPEN) {
                c.ws.send(broadcast);
              }
            }
            break;
          }

          case 'typing': {
            const { channelId, memberId } = msg;
            const broadcast = JSON.stringify({ type: 'typing', channelId, memberId });
            for (const c of clients) {
              if (c.channelId === channelId && c.ws !== ws && c.ws.readyState === WebSocket.OPEN) {
                c.ws.send(broadcast);
              }
            }
            break;
          }

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
        }
      } catch (e) {
        console.error('WS error:', e);
      }
    });

    ws.on('close', () => clients.delete(client));
    ws.send(JSON.stringify({ type: 'connected' }));
  });
}
