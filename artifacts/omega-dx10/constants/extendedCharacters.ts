import { Character, CHARACTERS, EVOLUTIONS, ALTERNATE_EVOLUTIONS, EXTRA_ALTERNATE_EVOLUTIONS, HARDCODED_ALTERNATE_EVOLUTIONS, FUSIONS, SACRIFICE_DROPS } from './gameData';
import CHARACTER_IMAGES from './characterImages';

interface CatalogCharacterEntry extends Character {
  dbId: number;
  scannable: boolean;
  imageScale: number;
  imageApiUrl?: string;
}

interface OverrideEntry {
  name?: string; attribute?: string; rarity?: string; element?: string;
  hp?: number; mp?: number; atk?: number; def?: number; spt?: number; spd?: number;
  description?: string; attackName?: string; attackElement?: string;
  spiritName?: string; spiritElement?: string;
  imageScale?: number; scannable?: boolean; overrideImageUrl?: string;
}

let _catalogChars: Record<string, CatalogCharacterEntry> = {};
let _rawCatalogDigimons: CatalogDigimonRaw[] = [];
let _overrides: Record<string, OverrideEntry> = {};
let _apiUrl = '';
let _baseCharImageUrls: Record<string, string> = {};
let _legacyCharacterIds = new Map<string, string>();

export function migrateLegacyCharacterId(id: string): string {
  return _legacyCharacterIds.get(id) ?? id;
}
// farmEvoMap: fromCharId → targetCharId  (for BABY/TRAINING pre-rookie chain)
let _farmEvoMap: Record<string, string> = {};
// element → list of BABY/TRAINING character IDs eligible to hatch from each Digitama.
let _elementBabyMap: Record<string, string[]> = {};

// Digitama pools are derived from the live canonical catalogue.
// Only BABY/TRAINING Digimon are hatchable; the element stored in the catalogue
// is the single source of truth for both the card badge and the matching Digitama.
// Forms whose innate Divine Gift was unlocked through a Sacred Ring evolution.
// The item is consumed during evolution; battle checks only the resulting form.
let _divineGiftCharacterIds = new Set<string>(['ophanimon', 'seraphimon', 'slashAngemon']);
// Track base char IDs that were registered as evolution targets by catalogue processing
let _registeredBaseCharKeys: Set<string> = new Set();
let _registeredFusionKeys: Set<string> = new Set();

const LEGACY_CHARACTER_NAME_ALIASES: Record<string, string> = {
  custom_313: 'ryudamon',
  custom_356: 'dorulumon',
};

export interface CatalogDigimonRaw {
  id: string; dbId: number; name: string; attribute: string; rarity: string; element: string;
  baseStats: { hp: number; mp: number; atk: number; def: number; spt: number; spd: number; apt: number };
  description: string; attackName?: string; attackElement?: string;
  spiritName?: string; spiritElement?: string;
  isBaseForm: boolean; evolvesFromId?: string; requiredLevel?: number;
  requiredItem?: string; requiredSacrificeCharacter?: string;
  isFusion: boolean; fusionPartner?: string;
  scannable: boolean; hasImage: boolean; imageMimeType?: string; imageScale: number; imageUpdatedAt?: number;
}

// Aliases: catalogue names that should map to a base character ID
// e.g. "Omnimon" in the DB is the same Digimon as base "omegamon"
const CHAR_NAME_ALIASES: Record<string, string> = {
  'omnimon': 'omegamon',
  'megalogrowmon': 'megaloGrowlmon',
};

// Spirit sacrifice drops: when a Frontier Warrior Digimon is sacrificed,
// it drops its corresponding Spirit piece (used for crafting / Susanoomon evolution).
const SPIRIT_SACRIFICE_DROPS_BY_NAME: Record<string, { itemId: string; chance: number }[]> = {
  'Agnimon':          [{ itemId: 'spirit_humano_fogo',      chance: 1.0 }],
  'BurningGreymon':   [{ itemId: 'spirit_besta_fogo',       chance: 1.0 }],
  'Kazemon':          [{ itemId: 'spirit_humano_vento',     chance: 1.0 }],
  'Zephyrmon':        [{ itemId: 'spirit_besta_vento',      chance: 1.0 }],
  'Beetlemon':        [{ itemId: 'spirit_humano_raio',      chance: 1.0 }],
  'MetalKabuterimon': [{ itemId: 'spirit_besta_raio',       chance: 1.0 }],
  'Lobomon':          [{ itemId: 'spirit_humano_luz',       chance: 1.0 }],
  'KendoGarurumon':   [{ itemId: 'spirit_besta_luz',        chance: 1.0 }],
  'Kumamon':          [{ itemId: 'spirit_humano_gelo',      chance: 1.0 }],
  'Korikakumon':      [{ itemId: 'spirit_besta_gelo',       chance: 1.0 }],
  'Loweemon':         [{ itemId: 'spirit_humano_escuridao', chance: 1.0 }],
  'KaiserLeomon':     [{ itemId: 'spirit_besta_escuridao',  chance: 1.0 }],
  'Ranamon':          [{ itemId: 'spirit_humano_agua',      chance: 1.0 }],
  'Calmaramon':       [{ itemId: 'spirit_besta_agua',       chance: 1.0 }],
  'Grumblemon':       [{ itemId: 'spirit_humano_terra',     chance: 1.0 }],
  'Gigasmon':         [{ itemId: 'spirit_besta_terra',      chance: 1.0 }],
  'Arbormon':         [{ itemId: 'spirit_humano_madeira',   chance: 1.0 }],
  'Petaldramon':      [{ itemId: 'spirit_besta_madeira',    chance: 1.0 }],
};

