// Cadastro usado pelo jogo: recebe os Digimon da API e associa a arte local.
// Para trocar um sprite, edite digimonImages.ts. Para mudar uma linha, edite evolution.ts.
import { Character, CHARACTERS } from './gameData';
import { applyVariantEvolutionRules, LUCEMON_CANONICAL_RARITIES, KUDAMON_LINE_CANONICAL_RARITIES, CHRONOMON_LINE_CANONICAL_RARITIES, FIRE_LINE_CANONICAL_RARITIES, registerEvolutionLines } from './evolution';
export { getFarmEvolutionTarget, hasDivineGiftPassive } from './evolution';
import CHARACTER_IMAGES from './characterImages';
import { NO_DIGIMON_IMAGE } from './digimonImages';

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
let _elementBabyMap: Record<string, string[]> = {};

// Digitama pools are derived from the live canonical catalogue.
// Only BABY/TRAINING Digimon are hatchable; the element stored in the catalogue
// is the single source of truth for both the card badge and the matching Digitama.
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
  _elementBabyMap = {};
  _baseCharImageUrls = {};

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

  registerEvolutionLines(chars, BASE_NAME_MAP, resolveEvolutionCharacterId, findCharacterIdByName, puttimonId, cupimonId);
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
    if (localByName && localByName !== NO_DIGIMON_IMAGE) return localByName;
  }
  if (_baseCharImageUrls[id]) return { uri: _baseCharImageUrls[id] };
  if (catalogCharacter?.imageApiUrl) return { uri: catalogCharacter.imageApiUrl };
  // A imagem provisória só é usada para nomes vinculados em digimonImages.ts.
  const knownName = catalogCharacter?.name ?? CHARACTERS[id]?.name;
  return knownName ? _IMAGE_BY_NORM[_normKey(knownName)] ?? null : null;
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
