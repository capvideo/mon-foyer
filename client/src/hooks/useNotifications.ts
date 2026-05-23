import { useCallback } from 'react';
import { api } from '../utils/api';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

export function useNotifications() {
  const isSupported = 'Notification' in window && 'serviceWorker' in navigator;

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, [isSupported]);

  const subscribe = useCallback(async (memberId: string): Promise<boolean> => {
    if (!isSupported) return false;
    try {
      const permission = await requestPermission();
      if (!permission) return false;

      const reg = await navigator.serviceWorker.ready;
      const { key } = await api.getVapidKey();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      await api.subscribePush(memberId, sub.toJSON());
      return true;
    } catch (e) {
      console.error('Push subscribe error:', e);
      return false;
    }
  }, [isSupported, requestPermission]);

  const notify = useCallback((title: string, body: string, icon?: string) => {
    if (!isSupported || Notification.permission !== 'granted') return;
    new Notification(title, {
      body,
      icon: icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    });
  }, [isSupported]);

  return { isSupported, requestPermission, subscribe, notify };
}
