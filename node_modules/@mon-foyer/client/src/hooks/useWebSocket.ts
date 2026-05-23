import { useEffect, useRef, useCallback, useState } from 'react';

interface UseWebSocketOptions {
  onMessage?: (data: any) => void;
  channelId?: string;
  memberId?: string;
}

export function useWebSocket({ onMessage, channelId, memberId }: UseWebSocketOptions) {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState<string[]>([]);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = import.meta.env.DEV ? '3001' : window.location.port;
    const url = `${protocol}//${host}:${port}/ws`;

    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      setConnected(true);
      if (memberId) {
        socket.send(JSON.stringify({ type: 'auth', memberId }));
      }
      if (channelId) {
        socket.send(JSON.stringify({ type: 'join_channel', channelId }));
      }
    };

    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'typing') {
          setTyping(prev => {
            if (!prev.includes(data.memberId)) return [...prev, data.memberId];
            return prev;
          });
          if (typingTimer.current) clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setTyping([]), 2000);
        }
        onMessage?.(data);
      } catch {}
    };

    socket.onclose = () => {
      setConnected(false);
      setTimeout(connect, 3000);
    };

    socket.onerror = () => {
      socket.close();
    };
  }, [channelId, memberId, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      ws.current?.close();
    };
  }, [connect]);

  useEffect(() => {
    if (ws.current?.readyState === WebSocket.OPEN && channelId) {
      ws.current.send(JSON.stringify({ type: 'join_channel', channelId }));
    }
  }, [channelId]);

  const send = useCallback((data: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  const sendMessage = useCallback((channelId: string, content: string, memberId: string, msgType = 'text', metadata?: any) => {
    send({ type: 'message', channelId, memberId, content, msgType, metadata });
  }, [send]);

  const sendTyping = useCallback((channelId: string, memberId: string) => {
    send({ type: 'typing', channelId, memberId });
  }, [send]);

  return { connected, send, sendMessage, sendTyping, typing };
}