// Build a name→id lookup for base CHARACTERS (computed once per module load)
function buildBaseNameMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [id, char] of Object.entries(CHARACTERS)) {
    map[char.name.toLowerCase()] = id;
  }
  for (const [alias, id] of Object.entries(CHAR_NAME_ALIASES)) {
    map[alias] = id;
  }
  return map;
}
const BASE_NAME_MAP = buildBaseNameMap();

// Normalized name → VG image lookup: strips non-alphanumeric chars and lowercases
// so "BlackWarGreymon" → "blackwargreymon" matches key "blackWarGreymon"
const _normKey = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const VARIANT_LEVEL_BY_RARITY: Partial<Record<Character['rarity'], number>> = {
  ROOKIE: 15, CHAMPION: 25, ULTIMATE: 45, MEGA: 60, ULTRA: 70, BURST: 70,
};

// A trailing X is an X-Antibody form only when the catalogue also contains
// the same name without that X. This avoids false matches such as JesmonGX.
// The Black prefix follows the same counterpart rule.
function applyVariantEvolutionRules(chars: CatalogDigimonRaw[]): CatalogDigimonRaw[] {
  const idByName = new Map<string, string>();
  for (const [id, character] of Object.entries(CHARACTERS)) idByName.set(_normKey(character.name), id);
  for (const character of chars) {
    if (character.name) idByName.set(_normKey(character.name), character.id);
  }

  return chars.map((character) => {
    const key = _normKey(character.name ?? '');
    let counterpartId: string | undefined;
    let requiredItem: string | undefined;
    if (key.endsWith('x')) {
      counterpartId = idByName.get(key.slice(0, -1));
      if (counterpartId) requiredItem = 'x_antibody';
    }
    if (!counterpartId && key.startsWith('black')) {
      counterpartId = idByName.get(key.slice('black'.length));
      if (counterpartId) requiredItem = 'black_digitron';
    }
    if (!counterpartId || !requiredItem || counterpartId === character.id) return character;
    return {
      ...character,
      evolvesFromId: counterpartId,
      requiredItem,
      requiredLevel: character.requiredLevel ?? VARIANT_LEVEL_BY_RARITY[character.rarity as Character['rarity']] ?? 20,
      isBaseForm: false,
      scannable: false,
    };
  });
}
const LUCEMON_CANONICAL_RARITIES: Record<string, Character['rarity']> = {
  puttimon: 'BABY',
  cupimon: 'TRAINING',
  lucemon: 'ROOKIE',
  lucemonchaosmode: 'ULTIMATE',
  lucemonsatanmode: 'MEGA',
  lucemonlarvamode: 'MEGA',
};
const KUDAMON_LINE_CANONICAL_RARITIES: Record<string, Character['rarity']> = {
  pafumon: 'BABY',
  kyaromon: 'TRAINING',
  kudamon: 'ROOKIE',
  kudamonsaver: 'ROOKIE',
  reppamon: 'CHAMPION',
  chirinmon: 'ULTIMATE',
  tyilinmon: 'ULTIMATE',
  kentaurusmon: 'MEGA',
};
const CHRONOMON_LINE_CANONICAL_RARITIES: Record<string, Character['rarity']> = {
  chichimon: 'TRAINING',
  hyokomon: 'ROOKIE',
  buraimon: 'CHAMPION',
  butenmon: 'ULTIMATE',
  chronomonhm: 'MEGA',
  chronomondm: 'MEGA',
};
const FIRE_LINE_CANONICAL_RARITIES: Record<string, Character['rarity']> = {
  mokumon: 'BABY',
  fukamon: 'TRAINING',
  candlemon: 'ROOKIE',
  demimeramon: 'ROOKIE',
};
const _IMAGE_BY_NORM: Record<string, any> = (() => {
  const map: Record<string, any> = {};
  for (const [key, val] of Object.entries(CHARACTER_IMAGES as Record<string, any>)) {
    map[_normKey(key)] = val;
  }
  return map;
})();

export function getRawCatalogDigimons(): CatalogDigimonRaw[] {
  return _rawCatalogDigimons;
}

