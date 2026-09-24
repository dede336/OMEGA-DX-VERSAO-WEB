import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';

const SYNC_DEBOUNCE = 1_500;

function isMeaningfulSave(saveData: Record<string, any> | null | undefined): boolean {
  if (!saveData) return false;
  return Boolean(
    saveData.isOnboarded
    || (typeof saveData.playerName === 'string' && saveData.playerName.trim().length > 0)
    || (Array.isArray(saveData.collection) && saveData.collection.length > 0)
    || (Array.isArray(saveData.team) && saveData.team.length > 0)
    || ((saveData.tamerLevel ?? 1) > 1)
    || ((saveData.tamerExp ?? 0) > 0)
    || ((saveData.bits ?? 0) > 0)
    || ((saveData.gemas ?? 1000) !== 1000)
    || (saveData.clearedStages && Object.keys(saveData.clearedStages).length > 0)
  );
}

async function pushSaveToServer(apiUrl: string, token: string, saveData: Record<string, any>, keepalive = false): Promise<void> {
  if (!isMeaningfulSave(saveData)) return;

  // Safety barrier: never upload a blank/default state over a real cloud save.
  // A legitimate player save has at least one durable progress marker.
  await fetch(`${apiUrl}/saves`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ saveData: { ...saveData, _savedAt: Date.now() } }),
    ...(keepalive ? { keepalive: true } : {}),
  });
}

export function useCloudSync() {
  const { token, user, getApiUrl } = useAuth();
  const { collection, tamerLevel, tamerExp, playerName, team, tamerId, messages, clearedStages, loadFromCloud, isLoaded, getSaveSnapshot } = useGame();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef = useRef(token);
  const getApiUrlRef = useRef(getApiUrl);
  const lastLoadedTokenRef = useRef<string | null>(null);

  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { getApiUrlRef.current = getApiUrl; }, [getApiUrl]);

  // Ao abrir o app com sessão ativa, busca o save do servidor imediatamente
  useEffect(() => {
    if (!token) {
      lastLoadedTokenRef.current = null;
      return;
    }
    if (lastLoadedTokenRef.current === token) return;
    lastLoadedTokenRef.current = token;
    loadFromCloud(getApiUrl());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const claimedCount = messages.filter((m) => m.rewardClaimed).length;
  const clearedCount = Object.keys(clearedStages).length;

  useEffect(() => {
    const tok = tokenRef.current;
    if (!tok || !user?.id || !isLoaded) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const currentTok = tokenRef.current;
      if (!currentTok || !user?.id || !isLoaded) return;
      try {
        await pushSaveToServer(getApiUrlRef.current(), currentTok, getSaveSnapshot());
      } catch {}
    }, SYNC_DEBOUNCE);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection.length, tamerLevel, tamerExp, playerName, team.length, tamerId, token, user?.id, isLoaded, claimedCount, clearedCount, getSaveSnapshot]);

  // A hard reload can happen before the debounce expires. On the web, flush
  // the current in-memory account state while the page is being discarded so
  // clearing browser cache cannot erase a save that was never uploaded.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const flushBeforePageHide = () => {
      const currentTok = tokenRef.current;
      if (!currentTok || !user?.id || !isLoaded) return;
      const snapshot = getSaveSnapshot();
      if (!isMeaningfulSave(snapshot)) return;
      void pushSaveToServer(getApiUrlRef.current(), currentTok, snapshot, true).catch(() => {});
    };

    window.addEventListener('pagehide', flushBeforePageHide);
    return () => window.removeEventListener('pagehide', flushBeforePageHide);
  }, [user?.id, isLoaded, getSaveSnapshot]);

  return { saveNow: () => {
    const tok = tokenRef.current;
    if (!tok || !user?.id || !isLoaded) return;
    pushSaveToServer(getApiUrlRef.current(), tok, getSaveSnapshot()).catch(() => {});
  }};
}
