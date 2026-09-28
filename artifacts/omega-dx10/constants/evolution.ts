// Linhas e requisitos aplicados ao carregar o catálogo de Digimon da API.
// Regras especiais ficam em registerEvolutionLines; raridades canônicas ficam abaixo.
import { Character, CHARACTERS, EVOLUTIONS, ALTERNATE_EVOLUTIONS, EXTRA_ALTERNATE_EVOLUTIONS, HARDCODED_ALTERNATE_EVOLUTIONS, FUSIONS, SACRIFICE_DROPS } from './gameData';
import type { CatalogDigimonRaw } from './digimon';

const _normKey = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');

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

const VARIANT_LEVEL_BY_RARITY: Partial<Record<Character['rarity'], number>> = {
  ROOKIE: 15, CHAMPION: 25, ULTIMATE: 45, MEGA: 60, ULTRA: 70, BURST: 70,
};

// A trailing X is an X-Antibody form only when the catalogue also contains
// the same name without that X. This avoids false matches such as JesmonGX.
// The Black prefix follows the same counterpart rule.
export function applyVariantEvolutionRules(chars: CatalogDigimonRaw[]): CatalogDigimonRaw[] {
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
export const LUCEMON_CANONICAL_RARITIES: Record<string, Character['rarity']> = {
  puttimon: 'BABY',
  cupimon: 'TRAINING',
  lucemon: 'ROOKIE',
  lucemonchaosmode: 'ULTIMATE',
  lucemonsatanmode: 'MEGA',
  lucemonlarvamode: 'MEGA',
};
export const KUDAMON_LINE_CANONICAL_RARITIES: Record<string, Character['rarity']> = {
  pafumon: 'BABY',
  kyaromon: 'TRAINING',
  kudamon: 'ROOKIE',
  kudamonsaver: 'ROOKIE',
  reppamon: 'CHAMPION',
  chirinmon: 'ULTIMATE',
  tyilinmon: 'ULTIMATE',
  kentaurusmon: 'MEGA',
};
export const CHRONOMON_LINE_CANONICAL_RARITIES: Record<string, Character['rarity']> = {
  chichimon: 'TRAINING',
  hyokomon: 'ROOKIE',
  buraimon: 'CHAMPION',
  butenmon: 'ULTIMATE',
  chronomonhm: 'MEGA',
  chronomondm: 'MEGA',
};
export const FIRE_LINE_CANONICAL_RARITIES: Record<string, Character['rarity']> = {
  mokumon: 'BABY',
  fukamon: 'TRAINING',
  candlemon: 'ROOKIE',
  wizardmon: 'CHAMPION',
  wisemon: 'ULTIMATE',
  ancientwisemon: 'MEGA',
  demimeramon: 'ROOKIE',
  meramon: 'CHAMPION',
  bluemeramon: 'ULTIMATE',
  skullmeramon: 'ULTIMATE',
  boltmon: 'MEGA',
  gankoomon: 'MEGA',
};
let farmEvoMap: Record<string, string> = {};
let divineGiftCharacterIds = new Set<string>(['ophanimon', 'seraphimon', 'slashAngemon']);
let registeredBaseCharKeys = new Set<string>();
let registeredFusionKeys = new Set<string>();

export function registerEvolutionLines(
  chars: CatalogDigimonRaw[],
  baseNameMap: Record<string, string>,
  resolveEvolutionCharacterId: (value?: string) => string | undefined,
  findCharacterIdByName: (name: string) => string | null,
  puttimonId?: string,
  cupimonId?: string,
) {
  farmEvoMap = {};
  divineGiftCharacterIds = new Set<string>(['ophanimon', 'seraphimon']);
  for (const c of chars) {
    if (c.requiredItem !== 'anel_sagrado') continue;
    const targetId = (c.name ? baseNameMap[c.name.toLowerCase()] : undefined) ?? c.id;
    divineGiftCharacterIds.add(targetId);
  }
  // Build farm evolution map: BABY→TRAINING, TRAINING→ROOKIE
  const PRE_CHAIN = new Set(['BABY', 'TRAINING', 'ROOKIE']);
  for (const c of chars) {
    if (c.evolvesFromId && PRE_CHAIN.has(c.rarity)) {
      const fromChar = chars.find((x) => x.id === c.evolvesFromId);
      if (fromChar && ['BABY', 'TRAINING'].includes(fromChar.rarity)) {
        farmEvoMap[c.evolvesFromId] = c.id;
      }
    }
  }

  // Clear evolution registrations created by the previous catalogue load.
  // Also clear base char keys that were registered by a previous custom run
  for (const key of registeredBaseCharKeys) {
    delete (EVOLUTIONS as Record<string, unknown>)[key];
    delete (ALTERNATE_EVOLUTIONS as Record<string, unknown>)[key];
    delete (EXTRA_ALTERNATE_EVOLUTIONS as Record<string, unknown>)[key];
  }
  registeredBaseCharKeys = new Set();
  // Clear fusion recipes generated from catalogue sacrifice relationships so stale
  // definitions cannot survive a reload and bypass the current sacrifice rules.
  for (const key of registeredFusionKeys) delete FUSIONS[key];
  registeredFusionKeys = new Set();

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
    const targetId = (c.name ? baseNameMap[c.name.toLowerCase()] : undefined) ?? c.id;

    const fromId = c.evolvesFromId;

    const hasSacrifice = !!c.requiredSacrificeCharacter;
    const mainTarget = EVOLUTIONS[fromId]?.evolvesTo;
    const altTarget  = ALTERNATE_EVOLUTIONS[fromId]?.evolvesTo;

    if (hasSacrifice) {
      const sacrificeId = resolveEvolutionCharacterId(c.requiredSacrificeCharacter!);
      if (sacrificeId) {
        const recipes = FUSIONS[fromId] ?? (FUSIONS[fromId] = []);
        registeredFusionKeys.add(fromId);
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
      registeredBaseCharKeys.add(fromId);
    } else if (c.requiredItem && !ALTERNATE_EVOLUTIONS[fromId] && mainTarget !== targetId) {
      ALTERNATE_EVOLUTIONS[fromId] = {
        evolvesTo: targetId,
        requiredLevel: c.requiredLevel ?? 1,
        label: c.name,
        requiredItem: c.requiredItem,
      };
      registeredBaseCharKeys.add(fromId);
    } else if (c.requiredItem && !EXTRA_ALTERNATE_EVOLUTIONS[fromId] && mainTarget !== targetId && altTarget !== targetId) {
      EXTRA_ALTERNATE_EVOLUTIONS[fromId] = {
        evolvesTo: targetId,
        requiredLevel: c.requiredLevel ?? 1,
        label: c.name,
        requiredItem: c.requiredItem,
      };
      registeredBaseCharKeys.add(fromId);
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
    farmEvoMap[puttimonId] = cupimonId;
    farmEvoMap[cupimonId] = 'lucemon';
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
  const wizardmon = chars.find((char) => _normKey(char.name ?? '') === 'wizardmon');
  const wisemon = chars.find((char) => _normKey(char.name ?? '') === 'wisemon');
  const ancientwisemon = chars.find((char) => _normKey(char.name ?? '') === 'ancientwisemon');
  const demimeramon = chars.find((char) => _normKey(char.name ?? '') === 'demimeramon');
  const meramon = chars.find((char) => _normKey(char.name ?? '') === 'meramon');
  const bluemeramon = chars.find((char) => _normKey(char.name ?? '') === 'bluemeramon');
  const skullmeramon = chars.find((char) => _normKey(char.name ?? '') === 'skullmeramon');
  const boltmon = chars.find((char) => _normKey(char.name ?? '') === 'boltmon');
  const gankoomon = chars.find((char) => _normKey(char.name ?? '') === 'gankoomon');
  if (mokumon && fukamon && candlemon) {
    // These three are one authoritative line; remove stale outgoing branches.
    delete ALTERNATE_EVOLUTIONS[mokumon.id];
    delete EXTRA_ALTERNATE_EVOLUTIONS[mokumon.id];
    delete ALTERNATE_EVOLUTIONS[fukamon.id];
    delete EXTRA_ALTERNATE_EVOLUTIONS[fukamon.id];

    EVOLUTIONS[mokumon.id] = { evolvesTo: fukamon.id, requiredLevel: 1, label: 'Fukamon' };
    EVOLUTIONS[fukamon.id] = { evolvesTo: candlemon.id, requiredLevel: 12, label: 'Candlemon' };
    farmEvoMap[mokumon.id] = fukamon.id;
    farmEvoMap[fukamon.id] = candlemon.id;

    if (wizardmon) {
      delete ALTERNATE_EVOLUTIONS[candlemon.id];
      delete EXTRA_ALTERNATE_EVOLUTIONS[candlemon.id];
      EVOLUTIONS[candlemon.id] = {
        evolvesTo: wizardmon.id,
        requiredLevel: 20,
        label: 'Wizardmon',
      };
      farmEvoMap[candlemon.id] = wizardmon.id;
      if (wisemon) {
        delete ALTERNATE_EVOLUTIONS[wizardmon.id];
        delete EXTRA_ALTERNATE_EVOLUTIONS[wizardmon.id];
        EVOLUTIONS[wizardmon.id] = {
          evolvesTo: wisemon.id,
          requiredLevel: 40,
          label: 'Wisemon',
        };
        farmEvoMap[wizardmon.id] = wisemon.id;
        if (ancientwisemon) {
          delete ALTERNATE_EVOLUTIONS[wisemon.id];
          delete EXTRA_ALTERNATE_EVOLUTIONS[wisemon.id];
          EVOLUTIONS[wisemon.id] = {
            evolvesTo: ancientwisemon.id,
            requiredLevel: 70,
            label: 'AncientWisemon',
            requiredItem: 'pergaminho_runa_antiga',
          };
          farmEvoMap[wisemon.id] = ancientwisemon.id;
        }
      }
    }

    // Mokumon also has DemiMeramon as an alternate Rookie evolution.
    if (demimeramon) {
      ALTERNATE_EVOLUTIONS[mokumon.id] = {
        evolvesTo: demimeramon.id,
        requiredLevel: 12,
        label: 'DemiMeramon',
      };
      if (meramon) {
        delete ALTERNATE_EVOLUTIONS[demimeramon.id];
        delete EXTRA_ALTERNATE_EVOLUTIONS[demimeramon.id];
        EVOLUTIONS[demimeramon.id] = {
          evolvesTo: meramon.id,
          requiredLevel: 20,
          label: 'Meramon',
        };
        farmEvoMap[demimeramon.id] = meramon.id;
        if (bluemeramon) {
          delete ALTERNATE_EVOLUTIONS[meramon.id];
          delete EXTRA_ALTERNATE_EVOLUTIONS[meramon.id];
          EVOLUTIONS[meramon.id] = {
            evolvesTo: bluemeramon.id,
            requiredLevel: 40,
            label: 'BlueMeramon',
          };
          farmEvoMap[meramon.id] = bluemeramon.id;
          if (boltmon) {
            delete ALTERNATE_EVOLUTIONS[bluemeramon.id];
            delete EXTRA_ALTERNATE_EVOLUTIONS[bluemeramon.id];
            EVOLUTIONS[bluemeramon.id] = {
              evolvesTo: boltmon.id,
              requiredLevel: 60,
              label: 'Boltmon',
            };
            farmEvoMap[bluemeramon.id] = boltmon.id;
          }
        }
        if (skullmeramon) {
          ALTERNATE_EVOLUTIONS[meramon.id] = {
            evolvesTo: skullmeramon.id,
            requiredLevel: 40,
            label: 'SkullMeramon',
          };
          if (gankoomon) {
            delete ALTERNATE_EVOLUTIONS[skullmeramon.id];
            delete EXTRA_ALTERNATE_EVOLUTIONS[skullmeramon.id];
            EVOLUTIONS[skullmeramon.id] = {
              evolvesTo: gankoomon.id,
              requiredLevel: 60,
              label: 'Gankoomon',
            };
            farmEvoMap[skullmeramon.id] = gankoomon.id;
          }
        }
      }
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
    farmEvoMap[from.id] = to.id;
  }

  if (butenmon && chronomonHM) {
    EVOLUTIONS[butenmon.id] = {
      evolvesTo: chronomonHM.id,
      requiredLevel: chronomonHM.requiredLevel ?? 60,
      label: 'Chronomon HM',
      requiredItem: 'anel_sagrado',
    };
    divineGiftCharacterIds.add(chronomonHM.id);
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
    farmEvoMap[from.id] = to.id;
  }

  // Mitamamon is the alternate Mega evolution from Chirinmon.
  if (chirinmon && kentaurusmon) divineGiftCharacterIds.add(kentaurusmon.id);
  if (chirinmon && mitamamon) {
    divineGiftCharacterIds.add(mitamamon.id);
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
    farmEvoMap[conomonId] = kokomonId;
    farmEvoMap[kokomonId] = lopmonId;
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
    farmEvoMap[from.id] = to.id;
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
    farmEvoMap[curimonId] = gurimonId;
    farmEvoMap[gurimonId] = baseGammamonId;
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
    farmEvoMap[gammamonId] = gulusId;
  }
  if (gulusId && regulusId) {
    EVOLUTIONS[gulusId] = {
      evolvesTo: regulusId,
      requiredLevel: 40,
      label: 'Regulusmon',
    };
    farmEvoMap[gulusId] = regulusId;
  }
  if (regulusId && arcturiusId) {
    EVOLUTIONS[regulusId] = {
      evolvesTo: arcturiusId,
      requiredLevel: 70,
      label: 'Arcturiusmon',
      requiredItem: 'black_digitron',
    };
    farmEvoMap[regulusId] = arcturiusId;
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
  return farmEvoMap[fromCharId] ?? null;
}

export function hasDivineGiftPassive(characterId: string): boolean {
  return divineGiftCharacterIds.has(characterId);
}