export function loadCharacterCatalog(chars: CatalogDigimonRaw[], apiUrl: string) {
  // Runtime identity is name-based and stable. Database row numbers are metadata only.
  // Convert every legacy legacy database IDs relation before it can reach gameplay/save data.
  const stableIdByLegacyId = new Map<string, string>();
  for (const entry of chars) {
    const baseId = entry.name ? BASE_NAME_MAP[entry.name.toLowerCase()] : undefined;
    // Static game entries (especially eggs) are canonical and must never be
    // re-identified by a stale custom_<dbId> from the server catalogue.
    const canonicalId = baseId ?? `name:${entry.name}`;
    stableIdByLegacyId.set(entry.id, canonicalId);
    // One-way compatibility for old DB relations/saves created before stable IDs.
    // Do not let a stale custom row hijack an existing canonical game ID.
    if (!CHARACTERS[`custom_${entry.dbId}`]) {
      stableIdByLegacyId.set(`custom_${entry.dbId}`, canonicalId);
    }
  }
  _legacyCharacterIds = stableIdByLegacyId;
  const stableId = (value?: string): string | undefined => {
    if (!value) return undefined;
    return stableIdByLegacyId.get(value) ?? value;
  };
  chars = chars.map((entry) => ({
    ...entry,
    id: stableIdByLegacyId.get(entry.id) ?? `name:${entry.name}`,
    evolvesFromId: stableId(entry.evolvesFromId),
    requiredSacrificeCharacter: stableId(entry.requiredSacrificeCharacter),
    fusionPartner: stableId(entry.fusionPartner),
  }));

  // The API can still contain the old Lucemon stages/parents. Normalize them
  // before building either the farm chain or the regular evolution tree.
  const puttimonId = chars.find((c) => _normKey(c.name ?? '') === 'puttimon')?.id;
  const cupimonId = chars.find((c) => _normKey(c.name ?? '') === 'cupimon')?.id;
  chars = chars.map((c) => {
    const name = _normKey(c.name ?? '');
    if (name === 'puttimon') {
      return { ...c, rarity: 'BABY', evolvesFromId: undefined };
    }
    if (name === 'cupimon') {
      return { ...c, rarity: 'TRAINING', ...(puttimonId ? { evolvesFromId: puttimonId } : {}) };
    }
    if (name === 'lucemon') {
      return {
        ...c,
        rarity: 'ROOKIE',
        ...(cupimonId ? { evolvesFromId: cupimonId, requiredLevel: 12 } : {}),
      };
    }
    const canonicalRarity = LUCEMON_CANONICAL_RARITIES[name] ?? KUDAMON_LINE_CANONICAL_RARITIES[name] ?? CHRONOMON_LINE_CANONICAL_RARITIES[name] ?? FIRE_LINE_CANONICAL_RARITIES[name];
    return canonicalRarity ? { ...c, rarity: canonicalRarity } : c;
  });

  chars = applyVariantEvolutionRules(chars);

  // Evolution requirements stored by the API may use display names while the
  // collection stores canonical character IDs. Normalize both forms here so a
  // sacrifice cannot be bypassed by a stale/custom catalog record.
  const resolveEvolutionCharacterId = (value?: string): string | undefined => {
    if (!value) return undefined;
    if (CHARACTERS[value]) return value;
    const normalized = _normKey(value);
    const baseId = Object.entries(CHARACTERS).find(([, character]) => _normKey(character.name) === normalized)?.[0];
    if (baseId) return baseId;
    const custom = chars.find((character) => _normKey(character.name ?? '') === normalized);
    return custom?.id ?? value;
  };

  chars = chars.map((c) => {
    const isOmnimonFusion = _normKey(c.name ?? '') === 'omnimon' && c.isFusion;
    return {
      ...c,
      requiredSacrificeCharacter: resolveEvolutionCharacterId(
        c.requiredSacrificeCharacter ?? (isOmnimonFusion ? 'MetalGarurumon' : undefined),
      ),
    };
  });

  _apiUrl = apiUrl;
  _rawCatalogDigimons = chars;
  _catalogChars = {};
  _farmEvoMap = {};
  _elementBabyMap = {};
  _divineGiftCharacterIds = new Set<string>(['ophanimon', 'seraphimon']);
  _baseCharImageUrls = {};

  for (const c of chars) {
    if (c.requiredItem !== 'anel_sagrado') continue;
    const targetId = (c.name ? BASE_NAME_MAP[c.name.toLowerCase()] : undefined) ?? c.id;
    _divineGiftCharacterIds.add(targetId);
  }

  for (const c of chars) {
    if (!c.name) continue; // skip entries with null/undefined name (bad DB data)
    // Every server catalogue row belongs to the ONE runtime Digimon registry.
    // Legacy bundled IDs are used only as stable aliases for old saves/relations;
    // they must never form a second roster or be skipped from the server catalogue.
    const baseId = BASE_NAME_MAP[c.name.toLowerCase()];
    const canonicalId = baseId ?? c.id;
    if (c.hasImage) {
      _baseCharImageUrls[canonicalId] = `${apiUrl}/digimons/catalog/${c.dbId}/image?v=${c.imageUpdatedAt ?? 0}`;
    }

    _catalogChars[canonicalId] = {
      id: canonicalId, dbId: c.dbId, name: c.name,
      attribute: c.attribute as Character['attribute'],
      rarity: c.rarity as Character['rarity'],
      element: c.element as Character['element'],
      baseStats: c.baseStats, description: c.description,
      attackName: c.attackName, attackElement: c.attackElement as Character['attackElement'],
      spiritName: c.spiritName, spiritElement: c.spiritElement as Character['spiritElement'],
      scannable: c.scannable, imageScale: c.imageScale ?? 0.8,
      imageApiUrl: c.hasImage ? `${apiUrl}/digimons/catalog/${c.dbId}/image?v=${c.imageUpdatedAt ?? 0}` : undefined,
    };

  }

  // Build farm evolution map: BABY→TRAINING, TRAINING→ROOKIE
  const PRE_CHAIN = new Set(['BABY', 'TRAINING', 'ROOKIE']);
  for (const c of chars) {
    if (c.evolvesFromId && PRE_CHAIN.has(c.rarity)) {
      const fromChar = chars.find((x) => x.id === c.evolvesFromId);
      if (fromChar && ['BABY', 'TRAINING'].includes(fromChar.rarity)) {
        _farmEvoMap[c.evolvesFromId] = c.id;
      }
    }
  }

  // Build Digitama pools directly from the canonical live catalogue.
  // This prevents a Digimon from appearing in an egg whose element differs from its card.
  _elementBabyMap = {};
  for (const entry of chars) {
    if (entry.rarity !== 'BABY' && entry.rarity !== 'TRAINING') continue;
    const element = entry.element;
    if (!element) continue;
    const baseId = entry.name ? BASE_NAME_MAP[entry.name.toLowerCase()] : undefined;
    const id = baseId ?? entry.id;
    if (!_elementBabyMap[element]) _elementBabyMap[element] = [];
    if (!_elementBabyMap[element].includes(id)) _elementBabyMap[element].push(id);
  }

  // Clear evolution registrations created by the previous catalogue load.
  // Also clear base char keys that were registered by a previous custom run
  for (const key of _registeredBaseCharKeys) {
    delete (EVOLUTIONS as Record<string, unknown>)[key];
    delete (ALTERNATE_EVOLUTIONS as Record<string, unknown>)[key];
    delete (EXTRA_ALTERNATE_EVOLUTIONS as Record<string, unknown>)[key];
  }
  _registeredBaseCharKeys = new Set();
  // Clear fusion recipes generated from catalogue sacrifice relationships so stale
  // definitions cannot survive a reload and bypass the current sacrifice rules.
  for (const key of _registeredFusionKeys) delete FUSIONS[key];
  _registeredFusionKeys = new Set();

  // Register catalogue evolutions into EVOLUTIONS / ALTERNATE_EVOLUTIONS maps.
  // Sort Vaccine (VC) chars first so they always win the main EVOLUTIONS slot
  // when multiple Digimons evolve from the same parent (e.g. BetelGammamon vs GulusGammamon).
  const ATTR_ORDER: Record<string, number> = { VC: 0, DA: 1, FR: 2, VR: 3 };
  const SKIP_RARITIES = new Set(['EGG']);
  const sortedForEvo = [...chars].sort((a, b) =>
    (ATTR_ORDER[a.attribute] ?? 9) - (ATTR_ORDER[b.attribute] ?? 9)
  );
  for (const c of sortedForEvo) {
    if (!c.evolvesFromId || SKIP_RARITIES.has(c.rarity)) continue;

    // Resolve the actual target ID: if this custom char's name matches a base char, use the base char's ID
    const targetId = (c.name ? BASE_NAME_MAP[c.name.toLowerCase()] : undefined) ?? c.id;

    const fromId = c.evolvesFromId;

    const hasSacrifice = !!c.requiredSacrificeCharacter;
    const mainTarget = EVOLUTIONS[fromId]?.evolvesTo;
    const altTarget  = ALTERNATE_EVOLUTIONS[fromId]?.evolvesTo;

    if (hasSacrifice) {
      const sacrificeId = resolveEvolutionCharacterId(c.requiredSacrificeCharacter!);
      if (sacrificeId) {
        const recipes = FUSIONS[fromId] ?? (FUSIONS[fromId] = []);
        _registeredFusionKeys.add(fromId);
        if (!recipes.some((recipe) => recipe.resultId === targetId && recipe.partner === sacrificeId)) {
          recipes.push({
            partner: sacrificeId,
            resultId: targetId,
            resultName: c.name,
            requiredLevel: c.requiredLevel ?? 1,
            requiredItem: c.requiredItem,
          });
        }
      }
    } else if (!EVOLUTIONS[fromId]) {
      EVOLUTIONS[fromId] = {
        evolvesTo: targetId,
        requiredLevel: c.requiredLevel ?? 1,
        label: c.name,
        requiredItem: c.requiredItem,
      };
      _registeredBaseCharKeys.add(fromId);
    } else if (c.requiredItem && !ALTERNATE_EVOLUTIONS[fromId] && mainTarget !== targetId) {
      ALTERNATE_EVOLUTIONS[fromId] = {
        evolvesTo: targetId,
        requiredLevel: c.requiredLevel ?? 1,
        label: c.name,
        requiredItem: c.requiredItem,
      };
      _registeredBaseCharKeys.add(fromId);
    } else if (c.requiredItem && !EXTRA_ALTERNATE_EVOLUTIONS[fromId] && mainTarget !== targetId && altTarget !== targetId) {
      EXTRA_ALTERNATE_EVOLUTIONS[fromId] = {
        evolvesTo: targetId,
        requiredLevel: c.requiredLevel ?? 1,
        label: c.name,
        requiredItem: c.requiredItem,
      };
      _registeredBaseCharKeys.add(fromId);
    }
  }

  // Sacrifice relationships are registered only in FUSIONS.
  // ALTERNATE_EVOLUTIONS and EXTRA_ALTERNATE_EVOLUTIONS are item-only.

  // Re-inject hardcoded alternate evolutions (4 Celestial Beasts → Huanglongmon, etc.)
  // These are added AFTER the clearing loop so they always survive reloads.
  for (const [key, val] of Object.entries(HARDCODED_ALTERNATE_EVOLUTIONS)) {
    ALTERNATE_EVOLUTIONS[key] = val;
  }

  // Keep this line authoritative even when stale API relationships are loaded.
  // Puttimon/Cupimon IDs come from the database, so resolve them by name.
  if (puttimonId && cupimonId) {
    const evolutionMaps = [EVOLUTIONS, ALTERNATE_EVOLUTIONS, EXTRA_ALTERNATE_EVOLUTIONS];
    for (const map of evolutionMaps) {
      for (const [fromId, evolution] of Object.entries(map)) {
        if ((evolution.evolvesTo === puttimonId || evolution.evolvesTo === cupimonId) && fromId !== puttimonId) {
          delete map[fromId];
        }
      }
    }

    delete ALTERNATE_EVOLUTIONS[puttimonId];
    delete ALTERNATE_EVOLUTIONS[cupimonId];
    delete EXTRA_ALTERNATE_EVOLUTIONS[puttimonId];
    delete EXTRA_ALTERNATE_EVOLUTIONS[cupimonId];
    EVOLUTIONS[puttimonId] = { evolvesTo: cupimonId, requiredLevel: 1, label: 'Cupimon' };
    EVOLUTIONS[cupimonId] = { evolvesTo: 'lucemon', requiredLevel: 12, label: 'Lucemon' };
    _farmEvoMap[puttimonId] = cupimonId;
    _farmEvoMap[cupimonId] = 'lucemon';
  }

  // These base entries may have been removed while refreshing custom data.
  EVOLUTIONS.lucemon = { evolvesTo: 'lucemonChaosMode', requiredLevel: 40, label: 'Lucemon Chaos Mode' };
  ALTERNATE_EVOLUTIONS.lucemonChaosMode = {
    evolvesTo: 'lucemonSatanMode',
    requiredLevel: 50,
    label: 'Lucemon Satan Mode',
    requiredItem: 'gehenna',
  };

  // Keep Agumon and Agumon Savers separate. The two alternate slots of classic
  // Agumon are reserved for its item-unlocked X and Black variants.
  EVOLUTIONS.agumon = { evolvesTo: 'greymon', requiredLevel: 16, label: 'Greymon' };
  const agumonX = chars.find((c) => _normKey(c.name ?? '') === 'agumonx');
  const blackAgumon = chars.find((c) => _normKey(c.name ?? '') === 'blackagumon');
  if (agumonX) {
    ALTERNATE_EVOLUTIONS.agumon = { evolvesTo: agumonX.id, requiredLevel: agumonX.requiredLevel ?? 15, label: agumonX.name, requiredItem: 'x_antibody' };
  }
  if (blackAgumon) {
    EXTRA_ALTERNATE_EVOLUTIONS.agumon = { evolvesTo: blackAgumon.id, requiredLevel: blackAgumon.requiredLevel ?? 15, label: blackAgumon.name, requiredItem: 'black_digitron' };
  }
  EVOLUTIONS.agumonSaver = { evolvesTo: 'geoGreymon', requiredLevel: 20, label: 'GeoGreymon' };

  // Fire line fixed by game design: Mokumon (Baby) -> Fukamon (Training) -> Candlemon (Rookie).
  const mokumon = chars.find((char) => _normKey(char.name ?? '') === 'mokumon');
  const fukamon = chars.find((char) => _normKey(char.name ?? '') === 'fukamon');
  const candlemon = chars.find((char) => _normKey(char.name ?? '') === 'candlemon');
  const demimeramon = chars.find((char) => _normKey(char.name ?? '') === 'demimeramon');
  if (mokumon && fukamon && candlemon) {
    // These three are one authoritative line; remove stale outgoing branches.
    delete ALTERNATE_EVOLUTIONS[mokumon.id];
    delete EXTRA_ALTERNATE_EVOLUTIONS[mokumon.id];
    delete ALTERNATE_EVOLUTIONS[fukamon.id];
    delete EXTRA_ALTERNATE_EVOLUTIONS[fukamon.id];

    EVOLUTIONS[mokumon.id] = { evolvesTo: fukamon.id, requiredLevel: 1, label: 'Fukamon' };
    EVOLUTIONS[fukamon.id] = { evolvesTo: candlemon.id, requiredLevel: 12, label: 'Candlemon' };
    _farmEvoMap[mokumon.id] = fukamon.id;
    _farmEvoMap[fukamon.id] = candlemon.id;

    // Mokumon also has DemiMeramon as an alternate Rookie evolution.
    if (demimeramon) {
      ALTERNATE_EVOLUTIONS[mokumon.id] = {
        evolvesTo: demimeramon.id,
        requiredLevel: 12,
        label: 'DemiMeramon',
      };
    }
  }

  // Chronomon line fixed by game design:
  // Chichimon (Training) -> Hyokomon -> Buraimon -> Butenmon -> Chronomon HM / Chronomon DM.
  const findChronomonStage = (keys: string[]) =>
    chars.find((char) => keys.includes(_normKey(char.name ?? '')) || keys.includes(_normKey(char.id ?? '')));
  const chichimon = findChronomonStage(['chichimon']);
  const hyokomon = findChronomonStage(['hyokomon']);
  const buraimon = findChronomonStage(['buraimon']);
  const butenmon = findChronomonStage(['butenmon']);
  const chronomonHM = findChronomonStage(['chronomonhm']);
  const chronomonDM = findChronomonStage(['chronomondm']);

  const chronomonBaseLine = [chichimon, hyokomon, buraimon, butenmon].filter(Boolean);
  for (let i = 0; i < chronomonBaseLine.length - 1; i++) {
    const from = chronomonBaseLine[i]!;
    const to = chronomonBaseLine[i + 1]!;
    delete ALTERNATE_EVOLUTIONS[from.id];
    delete EXTRA_ALTERNATE_EVOLUTIONS[from.id];
    EVOLUTIONS[from.id] = {
      evolvesTo: to.id,
      requiredLevel: to.requiredLevel ?? (to.rarity === 'ROOKIE' ? 12 : to.rarity === 'CHAMPION' ? 20 : 40),
      label: to.name,
    };
    _farmEvoMap[from.id] = to.id;
  }

  if (butenmon && chronomonHM) {
    EVOLUTIONS[butenmon.id] = {
      evolvesTo: chronomonHM.id,
      requiredLevel: chronomonHM.requiredLevel ?? 60,
      label: 'Chronomon HM',
      requiredItem: 'anel_sagrado',
    };
    _divineGiftCharacterIds.add(chronomonHM.id);
  }
  if (butenmon && chronomonDM) {
    ALTERNATE_EVOLUTIONS[butenmon.id] = {
      evolvesTo: chronomonDM.id,
      requiredLevel: chronomonDM.requiredLevel ?? 60,
      label: 'Chronomon DM',
      requiredItem: 'chrono_core',
    };
  }

  // Kudamon line fixed by game design:
  // Pafumon -> Kyaromon -> Kudamon -> Reppamon -> Chirinmon -> Kentaurusmon.
  const findKudamonStage = (keys: string[]) =>
    chars.find((char) => keys.includes(_normKey(char.name ?? '')) || keys.includes(_normKey(char.id ?? '')));
  const pafumon = findKudamonStage(['pafumon']);
  const kyaromon = findKudamonStage(['kyaromon']);
  const kudamon = findKudamonStage(['kudamon', 'kudamonsaver']);
  const reppamon = findKudamonStage(['reppamon']);
  // Chirinmon is the canonical OMEGA DX name; accept legacy Tyilinmon catalogue rows.
  const chirinmon = findKudamonStage(['chirinmon', 'tyilinmon']);
  const kentaurusmon = findKudamonStage(['kentaurusmon']);
  const mitamamon = findKudamonStage(['mitamamon']);

  const kudamonLine = [pafumon, kyaromon, kudamon, reppamon, chirinmon, kentaurusmon].filter(Boolean);
  for (let i = 0; i < kudamonLine.length - 1; i++) {
    const from = kudamonLine[i]!;
    const to = kudamonLine[i + 1]!;
    delete ALTERNATE_EVOLUTIONS[from.id];
    delete EXTRA_ALTERNATE_EVOLUTIONS[from.id];
    EVOLUTIONS[from.id] = {
      evolvesTo: to.id,
      requiredLevel: to.rarity === 'TRAINING' ? 1 : (to.requiredLevel ?? (to.rarity === 'ROOKIE' ? 12 : to.rarity === 'CHAMPION' ? 20 : to.rarity === 'ULTIMATE' ? 40 : 60)),
      label: _normKey(to.name ?? '') === 'tyilinmon' ? 'Chirinmon' : to.name,
      ...(_normKey(to.name ?? '') === 'kentaurusmon' ? { requiredItem: 'anel_sagrado' } : {}),
    };
    _farmEvoMap[from.id] = to.id;
  }

  // Mitamamon is the alternate Mega evolution from Chirinmon.
  if (chirinmon && kentaurusmon) _divineGiftCharacterIds.add(kentaurusmon.id);
  if (chirinmon && mitamamon) {
    _divineGiftCharacterIds.add(mitamamon.id);
    ALTERNATE_EVOLUTIONS[chirinmon.id] = {
      evolvesTo: mitamamon.id,
      requiredLevel: mitamamon.requiredLevel ?? 60,
      label: 'Mitamamon',
      requiredItem: 'anel_sagrado',
    };
  }

  // Lopmon base line: Conomon (Baby) -> Kokomon (Training) -> Lopmon (Rookie).
  const conomon = chars.find((char) => _normKey(char.name ?? '') === 'conomon');
  const kokomon = chars.find((char) => _normKey(char.name ?? '') === 'kokomon');
  const lopmon = chars.find((char) => _normKey(char.name ?? '') === 'lopmon');
  const conomonId = conomon?.id ?? findCharacterIdByName('Conomon');
  const kokomonId = kokomon?.id ?? findCharacterIdByName('Kokomon');
  const lopmonId = lopmon?.id ?? findCharacterIdByName('Lopmon');

  if (conomonId && kokomonId && lopmonId) {
    delete ALTERNATE_EVOLUTIONS[conomonId];
    delete EXTRA_ALTERNATE_EVOLUTIONS[conomonId];
    delete ALTERNATE_EVOLUTIONS[kokomonId];
    delete EXTRA_ALTERNATE_EVOLUTIONS[kokomonId];
    EVOLUTIONS[conomonId] = { evolvesTo: kokomonId, requiredLevel: 1, label: 'Kokomon' };
    EVOLUTIONS[kokomonId] = { evolvesTo: lopmonId, requiredLevel: 12, label: 'Lopmon' };
    _farmEvoMap[conomonId] = kokomonId;
    _farmEvoMap[kokomonId] = lopmonId;
  }

  // Algomon line fixed by game design:
  // AlgomonBaby -> AlgomonTraining -> Algomon Rookie -> Algomon Champion -> Algomon Ultimate -> Algomon Mega.
  const findAlgomonStage = (keys: string[]) =>
    chars.find((char) => keys.includes(_normKey(char.name ?? '')) || keys.includes(_normKey(char.id ?? '')));
  const algBaby = findAlgomonStage(['algomonbaby']);
  const algTraining = findAlgomonStage(['algomontraining', 'algomontraning']);
  const algRookie = findAlgomonStage(['algomonrookie']);
  const algChampion = findAlgomonStage(['algomonchampion']);
  const algUltimate = findAlgomonStage(['algomonultimate']);
  const algMega = findAlgomonStage(['algomonmega']);

  const algomonChain = [algBaby, algTraining, algRookie, algChampion, algUltimate, algMega].filter(Boolean);
  for (let i = 0; i < algomonChain.length - 1; i++) {
    const from = algomonChain[i]!;
    const to = algomonChain[i + 1]!;
    // Remove alternate/stale catalogue branches from this fixed linear line.
    delete ALTERNATE_EVOLUTIONS[from.id];
    delete EXTRA_ALTERNATE_EVOLUTIONS[from.id];
    EVOLUTIONS[from.id] = {
      evolvesTo: to.id,
      requiredLevel: to.rarity === 'TRAINING' ? 1 : (to.requiredLevel ?? (to.rarity === 'ROOKIE' ? 12 : to.rarity === 'CHAMPION' ? 20 : to.rarity === 'ULTIMATE' ? 40 : 60)),
      label: to.name,
    };
    _farmEvoMap[from.id] = to.id;
  }

  // Gammamon base line: Curimon (Baby) -> Gurimon (Training) -> Gammamon (Rookie).
  // Keep the three linked explicitly so the evolution tree does not split them
  // into unrelated catalogue lines.
  const curimon = chars.find((char) => _normKey(char.name ?? '') === 'curimon');
  const gurimon = chars.find((char) => _normKey(char.name ?? '') === 'gurimon');
  const baseGammamon = chars.find((char) => _normKey(char.name ?? '') === 'gammamon');
  const curimonId = curimon?.id ?? findCharacterIdByName('Curimon');
  const gurimonId = gurimon?.id ?? findCharacterIdByName('Gurimon');
  const baseGammamonId = baseGammamon?.id ?? findCharacterIdByName('Gammamon');

  if (curimonId && gurimonId && baseGammamonId) {
    // Remove stale incoming catalogue links that would duplicate these two stages.
    for (const map of [EVOLUTIONS, ALTERNATE_EVOLUTIONS, EXTRA_ALTERNATE_EVOLUTIONS]) {
      for (const [fromId, evolution] of Object.entries(map)) {
        if ((evolution.evolvesTo === curimonId || evolution.evolvesTo === gurimonId) && fromId !== curimonId) {
          delete map[fromId];
        }
      }
    }
    delete ALTERNATE_EVOLUTIONS[curimonId];
    delete EXTRA_ALTERNATE_EVOLUTIONS[curimonId];
    delete ALTERNATE_EVOLUTIONS[gurimonId];
    delete EXTRA_ALTERNATE_EVOLUTIONS[gurimonId];

    EVOLUTIONS[curimonId] = { evolvesTo: gurimonId, requiredLevel: 1, label: 'Gurimon' };
    EVOLUTIONS[gurimonId] = { evolvesTo: baseGammamonId, requiredLevel: 12, label: 'Gammamon' };
    _farmEvoMap[curimonId] = gurimonId;
    _farmEvoMap[gurimonId] = baseGammamonId;
  }

  // Gammamon dark line — fixed game rule. Keep this authoritative even when
  // catalogue evolution metadata is incomplete or stale.
  const gammamon = chars.find((char) => _normKey(char.name ?? '') === 'gammamon');
  const gulus = chars.find((char) => _normKey(char.name ?? '') === 'gulusgammamon') ?? CHARACTERS.gulusGammamon;
  const regulus = chars.find((char) => _normKey(char.name ?? '') === 'regulusmon');
  const arcturius = chars.find((char) => _normKey(char.name ?? '') === 'arcturiusmon');
  const gammamonId = gammamon?.id ?? findCharacterIdByName('Gammamon');
  const gulusId = gulus?.id ?? 'gulusGammamon';
  const regulusId = regulus?.id ?? findCharacterIdByName('Regulusmon');
  const arcturiusId = arcturius?.id ?? findCharacterIdByName('Arcturiusmon');

  if (gammamonId && gulusId) {
    ALTERNATE_EVOLUTIONS[gammamonId] = {
      evolvesTo: gulusId,
      requiredLevel: 20,
      label: 'GulusGammamon',
      requiredItem: 'black_digitron',
    };
    _farmEvoMap[gammamonId] = gulusId;
  }
  if (gulusId && regulusId) {
    EVOLUTIONS[gulusId] = {
      evolvesTo: regulusId,
      requiredLevel: 40,
      label: 'Regulusmon',
    };
    _farmEvoMap[gulusId] = regulusId;
  }
  if (regulusId && arcturiusId) {
    EVOLUTIONS[regulusId] = {
      evolvesTo: arcturiusId,
      requiredLevel: 70,
      label: 'Arcturiusmon',
      requiredItem: 'black_digitron',
    };
    _farmEvoMap[regulusId] = arcturiusId;
  }

  // Inject spirit sacrifice drops for Frontier Warriors by name
  // Remove any previously injected spirit drops before re-injecting
  for (const charName of Object.keys(SPIRIT_SACRIFICE_DROPS_BY_NAME)) {
    for (const [id, drops] of Object.entries(SACRIFICE_DROPS)) {
      if (drops.length > 0 &&
          SPIRIT_SACRIFICE_DROPS_BY_NAME[charName]?.some(d => drops[0]?.itemId === d.itemId)) {
        delete (SACRIFICE_DROPS as Record<string, unknown>)[id];
      }
    }
  }
  for (const c of chars) {
    if (!c.name) continue;
    const spiritDrops = SPIRIT_SACRIFICE_DROPS_BY_NAME[c.name];
    if (spiritDrops) {
      (SACRIFICE_DROPS as Record<string, { itemId: string; chance: number }[]>)[c.id] = spiritDrops;
    }
  }
}

