import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';

const SYNC_DEBOUNCE = 10_000;
const SAVE_KEY_PREFIX = 'omega_dx10_save_v3';

function getSaveKey(userId: number | null | undefined): string {
  return `${SAVE_KEY_PREFIX}:${userId ?? 'guest'}`;
}

async function pushSaveToServer(apiUrl: string, token: string, saveKey: string): Promise<void> {
  const raw = await AsyncStorage.getItem(saveKey);
  if (!raw) return;
  const saveData = JSON.parse(raw);

  // Safety barrier: never upload a blank/default state over a real cloud save.
  // A legitimate player save has at least one durable progress marker.
  const meaningful = Boolean(
    saveData?.isOnboarded
    || (typeof saveData?.playerName === 'string' && saveData.playerName.trim().length > 0)
    || (Array.isArray(saveData?.collection) && saveData.collection.length > 0)
    || (Array.isArray(saveData?.team) && saveData.team.length > 0)
    || ((saveData?.tamerLevel ?? 1) > 1)
    || ((saveData?.tamerExp ?? 0) > 0)
    || ((saveData?.bits ?? 0) > 0)
    || ((saveData?.gemas ?? 1000) !== 1000)
    || (saveData?.clearedStages && Object.keys(saveData.clearedStages).length > 0)
  );
  if (!meaningful) return;

  await fetch(`${apiUrl}/saves`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ saveData }),
  });
}

export function useCloudSync() {
  const { token, user, getApiUrl } = useAuth();
  const saveKey = getSaveKey(user?.id);
  const { collection, tamerLevel, tamerExp, playerName, team, tamerId, messages, clearedStages, loadFromCloud } = useGame();
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
  }, [token, saveKey]);

  const claimedCount = messages.filter((m) => m.rewardClaimed).length;
  const clearedCount = Object.keys(clearedStages).length;

  useEffect(() => {
    const tok = tokenRef.current;
    if (!tok) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const currentTok = tokenRef.current;
      if (!currentTok) return;
      try {
        await pushSaveToServer(getApiUrlRef.current(), currentTok, saveKey);
      } catch {}
    }, SYNC_DEBOUNCE);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection.length, tamerLevel, tamerExp, playerName, team.length, tamerId, token, saveKey, claimedCount, clearedCount]);

  return { saveNow: () => {
    const tok = tokenRef.current;
    if (!tok) return;
    pushSaveToServer(getApiUrlRef.current(), tok, saveKey).catch(() => {});
  }};
}
