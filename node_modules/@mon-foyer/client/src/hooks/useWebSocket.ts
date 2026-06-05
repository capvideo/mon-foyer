import { useEffect, useRef, useCallback, useState } from 'react';

interface UseWebSocketOptions {
  onMessage?: (data: any) => void;
  channelId?: string;
  memberId?: string;
}

function getWsUrl(): string {
  if (import.meta.env.DEV) return 'ws://localhost:3001/ws';
  // Derive WS URL from the API base URL — avoids the empty-port bug (wss://host:/ws)
  const apiBase = (import.meta.env.VITE_API_URL as string | undefined) || window.location.origin;
  return apiBase.replace(/^http/, 'ws') + '/ws';
}

export function useWebSocket({ onMessage, channelId, memberId }: UseWebSocketOptions) {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState<string[]>([]);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closing = useRef(false);
  const retryCount = useRef(0);

  // Stable refs — keeps connect() dependency-free
  const onMessageRef = useRef(onMessage);
  const channelIdRef = useRef(channelId);
  const memberIdRef = useRef(memberId);
  useEffect(() => { onMessageRef.current = onMessage; });
  useEffect(() => { channelIdRef.current = channelId; });
  useEffect(() => { memberIdRef.current = memberId; });

  const connect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    // Don't open a second socket while one is already open/connecting
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) return;

    const socket = new WebSocket(getWsUrl());
    ws.current = socket;

    socket.onopen = () => {
      setConnected(true);
      retryCount.current = 0;
      if (memberIdRef.current) socket.send(JSON.stringify({ type: 'auth', memberId: memberIdRef.current }));
      if (channelIdRef.current) socket.send(JSON.stringify({ type: 'join_channel', channelId: channelIdRef.current }));
    };

    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'typing') {
          setTyping(prev => prev.includes(data.memberId) ? prev : [...prev, data.memberId]);
          if (typingTimer.current) clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setTyping([]), 2000);
        }
        onMessageRef.current?.(data);
      } catch {}
    };

    socket.onclose = () => {
      setConnected(false);
      if (!closing.current) {
        // Exponential backoff: 2s, 4s, 8s, capped at 30s
        const delay = Math.min(2000 * 2 ** retryCount.current, 30000);
        retryCount.current += 1;
        reconnectTimer.current = setTimeout(connect, delay);
      }
    };

    socket.onerror = () => { socket.close(); };
  }, []);

  useEffect(() => {
    closing.current = false;
    connect();
    return () => {
      closing.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  // Reconnect when the page becomes visible again (mobile background → foreground)
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === 'visible' && !closing.current) {
        retryCount.current = 0;
        connect();
      }
    };
    document.addEventListener('visibilitychange', handleVisible);
    return () => document.removeEventListener('visibilitychange', handleVisible);
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