export function getFarmEvolutionTarget(fromCharId: string): string | null {
  return _farmEvoMap[fromCharId] ?? null;
}

export function hasDivineGiftPassive(characterId: string): boolean {
  return _divineGiftCharacterIds.has(characterId);
}

// Returns a random BABY/TRAINING Digimon for egg hatching.
// Normal eggs use only their own element, including the normal NULL egg.
// Special Digitama ignores element and can hatch from the complete pre-rookie pool.
export function getHatchTargets(element: string, special = false): string[] {
  if (special) return [...new Set(Object.values(_elementBabyMap).flat())];
  return [...(_elementBabyMap[element] ?? [])];
}

export function getRandomHatchTarget(element: string, special = false): string | null {
  if (special) {
    const all = [...new Set(Object.values(_elementBabyMap).flat())];
    if (all.length > 0) return all[Math.floor(Math.random() * all.length)];
    return null;
  }
  const targets = _elementBabyMap[element];
  if (targets && targets.length > 0) {
    return targets[Math.floor(Math.random() * targets.length)];
  }
  return null;
}

export function loadCharacterOverrides(overrides: Array<{
  characterId: string; name?: string; attribute?: string; rarity?: string; element?: string;
  hp?: number; mp?: number; atk?: number; def?: number; spt?: number; spd?: number;
  description?: string; attackName?: string; attackElement?: string;
  spiritName?: string; spiritElement?: string;
  hasImage?: boolean; imageScale?: number; scannable?: boolean;
}>, apiUrl: string) {
  _overrides = {};
  for (const o of overrides) {
    _overrides[o.characterId] = {
      name: o.name, attribute: o.attribute, rarity: o.rarity, element: o.element,
      hp: o.hp, mp: o.mp, atk: o.atk, def: o.def, spt: o.spt, spd: o.spd,
      description: o.description, attackName: o.attackName, attackElement: o.attackElement,
      spiritName: o.spiritName, spiritElement: o.spiritElement,
      imageScale: o.imageScale, scannable: o.scannable,
      overrideImageUrl: o.hasImage ? `${apiUrl}/overrides/${o.characterId}/image` : undefined,
    };
  }
}

