import type { BaseStats } from '@/constants/gameData';
import type { OwnedCharacter } from '@/context/GameContext';

export const MAX_ASCENSION_STARS = 4;
export const ASCENSION_LEVEL_REQUIREMENT = 60;
export const ASCENSION_STAT_BONUS_PER_STAR = 0.20;
export const GOLDEN_STAR_FRAGMENT_ID = 'piece_golden_ascension_star';
export const GOLDEN_STAR_ITEM_ID = 'golden_ascension_star';
export const GOLDEN_STAR_FRAGMENTS_REQUIRED = 15;

export const ASCENSION_SUCCESS_CHANCE_BY_TARGET_STAR: Record<number, number> = {
  1: 0.70,
  2: 0.45,
  3: 0.25,
  4: 0.25,
};

export const FUSION_SUCCESS_CHANCE_BY_RARITY: Record<string, number> = {
  ULTIMATE: 0.70,
  MEGA: 0.60,
  ULTRA: 0.40,
};

export const YGGDRASIL_BLESSING_BONUS = 0.15;

export function isYggdrasilBlessingActive(date = new Date()): boolean {
  const day = date.getDay();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const minutes = hour * 60 + minute;
  const fridayStart = 18 * 60;
  const sundayEnd = 18 * 60;
  return (day === 5 && minutes >= fridayStart) || day === 6 || (day === 0 && minutes < sundayEnd);
}

export function getYggdrasilBlessingBonus(date = new Date()): number {
  return isYggdrasilBlessingActive(date) ? YGGDRASIL_BLESSING_BONUS : 0;
}

export function getAscensionSuccessChance(targetStars: number, date = new Date()): number {
  return Math.min(1, (ASCENSION_SUCCESS_CHANCE_BY_TARGET_STAR[targetStars] ?? 0) + getYggdrasilBlessingBonus(date));
}

export function getFusionSuccessChance(resultRarity: string, date = new Date()): number {
  const base = FUSION_SUCCESS_CHANCE_BY_RARITY[resultRarity];
  return base === undefined ? 1 : Math.min(1, base + getYggdrasilBlessingBonus(date));
}


// O evento abre durante 48 horas a cada 14 dias. A data é UTC para que todos
// os jogadores vejam exatamente o mesmo calendário, independentemente do fuso.
export const STARRY_NIGHT_CYCLE_MS = 14 * 24 * 60 * 60 * 1000;
export const STARRY_NIGHT_OPEN_MS = 2 * 24 * 60 * 60 * 1000;
export const STARRY_NIGHT_EPOCH_UTC = Date.UTC(2026, 8, 21, 0, 0, 0);

export function getAscensionStars(owned?: Pick<OwnedCharacter, 'ascensionStars'> | null): number {
  return Math.max(0, Math.min(MAX_ASCENSION_STARS, owned?.ascensionStars ?? 0));
}

export function applyAscensionBonus(stats: BaseStats, stars: number): BaseStats {
  const multiplier = 1 + getAscensionStars({ ascensionStars: stars }) * ASCENSION_STAT_BONUS_PER_STAR;
  return {
    hp: Math.floor(stats.hp * multiplier),
    mp: Math.floor(stats.mp * multiplier),
    atk: Math.floor(stats.atk * multiplier),
    def: Math.floor(stats.def * multiplier),
    spt: Math.floor(stats.spt * multiplier),
    spd: Math.floor(stats.spd * multiplier),
    apt: Math.floor(stats.apt * multiplier),
  };
}

export interface StarryNightAvailability {
  isOpen: boolean;
  opensAt: number;
  closesAt: number;
  remainingMs: number;
}

export function getStarryNightAvailability(now = Date.now()): StarryNightAvailability {
  const elapsed = now - STARRY_NIGHT_EPOCH_UTC;
  const normalized = ((elapsed % STARRY_NIGHT_CYCLE_MS) + STARRY_NIGHT_CYCLE_MS) % STARRY_NIGHT_CYCLE_MS;
  const cycleStart = now - normalized;
  const isOpen = normalized < STARRY_NIGHT_OPEN_MS;
  const opensAt = isOpen ? cycleStart : cycleStart + STARRY_NIGHT_CYCLE_MS;
  const closesAt = cycleStart + STARRY_NIGHT_OPEN_MS;
  return {
    isOpen,
    opensAt,
    closesAt,
    remainingMs: isOpen ? Math.max(0, closesAt - now) : Math.max(0, opensAt - now),
  };
}

export function formatLongCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}
