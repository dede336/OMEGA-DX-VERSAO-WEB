import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState, useMemo } from 'react';
import {
  CHARACTERS, EVOLUTIONS, ALTERNATE_EVOLUTIONS, EXTRA_ALTERNATE_EVOLUTIONS, FORM_CHANGES, FORM_CHANGE_MIN_LEVEL, FUSIONS, GAME_MAPS, expToNextLevel, tamerExpToNextLevel, CODEX_ORDER,
  EquipSlot, TamerGender, EQUIP_SLOTS_ORDER, DEFAULT_INVENTORY,
  CRAFT_RECIPES, CraftRecipe,
  SACRIFICE_DROPS, ROOKIE_OF, SACRIFICE_SCAN_OVERRIDES, SACRIFICE_SCAN_PCT,
  PRE_ROOKIE_STAGE_RARITIES,
  EquipItem, GameMap, CARD_DEFINITIONS, CARD_IDS,
} from '@/constants/gameData';
import { loadCustomCharacters, getCharacter, loadCharacterOverrides, getFarmEvolutionTarget, getRandomHatchTarget, findCharacterIdByName, getKnownCharacterName, migrateLegacyCharacterId } from '@/constants/extendedCharacters';
import { isAsfalto, isNeighborPos, resolveAsfaltoMeta, snapAsfalto, ASFALTO_GRID } from '@/utils/asfaltoAutoConnect';
import { loadCustomItems, getCustomEquipmentItems } from '@/constants/extendedItems';
import { loadCustomMaps, getCustomGameMaps } from '@/constants/extendedMaps';
import {
  ASCENSION_LEVEL_REQUIREMENT,
  GOLDEN_STAR_FRAGMENT_ID,
  GOLDEN_STAR_FRAGMENTS_REQUIRED,
  GOLDEN_STAR_ITEM_ID,
  getAscensionStars,
  getAscensionSuccessChance,
  getFusionSuccessChance,
  getStarryNightAvailability,
} from '@/utils/ascension';

export interface SacrificeResult {
  droppedItem: string | null;
  scanGained: { characterId: string; amount: number } | null;
}

export interface MailReward {
  bits?: number;
  items?: Array<string | { itemId: string; amount: number }>;
  digimon?: string[];
  digimonWithLevel?: { characterId: string; level: number }[];
  pieces?: Record<string, number>;
  decoration?: string[];
}

export interface FarmDecoration {
  id: string;
  type: string;
  x: number;
  y: number;
  mirrored: boolean;
  rotation?: 0 | 90 | 180 | 270;
}

export interface MailMessage {
  id: string;
  title: string;
  body: string;
  reward?: MailReward;
  rewardClaimed: boolean;
  isRead: boolean;
  createdAt: number;
  unlocksAtTamerLevel?: number;
}

export interface OwnedCharacter {
  ownedId: string;
  characterId: string;
  level: number;
  exp: number;
  ascensionStars?: number;
  acquisitionMethod?: 'fusion' | 'evolution';
  mailGiftId?: 'guilmon_gift_v1' | 'agumon_saver_gift_v1';
}

export interface AscensionResult {
  success: boolean;
  message: string;
}

export interface CardUseResult {
  success: boolean;
  message: string;
}

export interface DigiviceTemporaryCardBuff {
  cardId: string;
  expiresAt: number;
}

type EquippedItems = Record<EquipSlot, string | null>;

const defaultEquipped: EquippedItems = {
  blusa: null, calca: null, sapato: null,
  brasao: null, digivice: null, pulseira: null, oculos: null,
};

const DEFAULT_MESSAGES: MailMessage[] = [
  {
    id: 'welcome_v1',
    title: 'Bem-vindo ao OMEGA DX10!',
    body: 'Olá, Tamer! Sua jornada pelo Mundo Digital começa agora. Aqui você receberá recompensas especiais do administrador. Boa sorte em suas batalhas!',
    reward: { bits: 500 },
    rewardClaimed: false,
    isRead: false,
    createdAt: 1716000000000,
  },
  {
    id: 'guilmon_gift_v1',
    title: 'Presente de Nível 5 — Guilmon!',
    body: 'Parabéns por atingir o Tamer Rank 5! Como recompensa especial, você recebe o Guilmon — um dinossauro do tipo Vírus com chamas poderosas e uma linha evolutiva incrível. Boa sorte nas batalhas!',
    reward: { digimon: ['guilmon'] },
    rewardClaimed: false,
    isRead: false,
    createdAt: 1716000001000,
    unlocksAtTamerLevel: 5,
  },
  {
    id: 'agumon_saver_gift_v1',
    title: 'Presente de Nível 10 — Agumon (Saber)!',
    body: 'Incrível, Tamer Rank 10! Você provou seu valor no Mundo Digital. Como reconhecimento especial, você recebe o Agumon (Saber) — a versão aprimorada do clássico Agumon do Tamer Masaru. Com seu tipo Vacina e golpes poderosos, ele será um parceiro formidável nas masmorras avançadas!',
    reward: { digimon: ['agumonSaver'] },
    rewardClaimed: false,
    isRead: false,
    createdAt: 1716000002000,
    unlocksAtTamerLevel: 10,
  },
  {
    id: 'angel_batch_gift_v2',
    title: 'Reforço Angelical — Pacote Especial!',
    body: 'Um pacote de reforço foi enviado para o seu Digivice! Você recebeu 1× Angemon, 1× Devimon e 20× Bateria Azul. Use as baterias para turbinar o nível dos seus Digimons na tela de status. Boa sorte, Tamer!',
    reward: {
      digimon: ['angemon', 'devimon'],
      pieces: { piece_battery_blue: 20 },
    },
    rewardClaimed: false,
    isRead: false,
    createdAt: 1748100000000,
  },
  {
    id: 'farm_house_v1',
    title: '🏠 Decoração Desbloqueada — Casa!',
    body: 'Parabéns por atingir o Tamer Rank 5! Você ganhou a Casa da DigiFarm. Acesse a aba "Decoração" na DigiFarm, toque na Casa e posicione-a onde quiser no campo. Ela é sólida — seus Digimons desviarão dela!',
    reward: { decoration: ['house'] },
    rewardClaimed: false,
    isRead: false,
    createdAt: 1716000000900,
    unlocksAtTamerLevel: 5,
  },
];

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export type GachaRarity = 'Rookie' | 'Especial' | 'Champion' | 'EGG';

export interface GachaReward {
  characterId: string;
  raridade: GachaRarity;
  nome?: string;
  tipo?: 'DIGIMON' | 'ITEM' | 'FRAGMENTO';
}

export interface GachaPoolEntry {
  id: string;
  nome: string;
  tipo: 'DIGIMON' | 'ITEM' | 'FRAGMENTO';
  characterId?: string;
  raridade: GachaRarity;
}

interface GameState {
  playerName: string;
  gender: TamerGender;
  tamerId: string | null;
  isOnboarded: boolean;
  isAdmin: boolean;
  collection: OwnedCharacter[];
  clearedStages: Record<string, boolean>;
  selectedOwnedId: string | null;
  team: string[];
  scanProgress: Record<string, number>;
  inventory: string[];
  equippedItems: EquippedItems;
  pieces: Record<string, number>;
  bits: number;
  gemas: number;
  gachaContadorPity: number;
  ultimoTiroGratis: string | null;
  tamerExp: number;
  tamerLevel: number;
  messages: MailMessage[];
  lastDailyDate: string;
  farmSlots: string[];
  farmLastClaim: number;
  farmEntryTimes: Record<string, number>;
  farmFoods: Record<string, number>;
  farmLastFeed: Record<string, number>;
  farmBattleRequests: Record<string, { requestedAt: number; nextRequestAt: number; fulfilled: boolean }>;
  farmDailyRewardClaim: string;
  farmWeeklyRewardClaim: number;
  farmDecorations: FarmDecoration[];
  farmDecorInventory: Record<string, number>;
  bossCooldowns: Record<string, number>;
  starryNightClaimCycle: string;
  digiviceCards: Record<string, string[]>;
  digiviceTemporaryCards: Record<string, { ascension?: DigiviceTemporaryCardBuff; fusion?: DigiviceTemporaryCardBuff }>;
}

interface GameContextValue extends GameState {
  isLoaded: boolean;
  selectedCharacter: OwnedCharacter | null;
  customEquipItems: EquipItem[];
  customGameMaps: (GameMap & { backgroundImageUri?: string })[];
  completeOnboarding: (name: string, gender: TamerGender, tamerId: string) => void;
  addToCollection: (characterId: string) => void;
  gainExp: (ownedId: string, amount: number) => void;
  clearStage: (mapId: string, stageIndex: number) => void;
  setSelectedCharacter: (ownedId: string) => void;
  setPlayerName: (name: string) => void;
  isStageCleared: (mapId: string, stageIndex: number) => boolean;
  isMapUnlocked: (mapId: string) => boolean;
  gainScan: (characterId: string, amount: number) => void;
  createFromScan: (characterId: string) => void;
  evolveDigimon: (ownedId: string, alternate?: boolean, sacrificeOwnedId?: string, alternate2?: boolean, selectedItemId?: string) => boolean;
  changeFormDigimon: (ownedId: string) => void;
  fuseDigimon: (keepOwnedId: string, sacrificeOwnedId: string | string[], resultId?: string, selectedItemId?: string) => boolean;
  sacrificeDigimon: (ownedId: string) => SacrificeResult;
  totalPlayerLevel: number;
  setGender: (g: TamerGender) => void;
  equipItem: (slot: EquipSlot, itemId: string) => void;
  unequipItem: (slot: EquipSlot) => void;
  totalEquipBonus: () => Partial<Record<string, number>>;
  gainPiece: (pieceId: string, amount?: number) => void;
  craftItem: (recipe: CraftRecipe) => boolean;
  applyCardToDigivice: (cardId: string, digiviceId: string) => CardUseResult;
  gainBits: (amount: number) => void;
  gainTamerExp: (amount: number) => void;
  useTamerXpItem: (itemId: string, quantity: number) => void;
  gainGemas: (amount: number) => void;
  addToInventory: (itemId: string) => void;
  unreadMailCount: number;
  readMessage: (id: string) => void;
  claimReward: (id: string) => void;
  useXpItem: (ownedId: string, batteryId: string, qty: number) => void;
  ascendDigimon: (baseOwnedId: string, sacrificeOwnedId: string) => AscensionResult;
  craftGoldenAscensionStar: () => boolean;
  claimStarryNightReward: () => boolean;
  setTeam: (ownedIds: string[]) => void;
  getSaveSnapshot: () => GameState;
  loadFromCloud: (apiUrl: string) => Promise<void>;
  refreshCustomData: (apiUrl: string) => Promise<void>;
  isDailyDungeonAvailable: boolean;
  claimDailyDungeon: () => void;
  setFarmSlots: (slots: string[], resetTime?: boolean) => void;
  processFarmEvolutions: () => void;
  addFarmFood: (foodId: string, qty: number) => void;
  feedFarmDigimon: (ownedId: string, foodId: string) => boolean;
  completeFarmBattle: () => void;
  gainFarmDecor: (decorType: string, amount?: number) => void;
  generateFarmBattleRequests: () => void;
  claimFarmDailyReward: () => { type: string; label: string } | null;
  placeFarmDecoration: (type: string, x: number, y: number) => void;
  moveFarmDecoration: (id: string, x: number, y: number) => void;
  mirrorFarmDecoration: (id: string) => void;
  removeFarmDecoration: (id: string) => void;
  placeAsfaltoAutoConnect: (type: string, x: number, y: number) => void;
  moveAsfaltoAutoConnect: (id: string, x: number, y: number) => void;
  setBossCooldown: (mapId: string, stageIdx: number) => void;
  isBossOnCooldown: (mapId: string, stageIdx: number) => boolean;
  realizarTiroGacha: (quantidade: 1 | 10) => { mensagem: string; recompensas: GachaReward[]; custoGemas: number } | null;
  isTiroGratisDisponivel: boolean;
  gachaAdminPool: GachaPoolEntry[] | null;
  setGachaAdminPool: (pool: GachaPoolEntry[] | null) => void;
  setTamerId: (id: string) => void;
  resetGame: () => Promise<void>;
  customCharsRevision: number;
  customCharsReady: boolean;
}