export function getCharacter(id: string): Character | undefined {
  // The server catalogue is authoritative. CHARACTERS is legacy compatibility
  // only for old saves during migration and is never the runtime roster.
  const base: Character | undefined = _catalogChars[id] ?? CHARACTERS[id];
  if (!base) return undefined;
  const ov = _overrides[id];
  const merged: Character = !ov ? base : {
    ...base,
    ...(ov.name ? { name: ov.name } : {}),
    ...(ov.attribute ? { attribute: ov.attribute as Character['attribute'] } : {}),
    ...(ov.rarity ? { rarity: ov.rarity as Character['rarity'] } : {}),
    ...(ov.element ? { element: ov.element as Character['element'] } : {}),
    ...(ov.description ? { description: ov.description } : {}),
    ...(ov.attackName !== undefined ? { attackName: ov.attackName } : {}),
    ...(ov.attackElement ? { attackElement: ov.attackElement as Character['attackElement'] } : {}),
    ...(ov.spiritName !== undefined ? { spiritName: ov.spiritName } : {}),
    ...(ov.spiritElement ? { spiritElement: ov.spiritElement as Character['spiritElement'] } : {}),
    baseStats: {
      ...base.baseStats,
      ...(ov.hp !== undefined ? { hp: ov.hp } : {}),
      ...(ov.mp !== undefined ? { mp: ov.mp } : {}),
      ...(ov.atk !== undefined ? { atk: ov.atk } : {}),
      ...(ov.def !== undefined ? { def: ov.def } : {}),
      ...(ov.spt !== undefined ? { spt: ov.spt } : {}),
      ...(ov.spd !== undefined ? { spd: ov.spd } : {}),
    },
  };

  // Stage names in the UI are derived from rarity. Apply this last so an old
  // server override cannot turn Ultimate into Mega (or alter Baby/Training).
  const canonicalRarity = LUCEMON_CANONICAL_RARITIES[id] ?? LUCEMON_CANONICAL_RARITIES[_normKey(base.name)];
  return canonicalRarity && merged.rarity !== canonicalRarity
    ? { ...merged, rarity: canonicalRarity }
    : merged;
}

