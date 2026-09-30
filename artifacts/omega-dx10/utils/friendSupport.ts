export const supportId = (username: string) => `friend:${username}`;
export const isSupportId = (id: string) => id.startsWith('friend:');
export const ownBattleTeam = (ids: string[]) => ids.filter((id) => !isSupportId(id)).slice(0, 3);

export function createBattleTeam(ownIds: string[], username?: string, slot = 0) {
  const ids = ownBattleTeam(ownIds);
  if (username) ids.splice(Math.max(0, Math.min(ids.length, Math.min(2, slot))), 0, supportId(username));
  return ids.slice(0, 3);
}

export function chooseBattleSlot(ids: string[], slot: number, id: string | null): string[] {
  const next = [...ids];
  if (id === null) { next.splice(slot, 1); return next; }
  const previousSlot = isSupportId(id) ? next.findIndex(isSupportId) : next.indexOf(id);
  if (previousSlot >= 0 && previousSlot !== slot) next[previousSlot] = next[slot];
  next[slot] = id;
  return next.filter(Boolean).slice(0, 3);
}