const STORAGE_KEY_PREFIX = 'omega_dx10_save_v3';

function getStorageKey(userId: number | null | undefined): string {
  return `${STORAGE_KEY_PREFIX}:${userId ?? 'guest'}`;
}

const DEFAULT_FARM_DECOR_INVENTORY: Record<string, number> = {
  asfalto_curva1: 2,
  asfalto_curva2: 2,
  asfalto_curva3: 2,
  asfalto_curva4: 2,
  asfalto_h1: 3,
  asfalto_h2: 3,
  asfalto_v1: 3,
  asfalto_v2: 3,
  asfalto_t: 2,
};

function mergeDefaultDecorInventory(saved: Record<string, number>): Record<string, number> {
  const merged = { ...saved };
  for (const [key, qty] of Object.entries(DEFAULT_FARM_DECOR_INVENTORY)) {
    if (merged[key] === undefined) {
      merged[key] = qty;
    }
  }
  return merged;
}

function migrateOwnedCharacter(owned: OwnedCharacter): OwnedCharacter {
  if (owned.characterId === 'lucemonChaosMode' && !owned.acquisitionMethod && !owned.ownedId.toLowerCase().includes('lucemon')) {
    return { ...owned, acquisitionMethod: 'fusion' };
  }
  return owned;
}

export function migrateEvolutionItemId(item: unknown): string {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object') {
    const value = item as Record<string, unknown>;
    const candidate = value.itemId ?? value.id ?? value.resultItemId;
    if (typeof candidate === 'string') return candidate;
    if (candidate && typeof candidate === 'object') return migrateEvolutionItemId(candidate);
  }
  return String(item ?? '');
}

export function migrateEvolutionPieceId(pieceId: string): string {
  return pieceId;
}

function migrateEvolutionInventory(inventory: unknown[]): string[] {
  return inventory
    .map(migrateEvolutionItemId)
    .filter((id) => id.length > 0 && id !== '[object Object]');
}

function normalizeMailItemEntry(entry: unknown): { itemId: string; amount: number } | null {
  if (typeof entry === 'string') {
    const itemId = migrateEvolutionItemId(entry);
    return itemId && itemId !== '[object Object]' ? { itemId, amount: 1 } : null;
  }
  if (!entry || typeof entry !== 'object') return null;
  const value = entry as Record<string, unknown>;
  const itemId = migrateEvolutionItemId(value.itemId ?? value.id ?? value.resultItemId ?? entry);
  if (!itemId || itemId === '[object Object]') return null;
  return { itemId, amount: Math.max(1, Math.floor(Number(value.amount) || 1)) };
}

function migrateEvolutionPieces(pieces: Record<string, number>): Record<string, number> {
  const migrated: Record<string, number> = {};
  for (const [pieceId, amount] of Object.entries(pieces)) {
    const newId = migrateEvolutionPieceId(pieceId);
    migrated[newId] = (migrated[newId] ?? 0) + amount;
  }
  return migrated;
}

const TWO_STAR_MAIL_GIFTS: Record<string, string> = {
  guilmon_gift_v1: 'guilmon',
  agumon_saver_gift_v1: 'agumonSaver',
};

const TWO_STAR_MAIL_GIFT_LINES: Record<string, string[]> = {
  guilmon_gift_v1: ['guilmon', 'growlmon', 'megaloGrowlmon', 'gallantmon', 'gallantmonCrimsonMode'],
  agumon_saver_gift_v1: ['agumonSaver', 'geoGreymon', 'rizeGreymon', 'shineGreymon', 'shineGreymonBurstMode'],
};

export function getMailGiftAscensionStars(messageId: string, characterId: string): number {
  return TWO_STAR_MAIL_GIFTS[messageId] === characterId ? 2 : 0;
}

function preserveMailGiftStars(owned: OwnedCharacter): Pick<OwnedCharacter, 'ascensionStars' | 'mailGiftId'> {
  return { ascensionStars: owned.ascensionStars, mailGiftId: owned.mailGiftId };
}

function resolveFusionStars(
  owned: OwnedCharacter,
  sacrifices: OwnedCharacter[],
): Pick<OwnedCharacter, 'ascensionStars' | 'mailGiftId'> {
  // Fusion never preserves the highest-star component. The resulting Digimon
  // inherits the LOWEST ascension among every Digimon consumed by the fusion.
  // Example: 1★ + 0★ => 0★.
  const lowestStars = Math.min(
    getAscensionStars(owned),
    ...sacrifices.map((sacrifice) => getAscensionStars(sacrifice)),
  );
  return {
    ascensionStars: lowestStars,
    mailGiftId: owned.mailGiftId && lowestStars > 0 ? owned.mailGiftId : undefined,
  };
}

function migrateClaimedMailGiftStars(
  collection: OwnedCharacter[],
  messages: MailMessage[],
): OwnedCharacter[] {
  const migrated = collection.map(migrateOwnedCharacter);

  for (const message of messages) {
    if (!message.rewardClaimed) continue;
    const giftLine = TWO_STAR_MAIL_GIFT_LINES[message.id];
    if (!giftLine) continue;

    // O prêmio é acrescentado ao fim da coleção no resgate. Para saves antigos,
    // corrige uma única cópia (a mais recente) sem alterar outras obtidas no jogo.
    for (let index = migrated.length - 1; index >= 0; index -= 1) {
      const owned = migrated[index];
      if (!giftLine.includes(owned.characterId)) continue;
      migrated[index] = {
        ...owned,
        ascensionStars: Math.max(2, owned.ascensionStars ?? 0),
        mailGiftId: message.id as OwnedCharacter['mailGiftId'],
      };
      break;
    }
  }

  return migrated;
}

const defaultState: GameState = {
  playerName: '',
  gender: 'M',
  tamerId: null,
  isOnboarded: false,
  isAdmin: false,
  collection: [{ ownedId: 'owned_agumon_0', characterId: 'agumon', level: 1, exp: 0 }],
  clearedStages: {},
  selectedOwnedId: 'owned_agumon_0',
  team: [],
  scanProgress: {},
  inventory: DEFAULT_INVENTORY,
  equippedItems: defaultEquipped,
  pieces: {},
  bits: 0,
  gemas: 1000,
  gachaContadorPity: 0,
  ultimoTiroGratis: null,
  tamerExp: 0,
  tamerLevel: 1,
  messages: DEFAULT_MESSAGES,
  lastDailyDate: '',
  farmSlots: [],
  farmLastClaim: Date.now(),
  farmEntryTimes: {},
  farmFoods: {},
  farmLastFeed: {},
  farmBattleRequests: {},
  farmDailyRewardClaim: '',
  farmWeeklyRewardClaim: 0,
  farmDecorations: [],
  farmDecorInventory: { ...DEFAULT_FARM_DECOR_INVENTORY },
  bossCooldowns: {},
  starryNightClaimCycle: '',
  digiviceCards: {},
  digiviceTemporaryCards: {},
};