export function getAllCharacters(): Record<string, Character> {
  // ONE authoritative roster: only Digimons delivered by /digimons/catalog.
  // Never merge the old bundled CHARACTERS list here; doing so recreated the
  // 103-Digimon fallback/category that the game no longer uses.
  const roster: Record<string, Character> = {};
  for (const [id, char] of Object.entries(_catalogChars)) {
    roster[id] = getCharacter(id) ?? char;
  }
  return roster;
}

export function findCharacterIdByName(name: string): string | null {
  const normalizedName = _normKey(name);
  for (const [id, character] of Object.entries(getAllCharacters())) {
    if (_normKey(character.name) === normalizedName) return id;
  }
  return null;
}

export function getKnownCharacterName(id: string): string | null {
  const character = getCharacter(id);
  if (character?.name) return character.name;
  const alias = LEGACY_CHARACTER_NAME_ALIASES[id];
  if (alias) {
    const match = Object.values(getAllCharacters()).find((c) => _normKey(c.name) === alias);
    return match?.name ?? alias;
  }
  return null;
}

export function getCharacterImageSourceByName(name: string): any {
  if (!name) return null;
  return _IMAGE_BY_NORM[_normKey(name)] ?? null;
}

export function getCharacterImageSource(id: string): any {
  // Known legacy gacha IDs must resolve to the bundled image by Digimon name.
  // This prevents a stale/missing catalogue API image from showing the wrong art.
  const aliasedName = LEGACY_CHARACTER_NAME_ALIASES[id];
  if (aliasedName) {
    const aliasedImage = _IMAGE_BY_NORM[aliasedName];
    if (aliasedImage) return aliasedImage;
  }

  // Lucemon X must always use the bundled animated GIF.
  if (_normKey(id) === 'lucemonx' && (CHARACTER_IMAGES as Record<string, any>).lucemonX) {
    return (CHARACTER_IMAGES as Record<string, any>).lucemonX;
  }
  const ov = _overrides[id];
  if (ov?.overrideImageUrl) return { uri: ov.overrideImageUrl };

  // Bundled Digimon artwork is the canonical visual when it exists.
  // The server image is only a fallback. This prevents stale DB images from
  // replacing corrected assets such as Flamon.gif and ZeedMillenniumon.gif.
  if ((CHARACTER_IMAGES as Record<string, any>)[id]) return (CHARACTER_IMAGES as Record<string, any>)[id];
  const catalogCharacter = _catalogChars[id];
  if (catalogCharacter) {
    const localByName = catalogCharacter.name ? _IMAGE_BY_NORM[_normKey(catalogCharacter.name)] : undefined;
    if (localByName) return localByName;
  }
  if (_baseCharImageUrls[id]) return { uri: _baseCharImageUrls[id] };
  if (catalogCharacter?.imageApiUrl) return { uri: catalogCharacter.imageApiUrl };
  return null;
}

export function getCharacterImageScale(id: string): number {
  const ov = _overrides[id];
  if (ov?.imageScale !== undefined) return ov.imageScale;
  if (_catalogChars[id]) return _catalogChars[id].imageScale ?? 0.8;
  return 0.8;
}

export function getCatalogCharacters(): CatalogCharacterEntry[] {
  return Object.values(_catalogChars);
}

export function getApiUrl(): string { return _apiUrl; }
