import { Character, CHARACTERS, EVOLUTIONS, ALTERNATE_EVOLUTIONS, EXTRA_ALTERNATE_EVOLUTIONS, HARDCODED_CUSTOM_ALTERNATE_EVOLUTIONS, SACRIFICE_DROPS } from './gameData';
import CHARACTER_IMAGES from './characterImages';

interface CustomCharacterEntry extends Character {
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

let _customChars: Record<string, CustomCharacterEntry> = {};
let _rawCustomDigimons: CustomDigimonRaw[] = [];
let _overrides: Record<string, OverrideEntry> = {};
let _apiUrl = '';
let _baseCharImageUrls: Record<string, string> = {};
// farmEvoMap: fromCharId → targetCharId  (for BABY/TRAINING pre-rookie chain)
let _farmEvoMap: Record<string, string> = {};
// element → list of BABY char IDs (for random egg hatching; only babies with a training target)
let _elementBabyMap: Record<string, string[]> = {};
// Forms whose innate Divine Gift was unlocked through a Sacred Ring evolution.
// The item is consumed during evolution; battle checks only the resulting form.
let _divineGiftCharacterIds = new Set<string>(['ophanimon', 'seraphimon']);
// Track base char IDs that were registered as evolution targets by custom processing
let _registeredBaseCharKeys: Set<string> = new Set();

export interface CustomDigimonRaw {
  id: string; dbId: number; name: string; attribute: string; rarity: string; element: string;
  baseStats: { hp: number; mp: number; atk: number; def: number; spt: number; spd: number; apt: number };
  description: string; attackName?: string; attackElement?: string;
  spiritName?: string; spiritElement?: string;
  isBaseForm: boolean; evolvesFromId?: string; requiredLevel?: number;
  requiredItem?: string; requiredSacrificeCharacter?: string;
  isFusion: boolean; fusionPartner?: string;
  scannable: boolean; hasImage: boolean; imageMimeType?: string; imageScale: number; imageUpdatedAt?: number;
}

// Aliases: custom DB names that should map to a base character ID
// e.g. "Omnimon" in the DB is the same Digimon as base "omegamon"
const CHAR_NAME_ALIASES: Record<string, string> = {
  'omnimon': 'omegamon',
  'megalogrowmon': 'megaloGrowlmon',
};

// Spirit sacrifice drops: when a Frontier Warrior custom digimon is sacrificed,
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
  COMMON: 15, RARE: 25, EPIC: 45, LEGENDARY: 60, ULTRA: 70, BURST: 70,
};

// A trailing X is an X-Antibody form only when the catalogue also contains
// the same name without that X. This avoids false matches such as JesmonGX.
// The Black prefix follows the same counterpart rule.
function applyVariantEvolutionRules(chars: CustomDigimonRaw[]): CustomDigimonRaw[] {
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
  lucemon: 'COMMON',
  lucemonchaosmode: 'EPIC',
  lucemonsatanmode: 'LEGENDARY',
  lucemonlarvamode: 'LEGENDARY',
};
const _IMAGE_BY_NORM: Record<string, any> = (() => {
  const map: Record<string, any> = {};
  for (const [key, val] of Object.entries(CHARACTER_IMAGES as Record<string, any>)) {
    map[_normKey(key)] = val;
  }
  return map;
})();

export function getRawCustomDigimons(): CustomDigimonRaw[] {
  return _rawCustomDigimons;
}