export const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const storageKey = getStorageKey(user?.id);
  const [state, setState] = useState<GameState>(defaultState);
  const stateRef = useRef<GameState>(defaultState);
  const [loaded, setLoaded] = useState(false);
  const activeUserIdRef = useRef<number | null>(user?.id ?? null);
  const [customEquipItems, setCustomEquipItems] = useState<EquipItem[]>([]);
  const [customGameMaps, setCustomGameMaps] = useState<(GameMap & { backgroundImageUri?: string })[]>([]);
  const [gachaAdminPool, setGachaAdminPool] = useState<GachaPoolEntry[] | null>(null);
  const gachaAdminPoolRef = useRef<GachaPoolEntry[] | null>(null);
  const [customCharsRevision, setCustomCharsRevision] = useState(0);
  const [customCharsReady, setCustomCharsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);

    // Account isolation: when authentication changes, immediately discard the
    // previous account's in-memory game state. Without this, a newly logged-in
    // account can temporarily render another player's Tamer/save while /saves loads.
    const nextUserId = user?.id ?? null;
    if (activeUserIdRef.current !== nextUserId) {
      activeUserIdRef.current = nextUserId;
      stateRef.current = defaultState;
      setState(defaultState);
    }

    // Authenticated accounts are cloud-authoritative. Do not hydrate a stale
    // browser save before /saves finishes, otherwise onboarding/default state
    // can render and autosave before the recovered cloud state arrives.
    if (user?.id) {
      return () => { cancelled = true; };
    }
    // IMPORTANT: do not clear the current in-memory state before the persisted
    // save has been read. A transient auth/storage delay must never create a
    // default save that can later be synchronized over real player progress.
    AsyncStorage.getItem(storageKey).then((raw) => {
      if (cancelled) return;
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<GameState & { playerName?: string; _savedAt?: number }>;
          const hadPreviousSave = !!parsed.playerName && parsed.playerName !== '';
          const savedMessages: MailMessage[] = parsed.messages ?? [];
          const savedIds = new Set(savedMessages.map((m) => m.id));
          const merged = [
            ...DEFAULT_MESSAGES.filter((m) => !savedIds.has(m.id)),
            ...savedMessages,
          ].sort((a, b) => b.createdAt - a.createdAt);
          setState({
            ...defaultState,
            ...parsed,
            collection: migrateClaimedMailGiftStars(
              parsed.collection ?? defaultState.collection,
              merged,
            ),
            scanProgress: parsed.scanProgress ?? {},
            gender: parsed.gender ?? 'M',
            inventory: migrateEvolutionInventory(parsed.inventory ?? DEFAULT_INVENTORY),
            equippedItems: { ...defaultEquipped, ...(parsed.equippedItems ?? {}) },
            pieces: migrateEvolutionPieces(parsed.pieces ?? {}),
            bits: parsed.bits ?? 0,
            tamerExp: parsed.tamerExp ?? 0,
            tamerLevel: parsed.tamerLevel ?? 1,
            tamerId: parsed.tamerId ?? null,
            isOnboarded: parsed.isOnboarded ?? hadPreviousSave,
            team: parsed.team ?? [],
            messages: merged,
            farmSlots: parsed.farmSlots ?? [],
            farmLastClaim: parsed.farmLastClaim ?? Date.now(),
            farmEntryTimes: (parsed as any).farmEntryTimes ?? {},
            farmFoods: (parsed as any).farmFoods ?? {},
            farmLastFeed: (parsed as any).farmLastFeed ?? {},
            farmBattleRequests: (parsed as any).farmBattleRequests ?? {},
            farmDailyRewardClaim: (parsed as any).farmDailyRewardClaim ?? '',
            farmWeeklyRewardClaim: (parsed as any).farmWeeklyRewardClaim ?? 0,
            farmDecorations: (parsed as any).farmDecorations ?? [],
            farmDecorInventory: mergeDefaultDecorInventory((parsed as any).farmDecorInventory ?? {}),
            bossCooldowns: (parsed as any).bossCooldowns ?? {},
            starryNightClaimCycle: (parsed as any).starryNightClaimCycle ?? '',
            gemas: (parsed as any).gemas ?? 1000,
            gachaContadorPity: (parsed as any).gachaContadorPity ?? 0,
            ultimoTiroGratis: (parsed as any).ultimoTiroGratis ?? null,
          });
        } catch {
          // Corrupt/unreadable local data must not reset a live player state.
          // Keep the current state and let cloud recovery try to restore it.
        }
      }
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [storageKey]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    gachaAdminPoolRef.current = gachaAdminPool;
  }, [gachaAdminPool]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cloud sync and page-hide handlers must read the latest state directly.
  // Reading AsyncStorage there can return the previous snapshot while the
  // debounced local-save effect is still waiting to run.
  const getSaveSnapshot = useCallback(() => stateRef.current, []);

  const isMeaningfulSave = useCallback((candidate: Partial<GameState> | null | undefined): boolean => {
    if (!candidate) return false;
    return Boolean(
      candidate.isOnboarded
      || (candidate.playerName && candidate.playerName.trim().length > 0)
      // A single starter Digimon is the default/reset state, not durable progress.
      || (candidate.collection && candidate.collection.length > 1)
      || (candidate.team && candidate.team.length > 0)
      || ((candidate.tamerLevel ?? 1) > 1)
      || ((candidate.tamerExp ?? 0) > 0)
      || ((candidate.bits ?? 0) > 0)
      || ((candidate.gemas ?? 1000) !== 1000)
      || (candidate.clearedStages && Object.keys(candidate.clearedStages).length > 0)
    );
  }, []);
  useEffect(() => {
    if (!loaded) return;
    // Repair legacy/admin-mail inventory entries that were accidentally persisted as objects.
    setState((prev) => {
      const normalized = migrateEvolutionInventory(prev.inventory as unknown[]);
      const alreadyCanonical = normalized.length === prev.inventory.length
        && normalized.every((id, index) => id === prev.inventory[index]);
      return alreadyCanonical ? prev : { ...prev, inventory: normalized };
    });
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      // Never overwrite an existing meaningful save with a default/empty state.
      if (!isMeaningfulSave(state)) {
        const existingRaw = await AsyncStorage.getItem(storageKey);
        if (existingRaw) {
          try {
            const existing = JSON.parse(existingRaw) as Partial<GameState>;
            if (isMeaningfulSave(existing)) return;
          } catch {
            return;
          }
        }
      }
      await AsyncStorage.setItem(storageKey, JSON.stringify({ ...state, _savedAt: Date.now() }));
    }, 2000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state, loaded, storageKey, isMeaningfulSave]);


  const addToCollection = useCallback((characterId: string) => {
    setState((prev) => {
      const limit = prev.isAdmin ? 5000 : 500;
      if (prev.collection.length >= limit) return prev;
      const ownedId = `owned_${characterId}_${Date.now()}`;
      const newChar: OwnedCharacter = { ownedId, characterId, level: 1, exp: 0, ascensionStars: 0 };
      return { ...prev, collection: [...prev.collection, newChar] };
    });
  }, []);

  const gainExp = useCallback((ownedId: string, amount: number) => {
    setState((prev) => {
      const updated = prev.collection.map((c) => {
        if (c.ownedId !== ownedId) return c;
        let { exp, level } = c;
        if (level >= 100) return { ...c, level: 100, exp: 0 };
        exp += amount;
        while (level < 100 && exp >= expToNextLevel(level)) {
          exp -= expToNextLevel(level);
          level += 1;
        }
        if (level >= 100) { level = 100; exp = 0; }
        return { ...c, exp, level };
      });
      return { ...prev, collection: updated };
    });
  }, []);

  const clearStage = useCallback((mapId: string, stageIndex: number) => {
    const key = `${mapId}-${stageIndex}`;
    setState((prev) => {
      if (prev.clearedStages[key]) return prev;
      const clearedStages = { ...prev.clearedStages, [key]: true };
      return { ...prev, clearedStages };
    });
  }, []);

  const gainScan = useCallback((characterId: string, amount: number) => {
    setState((prev) => {
      const current = prev.scanProgress[characterId] ?? 0;
      if (current >= 100) return prev;
      const next = Math.min(100, current + amount);
      return { ...prev, scanProgress: { ...prev.scanProgress, [characterId]: next } };
    });
  }, []);

  const createFromScan = useCallback((characterId: string) => {
    setState((prev) => {
      const scan = prev.scanProgress[characterId] ?? 0;
      if (scan < 100) return prev;
      const limit = prev.isAdmin ? 5000 : 500;
      if (prev.collection.length >= limit) return prev;
      const ownedId = `owned_${characterId}_${Date.now()}`;
      return {
        ...prev,
        collection: [...prev.collection, { ownedId, characterId, level: 1, exp: 0, ascensionStars: 0 }],
        scanProgress: { ...prev.scanProgress, [characterId]: 0 },
      };
    });
  }, []);

  const ascendDigimon = useCallback((baseOwnedId: string, sacrificeOwnedId: string): AscensionResult => {
    const current = stateRef.current;
    const base = current.collection.find((c) => c.ownedId === baseOwnedId);
    const sacrifice = current.collection.find((c) => c.ownedId === sacrificeOwnedId);
    if (!base || !sacrifice || base.ownedId === sacrifice.ownedId) return { success: false, message: 'Selecione dois Digimons diferentes.' };
    const baseChar = getCharacter(base.characterId) ?? CHARACTERS[base.characterId];
    const sacrificeChar = getCharacter(sacrifice.characterId) ?? CHARACTERS[sacrifice.characterId];
    if (!baseChar || !sacrificeChar || base.characterId !== sacrifice.characterId) return { success: false, message: 'A base e o sacrifício precisam ser o mesmo Digimon.' };
    const currentStars = getAscensionStars(base);
    if (currentStars >= 4) return { success: false, message: 'Este Digimon já alcançou a ascensão máxima.' };
    if (baseChar.rarity !== 'MEGA' || sacrificeChar.rarity !== 'MEGA') return { success: false, message: 'Somente Digimons na fase Mega podem ascender.' };
    if (base.level < ASCENSION_LEVEL_REQUIREMENT || sacrifice.level < ASCENSION_LEVEL_REQUIREMENT) return { success: false, message: 'Os dois Digimons precisam estar no nível 60.' };
    if (getAscensionStars(sacrifice) !== currentStars) return { success: false, message: `O sacrifício precisa ter ${currentStars} estrela(s), igual à base.` };
    if (currentStars === 3 && !current.inventory.includes(GOLDEN_STAR_ITEM_ID)) return { success: false, message: 'A 4ª ascensão exige uma Estrela de Ascensão Dourada.' };

    const targetStars = currentStars + 1;
    const equippedDigivice = current.equippedItems.digivice;
    const ascensionBuff = equippedDigivice ? current.digiviceTemporaryCards?.[equippedDigivice]?.ascension : undefined;
    const ascensionCard = ascensionBuff && ascensionBuff.expiresAt > Date.now()
      ? CARD_DEFINITIONS.find((card) => card.id === ascensionBuff.cardId)
      : undefined;
    const successChance = getAscensionSuccessChance(targetStars, new Date(), ascensionCard?.temporaryBonus ?? 0);
    const succeeded = Math.random() < successChance;

    if (!succeeded) {
      setState((prev) => ({
        ...prev,
        collection: prev.collection.map((c) =>
          c.ownedId === baseOwnedId ? { ...c, level: Math.max(1, c.level - 10), exp: 0 } : c
        ),
      }));
      return {
        success: false,
        message: `Ascensão falhou (${Math.round(successChance * 100)}%). Nenhum Digimon ou item foi perdido. ${baseChar.name} perdeu 10 níveis.`,
      };
    }

    setState((prev) => {
      const inventory = currentStars === 3 ? [...prev.inventory] : prev.inventory;
      if (currentStars === 3) inventory.splice(inventory.indexOf(GOLDEN_STAR_ITEM_ID), 1);
      const collection = prev.collection
        .filter((c) => c.ownedId !== sacrificeOwnedId)
        .map((c) => c.ownedId === baseOwnedId ? { ...c, ascensionStars: targetStars } : c);
      return { ...prev, collection, inventory, team: prev.team.filter((id) => id !== sacrificeOwnedId) };
    });
    return { success: true, message: `Ascensão concluída (${Math.round(successChance * 100)}%)! ${baseChar.name} agora possui ${targetStars} estrela(s).` };
  }, []);

  const craftGoldenAscensionStar = useCallback((): boolean => {
    if ((stateRef.current.pieces[GOLDEN_STAR_FRAGMENT_ID] ?? 0) < GOLDEN_STAR_FRAGMENTS_REQUIRED) return false;
    setState((prev) => {
      const fragments = prev.pieces[GOLDEN_STAR_FRAGMENT_ID] ?? 0;
      if (fragments < GOLDEN_STAR_FRAGMENTS_REQUIRED) return prev;
      return {
        ...prev,
        pieces: { ...prev.pieces, [GOLDEN_STAR_FRAGMENT_ID]: fragments - GOLDEN_STAR_FRAGMENTS_REQUIRED },
        inventory: [...prev.inventory, GOLDEN_STAR_ITEM_ID],
      };
    });
    return true;
  }, []);

  const claimStarryNightReward = useCallback((): boolean => {
    const availability = getStarryNightAvailability();
    const cycle = String(availability.closesAt);
    if (!availability.isOpen || stateRef.current.starryNightClaimCycle === cycle) return false;
    setState((prev) => {
      if (prev.starryNightClaimCycle === cycle) return prev;
      return {
        ...prev,
        starryNightClaimCycle: cycle,
        pieces: {
          ...prev.pieces,
          [GOLDEN_STAR_FRAGMENT_ID]: (prev.pieces[GOLDEN_STAR_FRAGMENT_ID] ?? 0) + 5,
        },
      };
    });
    return true;
  }, []);

  const evolveDigimon = useCallback((
    ownedId: string,
    alternate?: boolean,
    sacrificeOwnedId?: string,
    alternate2?: boolean,
    selectedItemId?: string,
  ): boolean => {
    const prev = stateRef.current;
    const target = prev.collection.find((c) => c.ownedId === ownedId);
    if (!target) return false;

    const evo = alternate2
      ? EXTRA_ALTERNATE_EVOLUTIONS[target.characterId]
      : alternate
        ? ALTERNATE_EVOLUTIONS[target.characterId]
        : EVOLUTIONS[target.characterId];

    if (!evo || target.level < evo.requiredLevel) return false;
    if (alternate && target.characterId === 'lucemonChaosMode' && target.acquisitionMethod === 'fusion') return false;

    // Hard safety: a relationship that requires another Digimon must NEVER pass
    // through the direct-evolution path, even if a stale map/UI entry exists.
    const sacrificeRecipe = (FUSIONS[target.characterId] ?? []).find((recipe) => recipe.resultId === evo.evolvesTo);
    if (sacrificeRecipe) return false;

    // Evoluções que exigem item só continuam depois que a interface envia
    // explicitamente o item escolhido pelo jogador.
    if (evo.requiredItem) {
      if (!selectedItemId || selectedItemId !== evo.requiredItem) return false;
      if (!prev.inventory.includes(selectedItemId)) return false;
    }

    setState((current) => {
      const currentTarget = current.collection.find((c) => c.ownedId === ownedId);
      if (!currentTarget) return current;

      let inventory = current.inventory;
      if (evo.requiredItem) {
        const itemIndex = inventory.indexOf(selectedItemId!);
        if (itemIndex < 0) return current;
        inventory = inventory.filter((_, index) => index !== itemIndex);
      }

      return {
        ...current,
        inventory,
        collection: current.collection.map((owned) =>
          owned.ownedId === ownedId
            ? {
                ...owned,
                characterId: evo.evolvesTo,
                level: 1,
                exp: 0,
                acquisitionMethod: 'evolution' as const,
                ...preserveMailGiftStars(owned),
              }
            : owned
        ),
      };
    });
    return true;
  }, []);

  const changeFormDigimon = useCallback((ownedId: string) => {
    setState((prev) => {
      const target = prev.collection.find((c) => c.ownedId === ownedId);
      if (!target) return prev;
      const toFormId = FORM_CHANGES[target.characterId];
      if (!toFormId) return prev;
      const requiredLevel = FORM_CHANGE_MIN_LEVEL[target.characterId] ?? 0;
      if (target.level < requiredLevel) return prev;
      const newCollection = prev.collection.map((c) =>
        c.ownedId === ownedId ? { ...c, characterId: toFormId } : c
      );
      return { ...prev, collection: newCollection };
    });
  }, []);

  const fuseDigimon = useCallback((keepOwnedId: string, sacrificeOwnedId: string | string[], resultId?: string, selectedItemId?: string): boolean => {
    const snapshot = stateRef.current;
    const keep = snapshot.collection.find((c) => c.ownedId === keepOwnedId);
    if (!keep) return false;

    const sacrificeIds = Array.isArray(sacrificeOwnedId) ? sacrificeOwnedId : [sacrificeOwnedId];
    const sacrifices = sacrificeIds
      .map((id) => snapshot.collection.find((c) => c.ownedId === id))
      .filter((c): c is OwnedCharacter => !!c && c.ownedId !== keepOwnedId);
    if (sacrifices.length !== sacrificeIds.length) return false;

    const recipes = FUSIONS[keep.characterId] ?? [];
    const fusion = recipes.find((recipe) => {
      if (resultId && recipe.resultId !== resultId) return false;
      const requiredPartners = recipe.partners ?? (recipe.partner ? [recipe.partner] : []);
      if (requiredPartners.length !== sacrifices.length) return false;
      const remaining = [...sacrifices];
      return requiredPartners.every((partnerId) => {
        const index = remaining.findIndex((owned) => owned.characterId === partnerId);
        if (index < 0) return false;
        remaining.splice(index, 1);
        return true;
      });
    });

    if (!fusion || keep.level < fusion.requiredLevel) return false;
    if (fusion.requiredItem && (!selectedItemId || selectedItemId !== fusion.requiredItem || !snapshot.inventory.includes(selectedItemId))) return false;

    const fusionResultChar = getCharacter(fusion.resultId) ?? CHARACTERS[fusion.resultId];
    const equippedDigivice = snapshot.equippedItems.digivice;
    const fusionBuff = equippedDigivice ? snapshot.digiviceTemporaryCards?.[equippedDigivice]?.fusion : undefined;
    const fusionCard = fusionBuff && fusionBuff.expiresAt > Date.now()
      ? CARD_DEFINITIONS.find((card) => card.id === fusionBuff.cardId)
      : undefined;
    const fusionSuccessChance = getFusionSuccessChance(fusionResultChar?.rarity ?? '', new Date(), fusionCard?.temporaryBonus ?? 0);
    if (Math.random() >= fusionSuccessChance) {
      return false;
    }

    setState((prev) => {
      const currentKeep = prev.collection.find((c) => c.ownedId === keepOwnedId);
      if (!currentKeep) return prev;

      const currentSacrifices = sacrificeIds
        .map((id) => prev.collection.find((c) => c.ownedId === id))
        .filter((c): c is OwnedCharacter => !!c && c.ownedId !== keepOwnedId);
      if (currentSacrifices.length !== sacrificeIds.length) return prev;

      const requiredPartners = fusion.partners ?? (fusion.partner ? [fusion.partner] : []);
      const remaining = [...currentSacrifices];
      const validPartners = requiredPartners.every((partnerId) => {
        const index = remaining.findIndex((owned) => owned.characterId === partnerId);
        if (index < 0) return false;
        remaining.splice(index, 1);
        return true;
      });
      if (!validPartners) return prev;

      let inventory = prev.inventory;
      if (fusion.requiredItem) {
        if (!selectedItemId || selectedItemId !== fusion.requiredItem) return prev;
        const itemIndex = inventory.indexOf(selectedItemId);
        if (itemIndex < 0) return prev;
        inventory = inventory.filter((_, index) => index !== itemIndex);
      }

      const sacrificeSet = new Set(currentSacrifices.map((owned) => owned.ownedId));
      const newSelected = sacrificeSet.has(prev.selectedOwnedId ?? '') ? keepOwnedId : prev.selectedOwnedId;
      const fusionStars = resolveFusionStars(currentKeep, currentSacrifices);

      return {
        ...prev,
        inventory,
        selectedOwnedId: newSelected,
        collection: prev.collection
          .filter((owned) => !sacrificeSet.has(owned.ownedId))
          .map((owned) => owned.ownedId === keepOwnedId
            ? { ...owned, characterId: fusion.resultId, level: 1, exp: 0, acquisitionMethod: 'fusion' as const, ...fusionStars }
            : owned),
      };
    });
    return true;
  }, []);

  const setSelectedCharacter = useCallback((ownedId: string) => {
    setState((prev) => ({ ...prev, selectedOwnedId: ownedId }));
  }, []);

  const setTeam = useCallback((ownedIds: string[]) => {
    setState((prev) => ({ ...prev, team: ownedIds.slice(0, 3) }));
  }, []);

  const setPlayerName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, playerName: name }));
  }, []);

  const setGender = useCallback((g: TamerGender) => {
    setState((prev) => ({ ...prev, gender: g }));
  }, []);

  const equipItem = useCallback((slot: EquipSlot, itemId: string) => {
    setState((prev) => ({
      ...prev,
      equippedItems: { ...prev.equippedItems, [slot]: itemId },
    }));
  }, []);

  const unequipItem = useCallback((slot: EquipSlot) => {
    setState((prev) => ({
      ...prev,
      equippedItems: { ...prev.equippedItems, [slot]: null },
    }));
  }, []);

  const completeOnboarding = useCallback((name: string, gender: TamerGender, tamerId: string) => {
    const TAMER_STARTERS: Record<string, string> = {
      tamer_tai:  'agumon',
      tamer_tk:   'patamon',
      tamer_matt: 'gabumon',
      tamer_kari: 'salamon',
      tamer_sora: 'pyomon',
      tamer_mimi: 'palmon',
    };
    const starterId = TAMER_STARTERS[tamerId];
    const ownedId   = `owned_${starterId}_0`;
    const starter   = { ownedId, characterId: starterId, level: 1, exp: 0 };
    setState((prev) => ({
      ...prev,
      playerName: name,
      gender,
      tamerId,
      isOnboarded: true,
      collection: [starter],
      selectedOwnedId: ownedId,
    }));
  }, []);

  const gainBits = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, bits: prev.bits + amount }));
  }, []);

  const gainGemas = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, gemas: prev.gemas + amount }));
  }, []);

  const setTamerId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, tamerId: id }));
  }, []);

  const realizarTiroGacha = useCallback((quantidade: 1 | 10): { mensagem: string; recompensas: GachaReward[]; custoGemas: number } | null => {
    const TAXA_RARO     = 0.01;
    const TAXA_ESPECIAL = 0.05;

    // Read current state synchronously via ref (avoids async setState timing issue)
    const prev = stateRef.current;
    const adminPool = gachaAdminPoolRef.current;

    // Build pool: use admin-configured pool if available, else fall back to curated default pool
    let pool: GachaReward[];
    if (adminPool && adminPool.length > 0) {
      pool = adminPool.map((entry) => {
        const storedId = entry.characterId ?? entry.id;
        const configuredName = entry.nome?.replace(/^✨\s*/, '');
        const knownName = getKnownCharacterName(storedId);
        const characterId = entry.tipo === 'DIGIMON' && configuredName
          ? (findCharacterIdByName(configuredName) ?? storedId)
          : storedId;
        const normalizedName = entry.tipo === 'DIGIMON'
          ? (knownName ?? (configuredName && !/^custom_\d+$/.test(configuredName) ? configuredName : undefined))
          : entry.nome;

        return {
          characterId,
          raridade: entry.raridade,
          nome: normalizedName ?? entry.nome,
          tipo: entry.tipo,
        };
      });
    } else {
      pool = [
        // Comum (10 slots)
        { characterId: 'koromon',       raridade: 'Rookie',    tipo: 'DIGIMON', nome: 'Koromon' },
        { characterId: 'agumon',        raridade: 'Rookie',    tipo: 'DIGIMON', nome: 'Agumon' },
        { characterId: 'tsunomon',      raridade: 'Rookie',    tipo: 'DIGIMON', nome: 'Tsunomon' },
        { characterId: 'gabumon',       raridade: 'Rookie',    tipo: 'DIGIMON', nome: 'Gabumon' },
        { characterId: 'salamon',       raridade: 'Rookie',    tipo: 'DIGIMON', nome: 'Salamon' },
        { characterId: 'blackSalamon',  raridade: 'Rookie',    tipo: 'DIGIMON', nome: 'BlackSalamon' },
        { characterId: 'palmon',        raridade: 'Rookie',    tipo: 'DIGIMON', nome: 'Palmon' },
        { characterId: 'pyomon',        raridade: 'Rookie',    tipo: 'DIGIMON', nome: 'Pyomon' },
        { characterId: 'demiDevimon',   raridade: 'Rookie',    tipo: 'DIGIMON', nome: 'DemiDevimon' },
        { characterId: 'tokomon',       raridade: 'Rookie',    tipo: 'DIGIMON', nome: 'Tokomon' },
        // Especial (6 slots)
        { characterId: findCharacterIdByName('Dorulumon') ?? 'name:Dorulumon', raridade: 'Especial', tipo: 'DIGIMON', nome: 'Dorulumon' },
        { characterId: 'magnaAngemon',  raridade: 'Especial', tipo: 'DIGIMON', nome: 'MagnaAngemon' },
        { characterId: 'angewomon',     raridade: 'Especial', tipo: 'DIGIMON', nome: 'Angewomon' },
        { characterId: 'metalGreymon',  raridade: 'Especial', tipo: 'DIGIMON', nome: 'MetalGreymon' },
        { characterId: 'wereGarurumon', raridade: 'Especial', tipo: 'DIGIMON', nome: 'WereGarurumon' },
        { characterId: 'garudamon',     raridade: 'Especial', tipo: 'DIGIMON', nome: 'Garudamon' },
        // Raro (3 slots)
        { characterId: 'permissao_real', raridade: 'Champion',   tipo: 'ITEM',    nome: '⚔️ Permição Real da Deusa' },
        { characterId: 'dorumon',        raridade: 'Champion',   tipo: 'DIGIMON', nome: 'Dorumon' },
        { characterId: 'custom_313',     raridade: 'Champion',   tipo: 'DIGIMON', nome: 'Ryudamon' },
      ];
    }

    // Guard: if pool is completely empty, abort
    if (pool.length === 0) {
      return { mensagem: 'Gacha sem pool configurado!', recompensas: [], custoGemas: 0 };
    }

    const pickFrom = (raridade: GachaReward['raridade']): GachaReward => {
      const filtered = pool.filter((p) => p.raridade === raridade);
      const src = filtered.length > 0 ? filtered : pool;
      const entry = src[Math.floor(Math.random() * src.length)];
      // Safety fallback: if entry is somehow undefined, pick first pool item
      return entry ?? pool[0];
    };

    // ── Compute cost synchronously ──
    const hoje = getTodayDateString();
    let custoGemas = 0;
    let ultimoTiroGratis = prev.ultimoTiroGratis;

    if (quantidade === 1) {
      if (prev.ultimoTiroGratis !== hoje) {
        custoGemas = 0;
        ultimoTiroGratis = hoje;
      } else {
        custoGemas = 100;
      }
    } else {
      custoGemas = 900;
    }

    if (prev.gemas < custoGemas) {
      return { mensagem: 'Gemas insuficientes!', recompensas: [], custoGemas: 0 };
    }

    // ── Roll rewards synchronously ──
    // Fixed item: Digitama Especial — always 1% chance per pull, only via percentage (never via pity)
    const DIGITAMA_ESPECIAL_ID = 'specialDigitama';
    const TAXA_DIGITAMA_ESPECIAL = 0.01;

    let pity = prev.gachaContadorPity;
    const recompensas: GachaReward[] = [];

    for (let i = 0; i < quantidade; i++) {
      // Every pull counts toward pity. The 50th pull has absolute priority:
      // it MUST come from the current admin-configured Champion pool.
      pity += 1;

      if (pity >= 50) {
        const pityPool = pool.filter((p) => p.raridade === 'Champion');
        if (pityPool.length > 0) {
          recompensas.push(pityPool[Math.floor(Math.random() * pityPool.length)]);
        } else {
          // Safety fallback only when the admin pool has no Champion entries.
          // Keep the guarantee rare instead of accidentally drawing Rookie/Especial.
          const fallbackChampion: GachaReward[] = [
            { characterId: 'permissao_real', raridade: 'Champion', tipo: 'ITEM', nome: '⚔️ Permição Real da Deusa' },
            { characterId: 'dorumon', raridade: 'Champion', tipo: 'DIGIMON', nome: 'Dorumon' },
            { characterId: 'custom_313', raridade: 'Champion', tipo: 'DIGIMON', nome: 'Ryudamon' },
          ];
          recompensas.push(fallbackChampion[Math.floor(Math.random() * fallbackChampion.length)]);
        }
        pity = 0;
        continue;
      }

      // Digitama Especial remains a fixed 1% independent drop, but it cannot
      // replace/skip the guaranteed 50th-pull reward.
      if (Math.random() < TAXA_DIGITAMA_ESPECIAL) {
        recompensas.push({ characterId: DIGITAMA_ESPECIAL_ID, raridade: 'EGG', tipo: 'DIGIMON', nome: '✨ Digitama Especial' });
        continue;
      }
      if (pity % 10 === 0) {
        recompensas.push(pickFrom('Especial'));
        continue;
      }

      const rng = Math.random();
      let raridade: GachaReward['raridade'];
      if (rng < TAXA_RARO) {
        raridade = 'Champion';
        pity = 0;
      } else if (rng < TAXA_RARO + TAXA_ESPECIAL) {
        raridade = 'Especial';
      } else {
        raridade = 'Rookie';
      }
      recompensas.push(pickFrom(raridade));
    }

    // Filter out any invalid entries (should not happen, but safety net)
    const validRecompensas = recompensas.filter((r) => r && r.characterId);
    if (validRecompensas.length === 0) {
      return { mensagem: 'Erro no sorteio. Tente novamente.', recompensas: [], custoGemas: 0 };
    }

    // ── Apply state changes ──
    const base = Date.now();
    const newCollection = [...prev.collection];
    const newInventory  = [...prev.inventory];

    validRecompensas.forEach((reward, i) => {
      if (reward.tipo === 'DIGIMON' || !reward.tipo) {
        if (newCollection.length < (prev.isAdmin ? 5000 : 500)) {
          newCollection.push({ ownedId: `owned_${reward.characterId}_${base}_${i}`, characterId: reward.characterId, level: 1, exp: 0 });
        }
      } else {
        newInventory.push(reward.characterId);
      }
    });

    setState((s) => ({
      ...s,
      gemas: s.gemas - custoGemas,
      gachaContadorPity: pity,
      ultimoTiroGratis,
      collection: newCollection,
      inventory: newInventory,
    }));

    return {
      mensagem: `🎉 Sorteio concluído! ${custoGemas > 0 ? `Gastou ${custoGemas} gemas.` : 'Tiro gratuito usado!'} Pity: ${pity}/50`,
      recompensas: validRecompensas,
      custoGemas,
    };
  }, []);

  const gainTamerExp = useCallback((amount: number) => {
    setState((prev) => {
      let { tamerExp, tamerLevel } = prev;
      tamerExp += amount;
      while (tamerExp >= tamerExpToNextLevel(tamerLevel)) {
        tamerExp -= tamerExpToNextLevel(tamerLevel);
        tamerLevel += 1;
      }
      return { ...prev, tamerExp, tamerLevel };
    });
  }, []);

  const useTamerXpItem = useCallback((itemId: string, quantity: number) => {
    if (itemId !== 'pilula_energetica') return;
    setState((prev) => {
      const available = prev.inventory.filter((id) => id === itemId).length;
      const qty = Math.max(0, Math.min(Math.floor(quantity), available));
      if (qty <= 0) return prev;

      let remaining = qty;
      const inventory = prev.inventory.filter((id) => {
        if (id === itemId && remaining > 0) {
          remaining -= 1;
          return false;
        }
        return true;
      });

      let tamerExp = prev.tamerExp + (500 * qty);
      let tamerLevel = prev.tamerLevel;
      while (tamerExp >= tamerExpToNextLevel(tamerLevel)) {
        tamerExp -= tamerExpToNextLevel(tamerLevel);
        tamerLevel += 1;
      }
      return { ...prev, inventory, tamerExp, tamerLevel };
    });
  }, []);

  const addToInventory = useCallback((itemId: string) => {
    setState((prev) => {
      if (prev.inventory.includes(itemId)) return prev;
      return { ...prev, inventory: [...prev.inventory, itemId] };
    });
  }, []);

  const readMessage = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) => m.id === id ? { ...m, isRead: true } : m),
    }));
  }, []);

  const claimReward = useCallback((id: string) => {
    setState((prev) => {
      const msg = prev.messages.find((m) => m.id === id);
      if (!msg || msg.rewardClaimed) return prev;
      let newBits = prev.bits;
      let newInventory = [...prev.inventory];
      let newCollection = [...prev.collection];
      let newPieces = { ...prev.pieces };
      if (msg.reward?.bits) newBits += msg.reward.bits;
      if (msg.reward?.items) {
        for (const entry of msg.reward.items) {
          const normalized = normalizeMailItemEntry(entry);
          if (!normalized) continue;
          const { itemId, amount } = normalized;
          if (itemId === 'pilula_energetica' || CARD_IDS.has(itemId)) {
            for (let i = 0; i < amount; i += 1) newInventory.push(itemId);
          } else if (!newInventory.includes(itemId)) {
            newInventory.push(itemId);
          }
        }
      }
      if (msg.reward?.pieces) {
        for (const [pieceId, amount] of Object.entries(msg.reward.pieces)) {
          const migratedPieceId = migrateEvolutionPieceId(pieceId);
          newPieces[migratedPieceId] = (newPieces[migratedPieceId] ?? 0) + amount;
        }
      }
      if (msg.reward?.digimon) {
        const base = Date.now();
        msg.reward.digimon.forEach((characterId, i) => {
          if (newCollection.length < 500) {
            const ownedId = `owned_${characterId}_${base}_${i}`;
            newCollection.push({
              ownedId,
              characterId,
              level: 1,
              exp: 0,
              ascensionStars: getMailGiftAscensionStars(msg.id, characterId),
              mailGiftId: getMailGiftAscensionStars(msg.id, characterId) > 0
                ? msg.id as OwnedCharacter['mailGiftId']
                : undefined,
            });
          }
        });
      }
      if (msg.reward?.digimonWithLevel) {
        const base = Date.now();
        msg.reward.digimonWithLevel.forEach(({ characterId, level }, i) => {
          if (newCollection.length < 500) {
            const ownedId = `owned_${characterId}_${base}_${i}`;
            newCollection.push({
              ownedId,
              characterId,
              level,
              exp: 0,
              ascensionStars: getMailGiftAscensionStars(msg.id, characterId),
              mailGiftId: getMailGiftAscensionStars(msg.id, characterId) > 0
                ? msg.id as OwnedCharacter['mailGiftId']
                : undefined,
            });
          }
        });
      }
      const newDecorInventory = { ...prev.farmDecorInventory };
      if (msg.reward?.decoration) {
        for (const decorType of msg.reward.decoration) {
          newDecorInventory[decorType] = (newDecorInventory[decorType] ?? 0) + 1;
        }
      }
      return {
        ...prev,
        bits: newBits,
        inventory: newInventory,
        collection: newCollection,
        pieces: newPieces,
        farmDecorInventory: newDecorInventory,
        messages: prev.messages.map((m) =>
          m.id === id ? { ...m, isRead: true, rewardClaimed: true } : m
        ),
      };
    });
  }, []);

  const placeFarmDecoration = useCallback((type: string, x: number, y: number) => {
    setState((prev) => {
      const qty = prev.farmDecorInventory[type] ?? 0;
      if (qty <= 0) return prev;
      const newDecor: FarmDecoration = { id: `deco_${type}_${Date.now()}`, type, x, y, mirrored: false };
      return {
        ...prev,
        farmDecorInventory: { ...prev.farmDecorInventory, [type]: qty - 1 },
        farmDecorations: [...prev.farmDecorations, newDecor],
      };
    });
  }, []);

  const moveFarmDecoration = useCallback((id: string, x: number, y: number) => {
    setState((prev) => ({
      ...prev,
      farmDecorations: prev.farmDecorations.map((d) => d.id === id ? { ...d, x, y } : d),
    }));
  }, []);

  const mirrorFarmDecoration = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      farmDecorations: prev.farmDecorations.map((d) => d.id === id ? { ...d, mirrored: !d.mirrored } : d),
    }));
  }, []);

  const removeFarmDecoration = useCallback((id: string) => {
    setState((prev) => {
      const deco = prev.farmDecorations.find((d) => d.id === id);
      if (!deco) return prev;
      let decos = prev.farmDecorations.filter((d) => d.id !== id);
      if (isAsfalto(deco.type)) {
        decos = decos.map((d) => {
          if (!isAsfalto(d.type)) return d;
          if (!isNeighborPos(d.x, d.y, deco.x, deco.y)) return d;
          const meta = resolveAsfaltoMeta(d.x, d.y, decos);
          return { ...d, type: meta.type, mirrored: meta.mirrored, rotation: meta.rotation };
        });
      }
      return {
        ...prev,
        farmDecorations: decos,
        farmDecorInventory: { ...prev.farmDecorInventory, [deco.type]: (prev.farmDecorInventory[deco.type] ?? 0) + 1 },
      };
    });
  }, []);

  const placeAsfaltoAutoConnect = useCallback((type: string, x: number, y: number) => {
    setState((prev) => {
      const qty = prev.farmDecorInventory[type] ?? 0;
      if (qty <= 0) return prev;
      const sx = snapAsfalto(x);
      const sy = snapAsfalto(y);
      const newId = `deco_asfalto_${Date.now()}`;
      // Place tile with the exact type the user selected — never override existing tiles
      const newDecor: FarmDecoration = {
        id: newId, type,
        x: sx, y: sy,
        mirrored: false, rotation: 0,
      };
      return {
        ...prev,
        farmDecorInventory: { ...prev.farmDecorInventory, [type]: qty - 1 },
        farmDecorations: [...prev.farmDecorations, newDecor],
      };
    });
  }, []);

  const moveAsfaltoAutoConnect = useCallback((id: string, x: number, y: number) => {
    setState((prev) => {
      const deco = prev.farmDecorations.find((d) => d.id === id);
      if (!deco) return prev;
      const sx = snapAsfalto(x);
      const sy = snapAsfalto(y);
      const oldX = deco.x;
      const oldY = deco.y;
      let decos = prev.farmDecorations.map((d) => d.id === id ? { ...d, x: sx, y: sy } : d);
      decos = decos.map((d) => {
        if (!isAsfalto(d.type)) return d;
        const isTarget = d.id === id;
        const nearOld = isNeighborPos(d.x, d.y, oldX, oldY);
        const nearNew = isNeighborPos(d.x, d.y, sx, sy);
        if (!isTarget && !nearOld && !nearNew) return d;
        const meta = resolveAsfaltoMeta(d.x, d.y, decos, isTarget ? undefined : undefined);
        return { ...d, type: meta.type, mirrored: meta.mirrored, rotation: meta.rotation };
      });
      return { ...prev, farmDecorations: decos };
    });
  }, []);

  const useXpItem = useCallback((ownedId: string, batteryId: string, qty: number) => {
    const XP_PER_BATTERY: Record<string, number> = {
      piece_battery_green:  200,
      piece_battery_blue:   400,
      piece_battery_purple: 800,
      piece_battery_gold:   1600,
    };
    const xpEach = XP_PER_BATTERY[batteryId] ?? 0;
    if (xpEach <= 0 || qty <= 0) return;
    setState((prev) => {
      const currentQty = prev.pieces[batteryId] ?? 0;
      if (currentQty < qty) return prev;
      const newPieces = { ...prev.pieces, [batteryId]: currentQty - qty };
      const totalXp = xpEach * qty;
      const idx = prev.collection.findIndex((c) => c.ownedId === ownedId);
      if (idx < 0) return { ...prev, pieces: newPieces };
      let { exp, level } = prev.collection[idx];
      exp += totalXp;
      while (level < 100 && exp >= expToNextLevel(level)) {
        exp -= expToNextLevel(level);
        level++;
      }
      if (level >= 100) { level = 100; exp = 0; }
      const newCollection = [...prev.collection];
      newCollection[idx] = { ...newCollection[idx], exp, level };
      return { ...prev, pieces: newPieces, collection: newCollection };
    });
  }, []);

  const gainPiece = useCallback((pieceId: string, amount = 1) => {
    setState((prev) => ({
      ...prev,
      pieces: { ...prev.pieces, [pieceId]: (prev.pieces[pieceId] ?? 0) + amount },
    }));
  }, []);

  const gainFarmDecor = useCallback((decorType: string, amount = 1) => {
    setState((prev) => ({
      ...prev,
      farmDecorInventory: {
        ...prev.farmDecorInventory,
        [decorType]: (prev.farmDecorInventory[decorType] ?? 0) + amount,
      },
    }));
  }, []);

  const craftItem = useCallback((recipe: CraftRecipe): boolean => {
    let success = false;
    setState((prev) => {
      if (!CARD_IDS.has(recipe.resultItemId) && prev.inventory.includes(recipe.resultItemId)) return prev;
      if ((recipe.bitsCost ?? 0) > 0 && prev.bits < (recipe.bitsCost ?? 0)) return prev;

      const newPieces = { ...prev.pieces };

      if (recipe.pieceRequirements && recipe.pieceRequirements.length > 0) {
        for (const req of recipe.pieceRequirements) {
          if ((prev.pieces[req.pieceId] ?? 0) < req.count) return prev;
        }
        for (const req of recipe.pieceRequirements) {
          newPieces[req.pieceId] = (newPieces[req.pieceId] ?? 0) - req.count;
        }
      } else {
        const current = prev.pieces[recipe.pieceId] ?? 0;
        if (current < recipe.requiredCount) return prev;
        newPieces[recipe.pieceId] = current - recipe.requiredCount;
      }

      success = true;
      return {
        ...prev,
        pieces: newPieces,
        bits: prev.bits - (recipe.bitsCost ?? 0),
        inventory: [...prev.inventory, recipe.resultItemId],
      };
    });
    return success;
  }, []);

  const applyCardToDigivice = useCallback((cardId: string, digiviceId: string): CardUseResult => {
    const card = CARD_DEFINITIONS.find((entry) => entry.id === cardId);
    if (!card) return { success: false, message: 'Card inválido.' };
    if (!digiviceId.startsWith('digivice_')) return { success: false, message: 'Selecione um Digivice válido.' };

    let result: CardUseResult = { success: false, message: 'Não foi possível aplicar o Card.' };
    setState((prev) => {
      const cardIndex = prev.inventory.indexOf(cardId);
      const ownsDigivice = prev.inventory.includes(digiviceId) || prev.equippedItems.digivice === digiviceId;
      if (cardIndex < 0 || !ownsDigivice) return prev;

      const nextInventory = [...prev.inventory];
      nextInventory.splice(cardIndex, 1);

      if (card.temporaryType) {
        const expiresAt = Date.now() + (card.durationMs ?? 3 * 60 * 60 * 1000);
        result = { success: true, message: `${card.name} ativado por 3 horas neste Digivice.` };
        return {
          ...prev,
          inventory: nextInventory,
          digiviceTemporaryCards: {
            ...(prev.digiviceTemporaryCards ?? {}),
            [digiviceId]: {
              ...((prev.digiviceTemporaryCards ?? {})[digiviceId] ?? {}),
              [card.temporaryType]: { cardId, expiresAt },
            },
          },
        };
      }

      const currentCards = (prev.digiviceCards ?? {})[digiviceId] ?? [];
      if (currentCards.includes(cardId)) {
        result = { success: false, message: 'Este Card já foi aplicado neste Digivice.' };
        return prev;
      }
      if (currentCards.length >= 10) {
        result = { success: false, message: 'Este Digivice já possui o limite de 10 Cards permanentes.' };
        return prev;
      }

      result = { success: true, message: `${card.name} aplicado permanentemente ao Digivice.` };
      return {
        ...prev,
        inventory: nextInventory,
        digiviceCards: {
          ...(prev.digiviceCards ?? {}),
          [digiviceId]: [...currentCards, cardId],
        },
      };
    });
    return result;
  }, []);

  const sacrificeDigimon = useCallback((ownedId: string): SacrificeResult => {
    let result: SacrificeResult = { droppedItem: null, scanGained: null };
    setState((prev) => {
      const target = prev.collection.find((c) => c.ownedId === ownedId);
      if (!target) return prev;
      const char = CHARACTERS[target.characterId];
      if (!char) return prev;
      let newPieces = { ...prev.pieces };
      let newScanProgress = { ...prev.scanProgress };
      const drops = SACRIFICE_DROPS[target.characterId];
      if (drops) {
        for (const drop of drops) {
          if (Math.random() < drop.chance) {
            newPieces[drop.itemId] = (newPieces[drop.itemId] ?? 0) + 1;
            result.droppedItem = drop.itemId;
          }
        }
      }
      const override = SACRIFICE_SCAN_OVERRIDES[target.characterId];
      if (override) {
        const gain = Math.round(override.percent * 100);
        newScanProgress[override.characterId] = Math.min(100, (newScanProgress[override.characterId] ?? 0) + gain);
        result.scanGained = { characterId: override.characterId, amount: gain };
      } else {
        const rookieId = ROOKIE_OF[target.characterId];
        if (rookieId) {
          const pct = SACRIFICE_SCAN_PCT[char.rarity] ?? 0;
          if (pct > 0) {
            const gain = Math.round(pct * 100);
            newScanProgress[rookieId] = Math.min(100, (newScanProgress[rookieId] ?? 0) + gain);
            result.scanGained = { characterId: rookieId, amount: gain };
          }
        }
      }
      return {
        ...prev,
        pieces: newPieces,
        scanProgress: newScanProgress,
        collection: prev.collection.filter((c) => c.ownedId !== ownedId),
        team: prev.team.filter((id) => id !== ownedId),
        selectedOwnedId: prev.selectedOwnedId === ownedId ? null : prev.selectedOwnedId,
      };
    });
    return result;
  }, []);

  const claimDailyDungeon = useCallback(() => {
    setState((prev) => ({ ...prev, lastDailyDate: getTodayDateString() }));
  }, []);

  const addFarmFood = useCallback((foodId: string, qty: number) => {
    setState((prev) => ({
      ...prev,
      farmFoods: { ...prev.farmFoods, [foodId]: (prev.farmFoods[foodId] ?? 0) + qty },
    }));
  }, []);

  const feedFarmDigimon = useCallback((ownedId: string, foodId: string): boolean => {
    const qty = stateRef.current.farmFoods[foodId] ?? 0;
    if (qty <= 0) return false;
    setState((prev) => {
      const q = prev.farmFoods[foodId] ?? 0;
      if (q <= 0) return prev;
      return {
        ...prev,
        farmFoods: { ...prev.farmFoods, [foodId]: q - 1 },
        farmLastFeed: { ...prev.farmLastFeed, [ownedId]: Date.now() },
      };
    });
    return true;
  }, []);

  const completeFarmBattle = useCallback(() => {
    setState((prev) => {
      const now = Date.now();
      const newReqs = { ...prev.farmBattleRequests };
      let changed = false;
      for (const ownedId of prev.farmSlots) {
        const req = newReqs[ownedId];
        if (req && !req.fulfilled) {
          const nextMs = 3 * 3600000 + Math.random() * 2 * 3600000;
          newReqs[ownedId] = { ...req, fulfilled: true, nextRequestAt: now + nextMs };
          changed = true;
        }
      }
      return changed ? { ...prev, farmBattleRequests: newReqs } : prev;
    });
  }, []);

  const generateFarmBattleRequests = useCallback(() => {
    setState((prev) => {
      const now = Date.now();
      const newReqs = { ...prev.farmBattleRequests };
      let changed = false;
      for (const ownedId of prev.farmSlots) {
        const entryTime = prev.farmEntryTimes[ownedId] ?? now;
        const existing = newReqs[ownedId];
        if (!existing) {
          const firstDelay = 3 * 3600000 + Math.random() * 2 * 3600000;
          if (now >= entryTime + firstDelay) {
            const nextMs = 3 * 3600000 + Math.random() * 2 * 3600000;
            newReqs[ownedId] = { requestedAt: now, nextRequestAt: now + nextMs, fulfilled: false };
            changed = true;
          }
        } else if (existing.fulfilled && now >= existing.nextRequestAt) {
          const nextMs = 3 * 3600000 + Math.random() * 2 * 3600000;
          newReqs[ownedId] = { requestedAt: now, nextRequestAt: now + nextMs, fulfilled: false };
          changed = true;
        }
      }
      return changed ? { ...prev, farmBattleRequests: newReqs } : prev;
    });
  }, []);

  const claimFarmDailyReward = useCallback((): { type: string; label: string } | null => {
    let reward: { type: string; label: string } | null = null;
    setState((prev) => {
      const today = getTodayDateString();
      if (prev.farmDailyRewardClaim === today || prev.farmSlots.length === 0) return prev;
      const now = Date.now();
      const allSatisfied = prev.farmSlots.every((ownedId) => {
        const lastFeed = prev.farmLastFeed[ownedId] ?? 0;
        const req = prev.farmBattleRequests[ownedId];
        const fedOk = lastFeed > 0 && (now - lastFeed) < 8 * 3600000;
        const battleOk = !req || req.fulfilled;
        return fedOk && battleOk;
      });
      if (!allSatisfied) return prev;
      const weekMs = 7 * 24 * 3600000;
      const isWeekly = (now - prev.farmWeeklyRewardClaim) >= weekMs;
      if (isWeekly && Math.random() < 0.3) {
        const elements = ['fire', 'ice', 'lightning', 'earth', 'wind', 'water', 'light', 'dark'];
        const el = elements[Math.floor(Math.random() * elements.length)];
        const eggId = `egg_${el}`;
        reward = { type: 'egg', label: `Ovo ${el.charAt(0).toUpperCase() + el.slice(1)}` };
        const ownedId = `owned_${eggId}_${now}`;
        return {
          ...prev,
          farmDailyRewardClaim: today,
          farmWeeklyRewardClaim: now,
          collection: [...prev.collection, { ownedId, characterId: eggId, level: 1, exp: 0 }],
        };
      }
      const roll = Math.random();
      if (roll < 0.33) {
        reward = { type: 'gemas', label: '50 Gemas 💎' };
        return { ...prev, farmDailyRewardClaim: today, gemas: prev.gemas + 50 };
      } else if (roll < 0.66) {
        reward = { type: 'battery', label: '1× Bateria Dourada 🔋' };
        return { ...prev, farmDailyRewardClaim: today, pieces: { ...prev.pieces, piece_battery_gold: (prev.pieces.piece_battery_gold ?? 0) + 1 } };
      } else {
        const dungPieces = ['piece_brasao_coragem', 'piece_brasao_esperanca', 'piece_brasao_amizade'];
        const pieceId = dungPieces[Math.floor(Math.random() * dungPieces.length)];
        const names: Record<string, string> = {
          piece_brasao_coragem: 'Frag. Brasão Coragem',
          piece_brasao_esperanca: 'Frag. Brasão Esperança',
          piece_brasao_amizade: 'Frag. Brasão Amizade',
        };
        reward = { type: 'dungeon', label: `1× ${names[pieceId] ?? 'Item Dungeon'} 🏅` };
        return { ...prev, farmDailyRewardClaim: today, pieces: { ...prev.pieces, [pieceId]: (prev.pieces[pieceId] ?? 0) + 1 } };
      }
    });
    return reward;
  }, []);

  const setBossCooldown = useCallback((mapId: string, stageIdx: number) => {
    setState((prev) => ({
      ...prev,
      bossCooldowns: { ...prev.bossCooldowns, [`${mapId}-${stageIdx}`]: Date.now() },
    }));
  }, []);

  const isBossOnCooldown = useCallback((mapId: string, stageIdx: number): boolean => {
    const key = `${mapId}-${stageIdx}`;
    const last = stateRef.current.bossCooldowns[key] ?? 0;
    return (Date.now() - last) < 4 * 3600000;
  }, []);

  const setFarmSlots = useCallback((slots: string[], resetTime = false) => {
    setState((prev) => {
      const now = Date.now();
      const newEntryTimes = { ...prev.farmEntryTimes };
      for (const ownedId of slots) {
        if (!prev.farmSlots.includes(ownedId)) {
          newEntryTimes[ownedId] = now;
        }
      }
      for (const ownedId of prev.farmSlots) {
        if (!slots.includes(ownedId)) {
          delete newEntryTimes[ownedId];
        }
      }
      return {
        ...prev,
        farmSlots: slots,
        farmLastClaim: resetTime ? now : prev.farmLastClaim,
        farmEntryTimes: newEntryTimes,
      };
    });
  }, []);

  const processFarmEvolutions = useCallback(() => {
    setState((prev) => {
      let collection = [...prev.collection];
      let farmSlots = [...prev.farmSlots];
      let farmEntryTimes = { ...prev.farmEntryTimes };
      const now = Date.now();
      const ONE_DAY = 24 * 60 * 60 * 1000;
      let changed = false;

      for (const ownedId of [...farmSlots]) {
        const owned = collection.find((c) => c.ownedId === ownedId);
        if (!owned) continue;
        const char = getCharacter(owned.characterId);
        if (!char) continue;
        const rarity = char.rarity as string;
        if (!PRE_ROOKIE_STAGE_RARITIES.has(rarity as any)) continue;

        const entryTime = farmEntryTimes[ownedId] ?? now;
        const elapsed = now - entryTime;

        if ((rarity === 'EGG' || rarity === 'BABY') && elapsed >= ONE_DAY) {
          const target = rarity === 'EGG'
            ? getRandomHatchTarget(char.element)
            : getFarmEvolutionTarget(owned.characterId);
          if (target) {
            collection = collection.map((c) =>
              c.ownedId === ownedId ? { ...c, characterId: target, level: 1, exp: 0 } : c
            );
            farmEntryTimes[ownedId] = now;
            changed = true;
          }
        } else if (rarity === 'TRAINING' && owned.level >= 5) {
          const target = getFarmEvolutionTarget(owned.characterId);
          if (target) {
            collection = collection.map((c) =>
              c.ownedId === ownedId ? { ...c, characterId: target, level: 1, exp: 0 } : c
            );
            farmSlots = farmSlots.filter((id) => id !== ownedId);
            delete farmEntryTimes[ownedId];
            changed = true;
          }
        }
      }

      if (!changed) return prev;
      return { ...prev, collection, farmSlots, farmEntryTimes };
    });
  }, []);

  const isDailyDungeonAvailable = state.lastDailyDate !== getTodayDateString();

  const isStageCleared = useCallback(
    (mapId: string, stageIndex: number) => {
      return !!state.clearedStages[`${mapId}-${stageIndex}`];
    },
    [state.clearedStages],
  );

  const isMapUnlocked = useCallback(
    (mapId: string) => {
      const map = GAME_MAPS.find((m) => m.id === mapId);
      if (!map) return false;
      if (map.requiredTamerLevel) {
        if (state.tamerLevel < map.requiredTamerLevel) return false;
      }
      if (!map.requiredMapCleared) return true;
      const required = GAME_MAPS.find((m) => m.id === map.requiredMapCleared);
      if (!required) return false;
      return required.stages.every((s) => state.clearedStages[`${map.requiredMapCleared}-${s.index}`]);
    },
    [state.clearedStages, state.tamerLevel],
  );

  const totalEquipBonus = useCallback((): Partial<Record<string, number>> => {
    const { EQUIPMENT_ITEMS } = require('@/constants/gameData');
    const result: Record<string, number> = {};
    EQUIP_SLOTS_ORDER.forEach((slot) => {
      const itemId = state.equippedItems[slot];
      if (!itemId) return;
      const item = EQUIPMENT_ITEMS.find((i: { id: string }) => i.id === itemId);
      if (!item) return;
      Object.entries(item.bonuses as Record<string, number>).forEach(([k, v]) => {
        result[k] = (result[k] ?? 0) + (v as number);
      });
    });
    const digiviceId = state.equippedItems.digivice;
    if (digiviceId) {
      const appliedCards = (state.digiviceCards ?? {})[digiviceId] ?? [];
      appliedCards.forEach((cardId) => {
        const card = CARD_DEFINITIONS.find((entry) => entry.id === cardId);
        Object.entries((card?.bonuses ?? {}) as Record<string, number>).forEach(([k, v]) => {
          result[k] = (result[k] ?? 0) + v;
        });
      });
    }
    return result;
  }, [state.equippedItems, state.digiviceCards]);

  const totalPlayerLevel = state.tamerLevel;
  const unreadMailCount = state.messages.filter(
    (m) => !m.isRead && (!m.unlocksAtTamerLevel || state.tamerLevel >= m.unlocksAtTamerLevel)
  ).length;

  const selectedCharacter = state.collection.find((c) => c.ownedId === state.selectedOwnedId) ?? null;

  const loadFromCloud = useCallback(async (apiUrl: string) => {
    try {
      const token = await AsyncStorage.getItem('omega_dx10_auth_token');
      if (!token) return;

      // The player save is the first priority. Custom content must never block
      // account hydration: a slow /digimons/catalog or /overrides request used to
      // leave GameContext on defaultState (1 Agumon) while the app entered the tabs.
      const customContentPromise = Promise.all([
        fetch(`${apiUrl}/digimons/catalog`).then((r) => r.ok ? r.json() : null).catch(() => null),
        fetch(`${apiUrl}/overrides`).then((r) => r.ok ? r.json() : null).catch(() => null),
      ]).then(([customData, overridesData]) => {
        if (customData?.digimons) {
          loadCustomCharacters(customData.digimons, apiUrl);
          setState((prev) => ({
            ...prev,
            collection: prev.collection.map((owned) => ({
              ...owned,
              characterId: migrateLegacyCharacterId(owned.characterId),
            })),
            scanProgress: Object.fromEntries(
              Object.entries(prev.scanProgress ?? {}).map(([id, amount]) => [migrateLegacyCharacterId(id), amount]),
            ),
          }));
        }
        if (overridesData?.overrides) loadCharacterOverrides(overridesData.overrides, apiUrl);
        if (customData?.digimons || overridesData?.overrides) setCustomCharsRevision((v) => v + 1);
        setCustomCharsReady(true);
      }).catch(() => {
        setCustomCharsReady(true);
      });

      // Items e mapas podem carregar em background (não afetam lista de personagens)
      fetch(`${apiUrl}/items`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data?.items) { loadCustomItems(data.items, apiUrl); setCustomEquipItems(getCustomEquipmentItems()); } })
        .catch(() => {});
      fetch(`${apiUrl}/maps`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data?.maps) { loadCustomMaps(data.maps, apiUrl); setCustomGameMaps(getCustomGameMaps()); } })
        .catch(() => {});
      const res = await fetch(`${apiUrl}/saves`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) {
        // Brand-new account: no cloud save exists yet.
        // IMPORTANT: never delete this account's local backup here. A cache clear,
        // transient server mismatch or temporary 404 must not destroy recoverable progress.
        const localRaw = await AsyncStorage.getItem(storageKey);
        if (localRaw) {
          try {
            const localData = JSON.parse(localRaw) as Partial<GameState>;
            if (isMeaningfulSave(localData)) {
              const restoredState = { ...defaultState, ...localData } as GameState;
              stateRef.current = restoredState;
              setState(restoredState);
              setLoaded(true);
              return;
            }
          } catch {
            // Keep the local bytes untouched for manual/cloud recovery.
          }
        }
        stateRef.current = defaultState;
        setState(defaultState);
        setLoaded(true);
        return;
      }
      if (!res.ok) return;
      const payload = await res.json() as { saveData: Partial<GameState & { playerName?: string; _savedAt?: number }>; isAdmin?: boolean; isDede?: boolean; updatedAt?: string };
      const { saveData, isAdmin, isDede, updatedAt } = payload;
      if (!saveData) return;

      // A blank/default cloud record must never replace meaningful local progress.
      const localBeforeCloudRaw = await AsyncStorage.getItem(storageKey);
      if (!isMeaningfulSave(saveData) && localBeforeCloudRaw) {
        try {
          const localBeforeCloud = JSON.parse(localBeforeCloudRaw) as Partial<GameState>;
          if (isMeaningfulSave(localBeforeCloud)) return;
        } catch {
          return;
        }
      }

      // Compare timestamps: if local save is newer, keep local but still merge new server messages
      const localRaw = await AsyncStorage.getItem(storageKey);
      if (localRaw) {
        try {
          const localData = JSON.parse(localRaw) as { _savedAt?: number; isOnboarded?: boolean };
          const localSavedAt = localData._savedAt ?? 0;
          // Use _savedAt embedded in saveData (reflects actual player save time).
          // Admin injections update DB updatedAt but do NOT change _savedAt in saveData,
          // so this prevents admin mail from triggering a full server-side overwrite.
          const serverSavedAt = (saveData as any)._savedAt as number | undefined;
          const serverUpdatedAt = serverSavedAt ?? (updatedAt ? new Date(updatedAt).getTime() : 0);
          // If local has meaningful data and is newer than server, keep local state
          // but still merge any new messages the admin may have sent
          const localCollectionCount = Array.isArray((localData as any).collection) ? (localData as any).collection.length : 0;
          const serverCollectionCount = Array.isArray((saveData as any).collection) ? (saveData as any).collection.length : 0;
          const localHasCatastrophicCollectionLoss =
            serverCollectionCount >= 10
            && localCollectionCount <= Math.floor(serverCollectionCount / 2)
            && (serverCollectionCount - localCollectionCount) >= 10;

          // A newer local timestamp must never make a catastrophically smaller
          // collection override a healthy cloud save (e.g. 1 local vs 77 server).
          if (localData.isOnboarded && localSavedAt > serverUpdatedAt + 5000 && !localHasCatastrophicCollectionLoss && serverCollectionCount === 0) {
            const serverMessages: MailMessage[] = (saveData.messages ?? []) as MailMessage[];
            const serverTamerLevel = (saveData as any).tamerLevel as number | undefined;
            const serverGemas = (saveData as any).gemas as number | undefined;
            setState((prev) => {
              let updated = { ...prev };
              // Always take the higher tamerLevel (server can boost via seed/admin)
              if (serverTamerLevel && serverTamerLevel > prev.tamerLevel) {
                updated = { ...updated, tamerLevel: serverTamerLevel };
              }
              // Always take the higher gemas (admin may have added gems directly)
              if (serverGemas !== undefined && serverGemas > prev.gemas) {
                updated = { ...updated, gemas: serverGemas };
              }
              if (serverMessages.length > 0) {
                const localIds = new Set(prev.messages.map((m) => m.id));
                const newFromServer = serverMessages.filter((m) => !localIds.has(m.id));
                if (newFromServer.length > 0) {
                  updated = { ...updated, messages: [...newFromServer, ...prev.messages].sort((a, b) => b.createdAt - a.createdAt) };
                }
              }
              return updated;
            });
            return;
          }
        } catch {}
      }

      const parsed = saveData;
      const hadPreviousSave = !!parsed.playerName && parsed.playerName !== '';
      const savedMessages: MailMessage[] = parsed.messages ?? [];
      const savedIds = new Set(savedMessages.map((m) => m.id));
      const merged = [
        ...DEFAULT_MESSAGES.filter((m) => !savedIds.has(m.id)),
        ...savedMessages,
      ].sort((a, b) => b.createdAt - a.createdAt);
      await customContentPromise;
      const migratedCollection = (saveData.collection ?? defaultState.collection)
        .map((owned: OwnedCharacter) => ({ ...owned, characterId: migrateLegacyCharacterId(owned.characterId) }));
      const collection: OwnedCharacter[] = migrateClaimedMailGiftStars(
        migratedCollection,
        merged,
      );
      const migratedScanProgress = Object.fromEntries(Object.entries(saveData.scanProgress ?? defaultState.scanProgress).map(([id, amount]) => [migrateLegacyCharacterId(id), amount]));

      const newState: GameState = {
        ...defaultState,
        ...parsed,
        collection,
        scanProgress: migratedScanProgress,
        gender: parsed.gender ?? 'M',
        inventory: migrateEvolutionInventory(parsed.inventory ?? DEFAULT_INVENTORY),
        equippedItems: { ...defaultEquipped, ...(parsed.equippedItems ?? {}) },
        pieces: migrateEvolutionPieces(parsed.pieces ?? {}),
        bits: parsed.bits ?? 0,
        tamerExp: parsed.tamerExp ?? 0,
        tamerLevel: parsed.tamerLevel ?? 1,
        tamerId: parsed.tamerId ?? null,
        isOnboarded: parsed.isOnboarded ?? hadPreviousSave,
        team: parsed.team ?? [],
        messages: merged,
        lastDailyDate: parsed.lastDailyDate ?? '',
        isAdmin: isDede ?? isAdmin ?? false,
        farmSlots: parsed.farmSlots ?? [],
        farmLastClaim: parsed.farmLastClaim ?? Date.now(),
        farmEntryTimes: (parsed as any).farmEntryTimes ?? {},
        farmFoods: (parsed as any).farmFoods ?? {},
        farmLastFeed: (parsed as any).farmLastFeed ?? {},
        farmBattleRequests: (parsed as any).farmBattleRequests ?? {},
        farmDailyRewardClaim: (parsed as any).farmDailyRewardClaim ?? '',
        farmWeeklyRewardClaim: (parsed as any).farmWeeklyRewardClaim ?? 0,
        farmDecorations: (parsed as any).farmDecorations ?? [],
        farmDecorInventory: mergeDefaultDecorInventory((parsed as any).farmDecorInventory ?? {}),
        bossCooldowns: (parsed as any).bossCooldowns ?? {},
        gemas: (parsed as any).gemas ?? 1000,
        gachaContadorPity: (parsed as any).gachaContadorPity ?? 0,
        ultimoTiroGratis: (parsed as any).ultimoTiroGratis ?? null,
      };
      setState(newState);
      await AsyncStorage.setItem(storageKey, JSON.stringify({ ...newState, _savedAt: Date.now() }));
      // Authenticated GameProvider intentionally stays unloaded until cloud hydration.
      // Mark it loaded only after the authoritative server save has been applied.
      setLoaded(true);
      void customContentPromise;
      setLoaded(true);
    } catch {
      // CRITICAL: authenticated accounts are cloud-authoritative.
      // Never mark the game as loaded with defaultState after a network/API error.
      // Doing so sends the player through onboarding with the 1-Digimon starter
      // state and creates the visible "account keeps resetting" loop.
      setCustomCharsReady(true);
      if (!user?.id) setLoaded(true);
    }
  }, [storageKey, isMeaningfulSave, user?.id]);

  const resetGame = useCallback(async () => {
    await AsyncStorage.removeItem(storageKey);
    setState(defaultState);
  }, [storageKey]);

  return (
    <GameContext.Provider
      value={{
        ...state,
        selectedCharacter,
        customEquipItems,
        customGameMaps,
        addToCollection,
        gainExp,
        clearStage,
        setSelectedCharacter,
        setPlayerName,
        isStageCleared,
        isMapUnlocked,
        gainScan,
        createFromScan,
        evolveDigimon,
        changeFormDigimon,
        fuseDigimon,
        sacrificeDigimon,
        totalPlayerLevel,
        setGender,
        equipItem,
        unequipItem,
        totalEquipBonus,
        gainPiece,
        ascendDigimon,
        craftGoldenAscensionStar,
        claimStarryNightReward,
        craftItem,
        applyCardToDigivice,
        gainBits,
        gainTamerExp,
        useTamerXpItem,
        gainGemas,
        addToInventory,
        isLoaded: loaded,
        completeOnboarding,
        unreadMailCount,
        readMessage,
        claimReward,
        useXpItem,
        setTeam,
        getSaveSnapshot,
        loadFromCloud,
        refreshCustomData: loadFromCloud,
        isDailyDungeonAvailable,
        claimDailyDungeon,
        setFarmSlots,
        processFarmEvolutions,
        addFarmFood,
        feedFarmDigimon,
        completeFarmBattle,
        generateFarmBattleRequests,
        claimFarmDailyReward,
        gainFarmDecor,
        placeFarmDecoration,
        moveFarmDecoration,
        mirrorFarmDecoration,
        removeFarmDecoration,
        placeAsfaltoAutoConnect,
        moveAsfaltoAutoConnect,
        setBossCooldown,
        isBossOnCooldown,
        realizarTiroGacha,
        isTiroGratisDisponivel: state.ultimoTiroGratis !== getTodayDateString(),
        gachaAdminPool,
        setGachaAdminPool,
        resetGame,
        customCharsRevision,
        customCharsReady,
        setTamerId,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
