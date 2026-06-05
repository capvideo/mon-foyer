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
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closing = useRef(false);

  // Stable refs so connect() doesn't need them as deps
  const onMessageRef = useRef(onMessage);
  const channelIdRef = useRef(channelId);
  const memberIdRef = useRef(memberId);
  useEffect(() => { onMessageRef.current = onMessage; });
  useEffect(() => { channelIdRef.current = channelId; });
  useEffect(() => { memberIdRef.current = memberId; });

  const connect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = import.meta.env.DEV ? '3001' : window.location.port;
    const url = `${protocol}//${host}:${port}/ws`;

    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      setConnected(true);
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
        reconnectTimer.current = setTimeout(connect, 4000);
      }
    };

    socket.onerror = () => { socket.close(); };
  }, []); // stable — uses refs, no deps

  useEffect(() => {
    closing.current = false;
    connect();
    return () => {
      closing.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
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