export function loadCustomCharacters(chars: CustomDigimonRaw[], apiUrl: string) {
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
        rarity: 'COMMON',
        ...(cupimonId ? { evolvesFromId: cupimonId, requiredLevel: 12 } : {}),
      };
    }
    if (name === 'arcturiusmon') {
      return { ...c, rarity: 'LEGENDARY' };
    }
    const canonicalRarity = LUCEMON_CANONICAL_RARITIES[name];
    return canonicalRarity ? { ...c, rarity: canonicalRarity } : c;
  });

  chars = applyVariantEvolutionRules(chars);

  _apiUrl = apiUrl;
  _rawCustomDigimons = chars;
  _customChars = {};
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
    // If a base char with the same name exists, capture its API image then skip
    const baseId = BASE_NAME_MAP[c.name.toLowerCase()];
    if (baseId) {
      if (c.hasImage) {
        _baseCharImageUrls[baseId] = `${apiUrl}/digimons/custom/${c.dbId}/image?v=${c.imageUpdatedAt ?? 0}`;
      }
      continue;
    }

    _customChars[c.id] = {
      id: c.id, dbId: c.dbId, name: c.name,
      attribute: c.attribute as Character['attribute'],
      rarity: c.rarity as Character['rarity'],
      element: c.element as Character['element'],
      baseStats: c.baseStats, description: c.description,
      attackName: c.attackName, attackElement: c.attackElement as Character['attackElement'],
      spiritName: c.spiritName, spiritElement: c.spiritElement as Character['spiritElement'],
      scannable: c.scannable, imageScale: c.imageScale ?? 0.8,
      imageApiUrl: c.hasImage ? `${apiUrl}/digimons/custom/${c.dbId}/image?v=${c.imageUpdatedAt ?? 0}` : undefined,
    };

  }

  // Build farm evolution map: BABY→TRAINING, TRAINING→ROOKIE
  const PRE_CHAIN = new Set(['BABY', 'TRAINING', 'COMMON']);
  for (const c of chars) {
    if (c.evolvesFromId && PRE_CHAIN.has(c.rarity)) {
      const fromChar = chars.find((x) => x.id === c.evolvesFromId);
      if (fromChar && ['BABY', 'TRAINING'].includes(fromChar.rarity)) {
        _farmEvoMap[c.evolvesFromId] = c.id;
      }
    }
  }

  // Build element → baby pool for egg hatching.
  // Only babies that have a TRAINING target in _farmEvoMap are valid hatch candidates.
  for (const c of chars) {
    if (c.rarity === 'BABY' && _farmEvoMap[c.id]) {
      if (!_elementBabyMap[c.element]) _elementBabyMap[c.element] = [];
      _elementBabyMap[c.element].push(c.id);
    }
  }

  // Clear previous custom evolution registrations before re-registering
  for (const key of Object.keys(EVOLUTIONS)) {
    if (key.startsWith('custom_')) delete (EVOLUTIONS as Record<string, unknown>)[key];
  }
  for (const key of Object.keys(ALTERNATE_EVOLUTIONS)) {
    if (key.startsWith('custom_')) delete (ALTERNATE_EVOLUTIONS as Record<string, unknown>)[key];
  }
  for (const key of Object.keys(EXTRA_ALTERNATE_EVOLUTIONS)) {
    if (key.startsWith('custom_')) delete (EXTRA_ALTERNATE_EVOLUTIONS as Record<string, unknown>)[key];
  }
  // Also clear base char keys that were registered by a previous custom run
  for (const key of _registeredBaseCharKeys) {
    delete (EVOLUTIONS as Record<string, unknown>)[key];
    delete (ALTERNATE_EVOLUTIONS as Record<string, unknown>)[key];
    delete (EXTRA_ALTERNATE_EVOLUTIONS as Record<string, unknown>)[key];
  }
  _registeredBaseCharKeys = new Set();

  // Register custom evolutions into EVOLUTIONS / ALTERNATE_EVOLUTIONS maps.
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

    // Resolve the fromId: if evolvesFromId is a custom char whose name matches a base char, use the base ID
    let fromId = c.evolvesFromId;
    if (fromId.startsWith('custom_')) {
      const fromChar = chars.find((x) => x.id === fromId);
      if (fromChar) {
        const fromBaseId = fromChar.name ? BASE_NAME_MAP[fromChar.name.toLowerCase()] : undefined;
        if (fromBaseId) {
          fromId = fromBaseId;
          _registeredBaseCharKeys.add(fromBaseId);
        }
      }
    }

    const hasSacrifice = !!c.requiredSacrificeCharacter;
    const mainTarget = EVOLUTIONS[fromId]?.evolvesTo;
    const altTarget  = ALTERNATE_EVOLUTIONS[fromId]?.evolvesTo;
    if (!hasSacrifice && !EVOLUTIONS[fromId]) {
      EVOLUTIONS[fromId] = {
        evolvesTo: targetId,
        requiredLevel: c.requiredLevel ?? 1,
        label: c.name,
        requiredItem: c.requiredItem,
      };
      if (!fromId.startsWith('custom_')) _registeredBaseCharKeys.add(fromId);
    } else if (!ALTERNATE_EVOLUTIONS[fromId] && mainTarget !== targetId) {
      ALTERNATE_EVOLUTIONS[fromId] = {
        evolvesTo: targetId,
        requiredLevel: c.requiredLevel ?? 1,
        label: c.name,
        requiredItem: c.requiredItem,
        requiredSacrificeCharacter: c.requiredSacrificeCharacter,
      };
      if (!fromId.startsWith('custom_')) _registeredBaseCharKeys.add(fromId);
    } else if (!EXTRA_ALTERNATE_EVOLUTIONS[fromId] && mainTarget !== targetId && altTarget !== targetId) {
      EXTRA_ALTERNATE_EVOLUTIONS[fromId] = {
        evolvesTo: targetId,
        requiredLevel: c.requiredLevel ?? 1,
        label: c.name,
        requiredItem: c.requiredItem,
        requiredSacrificeCharacter: c.requiredSacrificeCharacter,
      };
      if (!fromId.startsWith('custom_')) _registeredBaseCharKeys.add(fromId);
    }
  }

  // ── Bidirectional sacrifice entries ──────────────────────────────────────────
  // When digimon X fuses (evolvesFrom=A, sacrifice=B), also register B→X (sacrifice=A)
  // so the fusion target appears in BOTH parents' evo lines.
  for (const c of sortedForEvo) {
    if (!c.evolvesFromId || !c.requiredSacrificeCharacter || SKIP_RARITIES.has(c.rarity)) continue;
    const targetId = (c.name ? BASE_NAME_MAP[c.name.toLowerCase()] : undefined) ?? c.id;

    let fromId = c.evolvesFromId;
    if (fromId.startsWith('custom_')) {
      const fc = chars.find((x) => x.id === fromId);
      if (fc) { const baseId = fc.name ? BASE_NAME_MAP[fc.name.toLowerCase()] : undefined; if (baseId) fromId = baseId; }
    }
    const fromChar = chars.find((x) => x.id === c.evolvesFromId);
    const fromName = fromChar?.name ?? c.evolvesFromId;

    const sacrificeChar = chars.find((x) => x.name === c.requiredSacrificeCharacter);
    if (!sacrificeChar) continue;
    let sacrificeId: string = sacrificeChar.id;
    if (sacrificeId.startsWith('custom_')) {
      const baseId = BASE_NAME_MAP[sacrificeChar.name?.toLowerCase() ?? ''];
      if (baseId) sacrificeId = baseId;
    }

    const ev = EVOLUTIONS[sacrificeId]?.evolvesTo;
    const av = ALTERNATE_EVOLUTIONS[sacrificeId]?.evolvesTo;
    const xv = EXTRA_ALTERNATE_EVOLUTIONS[sacrificeId]?.evolvesTo;
    if (ev !== targetId && av !== targetId && xv !== targetId) {
      if (!ALTERNATE_EVOLUTIONS[sacrificeId]) {
        ALTERNATE_EVOLUTIONS[sacrificeId] = { evolvesTo: targetId, requiredLevel: c.requiredLevel ?? 1, label: c.name, requiredSacrificeCharacter: fromName };
      } else if (!EXTRA_ALTERNATE_EVOLUTIONS[sacrificeId]) {
        EXTRA_ALTERNATE_EVOLUTIONS[sacrificeId] = { evolvesTo: targetId, requiredLevel: c.requiredLevel ?? 1, label: c.name, requiredSacrificeCharacter: fromName };
      }
    }
  }

  // Keep the Gammamon dark branch authoritative even when the API returns stale or
  // incomplete parent relationships. These IDs are resolved by name because custom
  // records can receive different database IDs between environments.
  const findCustomByName = (name: string) =>
    chars.find((c) => _normKey(c.name ?? '') === _normKey(name));
  const gammamonLine = {
    gammamon: findCustomByName('Gammamon'),
    gulus: findCustomByName('GulusGammamon'),
    regulus: findCustomByName('Regulusmon'),
    arcturius: findCustomByName('Arcturiusmon'),
  };
  if (gammamonLine.gammamon && gammamonLine.gulus && gammamonLine.regulus && gammamonLine.arcturius) {
    ALTERNATE_EVOLUTIONS[gammamonLine.gammamon.id] = {
      evolvesTo: gammamonLine.gulus.id,
      requiredLevel: 20,
      label: gammamonLine.gulus.name,
      requiredItem: 'black_digitron',
    };
    delete EXTRA_ALTERNATE_EVOLUTIONS[gammamonLine.gammamon.id];
    EVOLUTIONS[gammamonLine.gulus.id] = {
      evolvesTo: gammamonLine.regulus.id,
      requiredLevel: 40,
      label: gammamonLine.regulus.name,
    };
    delete ALTERNATE_EVOLUTIONS[gammamonLine.gulus.id];
    delete EXTRA_ALTERNATE_EVOLUTIONS[gammamonLine.gulus.id];
    EVOLUTIONS[gammamonLine.regulus.id] = {
      evolvesTo: gammamonLine.arcturius.id,
      requiredLevel: 60,
      label: gammamonLine.arcturius.name,
    };
    delete ALTERNATE_EVOLUTIONS[gammamonLine.regulus.id];
    delete EXTRA_ALTERNATE_EVOLUTIONS[gammamonLine.regulus.id];
  }

  // Re-inject hardcoded custom alternate evolutions (4 Celestial Beasts → Huanglongmon, etc.)
  // These are added AFTER the clearing loop so they always survive reloads.
  for (const [key, val] of Object.entries(HARDCODED_CUSTOM_ALTERNATE_EVOLUTIONS)) {
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

  // Inject spirit sacrifice drops for Frontier Warriors by name
  // Remove any previously injected spirit drops before re-injecting
  for (const charName of Object.keys(SPIRIT_SACRIFICE_DROPS_BY_NAME)) {
    for (const [id, drops] of Object.entries(SACRIFICE_DROPS)) {
      if (id.startsWith('custom_') && drops.length > 0 &&
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

// Returns a random BABY of the given element.
// NULL element (Digitama Especial / Nulo) picks from ALL babies across all elements.
export function getRandomHatchTarget(element: string): string | null {
  if (element === 'NULL') {
    const all = Object.values(_elementBabyMap).flat();
    if (all.length > 0) return all[Math.floor(Math.random() * all.length)];
    return null;
  }
  const babies = _elementBabyMap[element];
  if (babies && babies.length > 0) {
    return babies[Math.floor(Math.random() * babies.length)];
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
  const base: Character | undefined = CHARACTERS[id] ?? _customChars[id];
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
  const base: Record<string, Character> = {};
  for (const [id, char] of Object.entries(CHARACTERS)) {
    base[id] = getCharacter(id) ?? char;
  }
  for (const [id] of Object.entries(_customChars)) {
    base[id] = getCharacter(id) ?? _customChars[id];
  }
  return base;
}

export function findCharacterIdByName(name: string): string | null {
  const normalizedName = _normKey(name);
  for (const [id, character] of Object.entries(getAllCharacters())) {
    if (_normKey(character.name) === normalizedName) return id;
  }
  return null;
}

export function getCharacterImageSource(id: string): any {
  // Lucemon X must always use the bundled animated GIF. Old API records can
  // still point to the obsolete PNG, so this check must precede all overrides.
  if (_normKey(id) === 'lucemonx' && (CHARACTER_IMAGES as Record<string, any>).lucemonX) {
    return (CHARACTER_IMAGES as Record<string, any>).lucemonX;
  }
  const ov = _overrides[id];
  if (ov?.overrideImageUrl) return { uri: ov.overrideImageUrl };
  if (_baseCharImageUrls[id]) return { uri: _baseCharImageUrls[id] };
  if ((CHARACTER_IMAGES as Record<string, any>)[id]) return (CHARACTER_IMAGES as Record<string, any>)[id];
  const custom = _customChars[id];
  if (custom?.imageApiUrl) return { uri: custom.imageApiUrl };
  if (custom) {
    const img = custom.name ? _IMAGE_BY_NORM[_normKey(custom.name)] : undefined;
    if (img) return img;
  }
  return null;
}

export function getCharacterImageScale(id: string): number {
  const ov = _overrides[id];
  if (ov?.imageScale !== undefined) return ov.imageScale;
  if (_customChars[id]) return _customChars[id].imageScale ?? 0.8;
  return 0.8;
}

export function getCustomCharacters(): CustomCharacterEntry[] {
  return Object.values(_customChars);
}

export function getApiUrl(): string { return _apiUrl; }
