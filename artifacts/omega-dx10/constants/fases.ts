// Fonte das fases exibidas no mapa e usadas pelas batalhas e pela farm.
// Edite a fase no grupo correspondente. GAME_MAPS reúne os três grupos na ordem original.

export interface StageDrop {
  type: 'bits' | 'piece';
  id?: string;
  amount: number;
  chance: number;
}

export interface MapStage {
  index: number;
  name: string;
  enemyCharacterId: string;
  enemyCharacterIds?: string[];
  randomEnemyCount?: number;
  enemyLevel: number;
  enemyAscensionStars?: number;
  enemyLevels?: number[];
  enemyAscensionStarsByIndex?: number[];
  waves?: Array<{ enemyCharacterIds: string[]; enemyLevels?: number[]; enemyAscensionStarsByIndex?: number[] }>;
  expReward: number;
  drops?: StageDrop[];
  bossMultipliers?: { hp?: number; def?: number };
  firstClearReward?: string;
  gemsFirstClear?: number;
  isBoss?: boolean;
  tamerCrestReward?: { amount: number };
}

export interface GameMap {
  id: string;
  name: string;
  description: string;
  requiredMapCleared?: string;
  requiredTamerLevel?: number;
  isDungeon?: boolean;
  isDaily?: boolean;
  availableDays?: number[];
  availableHours?: Array<{ start: number; end: number }>;
  isBiweeklyEvent?: boolean;
  isWeeklyEvent?: boolean;
  backgroundImage?: number;
  bitsReward?: number;
  tamerExpReward?: number;
  stages: MapStage[];
  tileGrid?: number[][] | null;
}

// Fases normais do Digimundo.
export const NORMAL_MAPS: GameMap[] = [
  // ── WORLD 1: Floresta dos Dados ─────────────────────────────────────────────
  {
    id: 'map_forest',
    name: 'Floresta dos Dados',
    description: 'Uma floresta encantada onde a luz digital brilha entre as árvores ancestrais. O primeiro passo de todo Tamer começa aqui.',
    backgroundImage: require('../assets/images/maps/chip_forest.webp'),
    bitsReward: 100,
    tamerExpReward: 10,
    stages: [
      { index: 0, name: 'Entrada da Floresta', enemyCharacterId: 'demiDevimon', enemyLevel: 3,  expReward: 50,  gemsFirstClear: 50,  enemyCharacterIds: ['demiDevimon', 'agumon', 'gabumon'], randomEnemyCount: 1 },
      { index: 1, name: 'Clareira dos Dados',  enemyCharacterId: 'gabumon',     enemyLevel: 6,  expReward: 90,  gemsFirstClear: 100, enemyCharacterIds: ['gabumon', 'pyomon', 'salamon'], randomEnemyCount: 1 },
      { index: 2, name: 'Núcleo da Floresta',  enemyCharacterId: 'pyomon',      enemyLevel: 9,  expReward: 160, gemsFirstClear: 150, enemyCharacterIds: ['pyomon', 'patamon', 'palmon'], randomEnemyCount: 1 },
      { index: 3, name: '⚔️ Boss — Patamon', enemyCharacterId: 'patamon', enemyLevel: 12, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 1.8, def: 1.3 }, enemyCharacterIds: ['patamon'] },
    ],
  },
  // ── WORLD 2: Santuário de Gelo ──────────────────────────────────────────────
  {
    id: 'map_city',
    name: 'Santuário de Gelo',
    description: 'Um castelo de cristal erguido nas montanhas digitais congeladas sob o luar. Rookies variados patrulham suas muralhas geladas.',
    backgroundImage: require('../assets/images/maps/acess_glacier.webp'),
    requiredMapCleared: 'map_forest',
    bitsReward: 250,
    tamerExpReward: 20,
    stages: [
      { index: 0, name: 'Portal Congelado',  enemyCharacterId: 'blackSalamon', enemyLevel: 12, expReward: 220,  gemsFirstClear: 50,  enemyCharacterIds: ['blackSalamon', 'mushroomon', 'tentomon'], randomEnemyCount: 2 },
      { index: 1, name: 'Muralhas de Gelo',  enemyCharacterId: 'renamon',      enemyLevel: 12, expReward: 380,  gemsFirstClear: 100, enemyCharacterIds: ['renamon', 'terriermon', 'wormon'], randomEnemyCount: 2 },
      { index: 2, name: 'Trono de Cristal',  enemyCharacterId: 'kumamon',      enemyLevel: 14, expReward: 650,  gemsFirstClear: 150, enemyCharacterIds: ['kumamon', 'blackSalamon', 'mushroomon'], randomEnemyCount: 2 },
      { index: 3, name: '⚔️ Boss — Woodmon', enemyCharacterId: 'woodmon', enemyLevel: 16, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 1.8, def: 1.3 }, enemyCharacterIds: ['woodmon'] },
    ],
  },
  // ── WORLD 3: Catacumbas Sombrias ────────────────────────────────────────────
  {
    id: 'map_shadow',
    name: 'Catacumbas Sombrias',
    description: 'Corredores de pedra cobertos por raízes digitais e iluminados por tochas antigas. As trevas aqui consomem até os mais corajosos.',
    backgroundImage: require('../assets/images/maps/chaos_brain.webp'),
    requiredMapCleared: 'map_city',
    bitsReward: 500,
    tamerExpReward: 35,
    stages: [
      { index: 0, name: 'Entrada das Catacumbas', enemyCharacterId: 'wormon',   enemyLevel: 16, expReward: 800,  gemsFirstClear: 50,  enemyCharacterIds: ['wormon', 'salamon', 'patamon'], randomEnemyCount: 2 },
      { index: 1, name: 'Corredor das Almas',     enemyCharacterId: 'gomamon',  enemyLevel: 16, expReward: 1200, gemsFirstClear: 100, enemyCharacterIds: ['gomamon', 'kokwamon'], randomEnemyCount: 2 },
      { index: 2, name: 'Câmara das Trevas',      enemyCharacterId: 'lalamon',  enemyLevel: 18, expReward: 1800, gemsFirstClear: 150, enemyCharacterIds: ['lalamon', 'wormon', 'salamon'], randomEnemyCount: 2 },
      { index: 3, name: '⚔️ Boss — Devimon', enemyCharacterId: 'devimon', enemyLevel: 21, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 2.0, def: 1.3 }, enemyCharacterIds: ['devimon'] },
    ],
  },
  // ── WORLD 4: Floresta Encantada ─────────────────────────────────────────────
  {
    id: 'map_plant',
    name: 'Floresta Encantada',
    description: 'Uma floresta mágica repleta de flores digitais coloridas. Rookies habitam as bordas, mas Champions surgem no interior.',
    backgroundImage: require('../assets/images/maps/map_metal_bg.webp'),
    requiredMapCleared: 'map_shadow',
    bitsReward: 800,
    tamerExpReward: 50,
    stages: [
      { index: 0, name: 'Prado das Flores',   enemyCharacterId: 'gaomon',   enemyLevel: 21, expReward: 2200,  gemsFirstClear: 50,  enemyCharacterIds: ['gaomon', 'kotemon', 'gabumon'], randomEnemyCount: 2 },
      { index: 1, name: 'Estufa Selvagem',    enemyCharacterId: 'otamamon', enemyLevel: 22, expReward: 3000,  gemsFirstClear: 100, enemyCharacterIds: ['otamamon', 'betamon', 'gaomon'], randomEnemyCount: 2 },
      { index: 2, name: 'Rainha da Floresta', enemyCharacterId: 'greymon',  enemyLevel: 24, expReward: 4200,  gemsFirstClear: 150, enemyCharacterIds: ['greymon', 'garurumon'] },
      { index: 3, name: '⚔️ Boss — Garurumon', enemyCharacterId: 'garurumon', enemyLevel: 27, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 2.0, def: 1.3 }, enemyCharacterIds: ['garurumon'] },
    ],
  },
  // ── WORLD 5: Mina de Crômio ─────────────────────────────────────────────────
  {
    id: 'map_metal',
    name: 'Mina de Crômio',
    description: 'Túneis subterrâneos repletos de cristais de dados brilhantes. Rookies trabalham as entradas enquanto Champions dominam as profundezas.',
    backgroundImage: require('../assets/images/maps/map_plant_bg.webp'),
    requiredMapCleared: 'map_plant',
    bitsReward: 1200,
    tamerExpReward: 70,
    stages: [
      { index: 0, name: 'Túnel de Entrada',  enemyCharacterId: 'candlemon',  enemyLevel: 27, expReward: 5000,  gemsFirstClear: 50,  enemyCharacterIds: ['candlemon', 'falcomon', 'hagurumon'], randomEnemyCount: 2 },
      { index: 1, name: 'Veio dos Cristais', enemyCharacterId: 'kamemon',    enemyLevel: 27, expReward: 6500,  gemsFirstClear: 100, enemyCharacterIds: ['kamemon', 'monodramon', 'penguinmon'], randomEnemyCount: 2 },
      { index: 2, name: 'Câmara de Crômio',  enemyCharacterId: 'pipismon',   enemyLevel: 29, expReward: 8500,  gemsFirstClear: 150, enemyCharacterIds: ['pipismon', 'candlemon'] },
      { index: 3, name: '⚔️ Boss — Guardromon', enemyCharacterId: 'guardromon', enemyLevel: 30, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 2.0, def: 1.3 }, enemyCharacterIds: ['guardromon'] },
    ],
  },
  // ── WORLD 6: Costa da Luz ───────────────────────────────────────────────────
  {
    id: 'map_angel',
    name: 'Costa da Luz',
    description: 'Uma praia tropical banhada pela luz divina do Mundo Digital. Rookies marcham pelas dunas enquanto Champions guardam o litoral sagrado.',
    backgroundImage: require('../assets/images/maps/map_angel_bg.webp'),
    requiredMapCleared: 'map_metal',
    bitsReward: 1800,
    tamerExpReward: 90,
    stages: [
      { index: 0, name: 'Dunas Sagradas',     enemyCharacterId: 'salamon',  enemyLevel: 30, expReward: 9500,  gemsFirstClear: 50,  enemyCharacterIds: ['salamon', 'solarmon', 'toyagumon'], randomEnemyCount: 2 },
      { index: 1, name: 'Litoral Celestial',  enemyCharacterId: 'patamon',  enemyLevel: 30, expReward: 11500, gemsFirstClear: 100, enemyCharacterIds: ['patamon', 'tailmon', 'angemon'], randomEnemyCount: 3 },
      { index: 2, name: 'Santuário Costeiro', enemyCharacterId: 'piddomon', enemyLevel: 31, expReward: 14000, gemsFirstClear: 150, enemyCharacterIds: ['piddomon', 'angemon'] },
      { index: 3, name: '⚔️ Boss — Reppamon', enemyCharacterId: 'reppamon', enemyLevel: 33, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 2.0, def: 1.3 }, enemyCharacterIds: ['piddomon', 'reppamon'] },
    ],
  },
  // ── WORLD 7: Deserto de Areia ───────────────────────────────────────────────
  {
    id: 'map_dark_abyss',
    name: 'Deserto de Areia',
    description: 'Uma arena natural esculpida pelos cânions digitais sob um céu alaranjado. Champions dominam este território implacável.',
    backgroundImage: require('../assets/images/maps/map_dark_abyss_bg.webp'),
    requiredMapCleared: 'map_angel',
    bitsReward: 2500,
    tamerExpReward: 120,
    stages: [
      { index: 0, name: 'Cânion das Sombras', enemyCharacterId: 'guardromon', enemyLevel: 33, expReward: 15000, gemsFirstClear: 50,  enemyCharacterIds: ['guardromon', 'greymon', 'birdramon'] },
      { index: 1, name: 'Arena do Deserto',   enemyCharacterId: 'togemon',    enemyLevel: 33, expReward: 17000, gemsFirstClear: 100, enemyCharacterIds: ['togemon', 'woodmon', 'stingmon'] },
      { index: 2, name: 'Senhor das Areias',  enemyCharacterId: 'aquilamon',  enemyLevel: 35, expReward: 20000, gemsFirstClear: 150, enemyCharacterIds: ['aquilamon', 'guardromon'] },
      { index: 3, name: '⚔️ Boss — Ogremon', enemyCharacterId: 'ogremon', enemyLevel: 37, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 2.0, def: 1.3 }, enemyCharacterIds: ['aquilamon', 'ogremon'] },
    ],
  },
  // ── WORLD 8: Templo dos Dragões ─────────────────────────────────────────────
  {
    id: 'map_dragon',
    name: 'Templo dos Dragões',
    description: 'Um templo ancestral onde dados digitais caem como chuva. Champions de todas as linhas habitam estes corredores.',
    backgroundImage: require('../assets/images/maps/dungeon_gulus.webp'),
    requiredMapCleared: 'map_dark_abyss',
    bitsReward: 3500,
    tamerExpReward: 150,
    stages: [
      { index: 0, name: 'Salão dos Guerreiros', enemyCharacterId: 'greymon',     enemyLevel: 37, expReward: 21000, gemsFirstClear: 50,  enemyCharacterIds: ['greymon', 'geoGreymon', 'airdramon'] },
      { index: 1, name: 'Câmara dos Campeões',  enemyCharacterId: 'tyranomon',   enemyLevel: 37, expReward: 23500, gemsFirstClear: 100, enemyCharacterIds: ['tyranomon', 'seadramon', 'allomon'] },
      { index: 2, name: 'Trono Dracônico',      enemyCharacterId: 'darktyranomon', enemyLevel: 39, expReward: 26000, gemsFirstClear: 150, enemyCharacterIds: ['darktyranomon', 'airdramon'] },
      { index: 3, name: '⚔️ Boss — DarkTyranomon', enemyCharacterId: 'darktyranomon', enemyLevel: 41, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 2.2, def: 1.3 }, enemyCharacterIds: ['tyranomon', 'darktyranomon'] },
    ],
  },
  // ── WORLD 9: Pradaria dos Tamers ────────────────────────────────────────────
  {
    id: 'map_final_domain',
    name: 'Pradaria dos Tamers',
    description: 'Uma vasta pradaria digital ensolarada. Champions variados se enfrentam nesta terra aberta antes dos Ultimates no horizonte.',
    backgroundImage: require('../assets/images/maps/map_final_domain_bg.webp'),
    requiredMapCleared: 'map_dragon',
    bitsReward: 5000,
    tamerExpReward: 180,
    stages: [
      { index: 0, name: 'Campos da Glória',   enemyCharacterId: 'angemon',   enemyLevel: 40, expReward: 27000, gemsFirstClear: 50,  enemyCharacterIds: ['angemon', 'tailmon', 'devimon'] },
      { index: 1, name: 'Centro da Pradaria', enemyCharacterId: 'garurumon', enemyLevel: 40, expReward: 29500, gemsFirstClear: 100, enemyCharacterIds: ['garurumon', 'geoGreymon', 'birdramon'] },
      { index: 2, name: 'Altar dos Tamers',   enemyCharacterId: 'geoGreymon',enemyLevel: 40, expReward: 32000, gemsFirstClear: 150, enemyCharacterIds: ['geoGreymon', 'togemon', 'angemon'] },
      { index: 3, name: '⚔️ Boss — MetalGreymon', enemyCharacterId: 'metalGreymon', enemyLevel: 50, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 2.2, def: 1.4 }, enemyCharacterIds: ['geoGreymon', 'metalGreymon'] },
    ],
  },
  // ── WORLD 10: Templo das Sombras ────────────────────────────────────────────
  {
    id: 'map_ruins',
    name: 'Templo das Sombras',
    description: 'Corredores roxos de um templo amaldiçoado. Os últimos Champions resistem aqui, mas forças Ultimates ameaçam consumir este lugar.',
    backgroundImage: require('../assets/images/maps/map_ruins.webp'),
    requiredMapCleared: 'map_final_domain',
    bitsReward: 7000,
    tamerExpReward: 210,
    stages: [
      { index: 0, name: 'Entrada Maldita', enemyCharacterId: 'devimon',      enemyLevel: 45, expReward: 33000, gemsFirstClear: 50,  enemyCharacterIds: ['devimon', 'blacktailmon', 'ogremon'] },
      { index: 1, name: 'Salão dos Olhos', enemyCharacterId: 'darklizardmon',enemyLevel: 45, expReward: 35500, gemsFirstClear: 100, enemyCharacterIds: ['darklizardmon', 'devidramon', 'devimon'] },
      { index: 2, name: 'Sanctum Sombrio', enemyCharacterId: 'blacktailmon', enemyLevel: 45, expReward: 38000, gemsFirstClear: 150, enemyCharacterIds: ['blacktailmon', 'devidramon', 'ogremon'] },
      { index: 3, name: '⚔️ Boss — SkullGreymon', enemyCharacterId: 'skullgreymon', enemyLevel: 52, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 2.2, def: 1.4 }, enemyCharacterIds: ['blacktailmon', 'skullgreymon'] },
    ],
  },
  // ── WORLD 11: Castelo Esquecido ─────────────────────────────────────────────
  {
    id: 'map_ocean',
    name: 'Castelo Esquecido',
    description: 'Uma fortaleza em ruínas onde os primeiros Ultimates surgem. Champions ainda guardam as portas, mas Ultimates dominam o interior.',
    backgroundImage: require('../assets/images/maps/map_ocean.webp'),
    requiredMapCleared: 'map_ruins',
    bitsReward: 9000,
    tamerExpReward: 240,
    stages: [
      { index: 0, name: 'Portão em Ruínas', enemyCharacterId: 'tailmon',      enemyLevel: 50, expReward: 38500, gemsFirstClear: 50,  enemyCharacterIds: ['tailmon', 'geoGreymon'] },
      { index: 1, name: 'Torre Caída',      enemyCharacterId: 'metalGreymon', enemyLevel: 50, expReward: 40500, gemsFirstClear: 100, enemyCharacterIds: ['metalGreymon', 'wereGarurumon'] },
      { index: 2, name: 'Trono Abandonado', enemyCharacterId: 'myotismon',    enemyLevel: 50, expReward: 42500, gemsFirstClear: 150, enemyCharacterIds: ['myotismon', 'metalGreymon'] },
      { index: 3, name: '⚔️ Boss — Angewomon', enemyCharacterId: 'angewomon', enemyLevel: 55, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 2 }, bossMultipliers: { hp: 2.5, def: 1.5 }, enemyCharacterIds: ['angemon', 'tailmon', 'angewomon'] },
    ],
  },
  // ── WORLD 12: Vale dos Fósseis ───────────────────────────────────────────────
  {
    id: 'map_volcano',
    name: 'Vale dos Fósseis',
    description: 'Um vale árido repleto de ossadas gigantescas. Ultimates dominam completamente este território ressecado.',
    backgroundImage: require('../assets/images/maps/map_volcano.webp'),
    requiredMapCleared: 'map_ocean',
    bitsReward: 11000,
    tamerExpReward: 265,
    stages: [
      { index: 0, name: 'Cânion dos Ossos',   enemyCharacterId: 'angewomon',    enemyLevel: 50, expReward: 43000, gemsFirstClear: 50,  enemyCharacterIds: ['angewomon', 'wereGarurumon'] },
      { index: 1, name: 'Gruta dos Fósseis',  enemyCharacterId: 'metalGreymon', enemyLevel: 52, expReward: 44500, gemsFirstClear: 100, enemyCharacterIds: ['metalGreymon', 'myotismon'] },
      { index: 2, name: 'Guardião Ancestral', enemyCharacterId: 'garudamon',    enemyLevel: 52, expReward: 46000, gemsFirstClear: 150, enemyCharacterIds: ['garudamon', 'angewomon'] },
      { index: 3, name: '⚔️ Boss — MagnaAngemon', enemyCharacterId: 'magnaAngemon', enemyLevel: 60, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 2.5, def: 1.5 }, enemyCharacterIds: ['garudamon', 'metalGreymon', 'magnaAngemon'] },
    ],
  },
  // ── WORLD 13: Base Secreta ───────────────────────────────────────────────────
  {
    id: 'map_lab',
    name: 'Base Secreta',
    description: 'Uma instalação industrial abandonada. Ultimates corruptos foram reativados para defender cada setor desta base sombria.',
    backgroundImage: require('../assets/images/maps/map_lab.webp'),
    requiredMapCleared: 'map_volcano',
    bitsReward: 14000,
    tamerExpReward: 290,
    stages: [
      { index: 0, name: 'Setor de Armazenamento', enemyCharacterId: 'magnaAngemon', enemyLevel: 53, expReward: 46000, gemsFirstClear: 50,  enemyCharacterIds: ['magnaAngemon', 'garudamon'] },
      { index: 1, name: 'Câmara de Controle',     enemyCharacterId: 'wereGarurumon',enemyLevel: 56, expReward: 47500, gemsFirstClear: 100, enemyCharacterIds: ['wereGarurumon', 'myotismon'] },
      { index: 2, name: 'Núcleo da Base',         enemyCharacterId: 'rizeGreymon',  enemyLevel: 56, expReward: 49000, gemsFirstClear: 150, enemyCharacterIds: ['rizeGreymon', 'magnaAngemon'] },
      { index: 3, name: '⚔️ Boss — Myotismon', enemyCharacterId: 'myotismon', enemyLevel: 62, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 2.5, def: 1.5 }, enemyCharacterIds: ['rizeGreymon', 'wereGarurumon', 'myotismon'] },
    ],
  },
  // ── WORLD 14: Monte Infernus ─────────────────────────────────────────────────
  {
    id: 'map_quarantine',
    name: 'Monte Infernus',
    description: 'Um campo de vulcões ativos sob um céu carmesim. Ultimates de luz, sombra e natureza dominam estas terras de fogo digital.',
    backgroundImage: require('../assets/images/maps/map_quarantine.webp'),
    requiredMapCleared: 'map_lab',
    bitsReward: 17000,
    tamerExpReward: 315,
    stages: [
      { index: 0, name: 'Planícies de Lava',  enemyCharacterId: 'myotismon',   enemyLevel: 66, expReward: 48000, gemsFirstClear: 50,  enemyCharacterIds: ['myotismon', 'wereGarurumon'] },
      { index: 1, name: 'Fendas Vulcânicas',  enemyCharacterId: 'garudamon',   enemyLevel: 66, expReward: 49500, gemsFirstClear: 100, enemyCharacterIds: ['garudamon', 'angewomon'] },
      { index: 2, name: 'Cume do Infernus',   enemyCharacterId: 'lillymon',    enemyLevel: 66, expReward: 50500, gemsFirstClear: 150, enemyCharacterIds: ['lillymon', 'rizeGreymon'] },
      { index: 3, name: '⚔️ Boss — Rosemon', enemyCharacterId: 'rosemon', enemyLevel: 70, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 2.5, def: 1.5 }, enemyCharacterIds: ['lillymon', 'garudamon', 'rosemon'] },
    ],
  },
  // ── WORLD 15: Pântano Digital ────────────────────────────────────────────────
  {
    id: 'map_battlefield',
    name: 'Pântano Digital',
    description: 'Terras alagadas cobertas por plantas digitais. Os Ultimates mais poderosos habitam estas profundezas, o último reduto antes das Megas.',
    backgroundImage: require('../assets/images/maps/map_battlefield.webp'),
    requiredMapCleared: 'map_quarantine',
    bitsReward: 20000,
    tamerExpReward: 340,
    stages: [
      { index: 0, name: 'Margem do Pântano',   enemyCharacterId: 'rizeGreymon',  enemyLevel: 66, expReward: 49000, gemsFirstClear: 50,  enemyCharacterIds: ['rizeGreymon', 'garudamon'] },
      { index: 1, name: 'Profundeza do Brejo', enemyCharacterId: 'lillymon',     enemyLevel: 66, expReward: 50000, gemsFirstClear: 100, enemyCharacterIds: ['lillymon', 'magnaAngemon'] },
      { index: 2, name: 'Raiz das Trevas',     enemyCharacterId: 'vnonMyotismon',enemyLevel: 66, expReward: 51000, gemsFirstClear: 150, enemyCharacterIds: ['vnonMyotismon', 'rosemon'] },
      { index: 3, name: '⚔️ Boss — WarGreymon', enemyCharacterId: 'warGreymon', enemyLevel: 70, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 2.5, def: 1.5 }, enemyCharacterIds: ['rizeGreymon', 'garudamon', 'warGreymon'] },
    ],
  },
  // ── WORLD 16: Desfiladeiro dos Ventos ───────────────────────────────────────
  {
    id: 'map_fog',
    name: 'Desfiladeiro dos Ventos',
    description: 'Um corredor de rocha dourada esculpido pelos ventos digitais. As primeiras Megas dominam cada passagem deste desfiladeiro lendário.',
    backgroundImage: require('../assets/images/maps/map_fog.webp'),
    requiredMapCleared: 'map_battlefield',
    bitsReward: 24000,
    tamerExpReward: 370,
    stages: [
      { index: 0, name: 'Entrada do Desfiladeiro', enemyCharacterId: 'warGreymon',    enemyLevel: 66, expReward: 50000, gemsFirstClear: 50,  enemyCharacterIds: ['warGreymon', 'metalGarurumon'] },
      { index: 1, name: 'Passagem dos Ventos',     enemyCharacterId: 'seraphimon',    enemyLevel: 67, expReward: 50000, gemsFirstClear: 100, enemyCharacterIds: ['seraphimon', 'warGreymon'] },
      { index: 2, name: 'Saída dos Guerreiros',    enemyCharacterId: 'metalGarurumon',enemyLevel: 67, expReward: 51000, gemsFirstClear: 150, enemyCharacterIds: ['metalGarurumon', 'goldramon'] },
      { index: 3, name: '⚔️ Boss — Ophanimon', enemyCharacterId: 'ophanimon', enemyLevel: 70, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 2.5, def: 1.5 }, enemyCharacterIds: ['angewomon', 'seraphimon', 'ophanimon'] },
    ],
  },
  // ── WORLD 17: Clareira Sagrada ───────────────────────────────────────────────
  {
    id: 'map_core',
    name: 'Clareira Sagrada',
    description: 'Uma clareira iluminada pelo sol digital onde Digimons Celestiais Mega guardam este lugar sagrado em silêncio eterno.',
    backgroundImage: require('../assets/images/maps/map_core.webp'),
    requiredMapCleared: 'map_fog',
    bitsReward: 28000,
    tamerExpReward: 405,
    stages: [
      { index: 0, name: 'Caminho Iluminado', enemyCharacterId: 'ophanimon',  enemyLevel: 70, expReward: 50000, gemsFirstClear: 50,  enemyCharacterIds: ['ophanimon', 'seraphimon'] },
      { index: 1, name: 'Altar da Floresta', enemyCharacterId: 'goldramon',  enemyLevel: 70, expReward: 51000, gemsFirstClear: 100, enemyCharacterIds: ['goldramon', 'magnadramon'] },
      { index: 2, name: 'Centro da Clareira',enemyCharacterId: 'phoenixmon', enemyLevel: 70, expReward: 52000, gemsFirstClear: 150, enemyCharacterIds: ['phoenixmon', 'goldramon'] },
      { index: 3, name: '⚔️ Boss — ShineGreymon', enemyCharacterId: 'shineGreymon', enemyLevel: 80, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 3.0, def: 1.5 }, enemyCharacterIds: ['rizeGreymon', 'phoenixmon', 'shineGreymon'] },
    ],
  },
  // ── WORLD 18: Zona Kernel ────────────────────────────────────────────────────
  {
    id: 'map_void',
    name: 'Zona Kernel',
    description: 'Plataformas flutuantes de dados suspensas num espaço digital infinito. O núcleo do Mundo Digital pulsa com energia primordial de Megas.',
    backgroundImage: require('../assets/images/maps/map_void.webp'),
    requiredMapCleared: 'map_core',
    bitsReward: 33000,
    tamerExpReward: 440,
    stages: [
      { index: 0, name: 'Plataformas Flutuantes', enemyCharacterId: 'shineGreymon', enemyLevel: 68, expReward: 51000, gemsFirstClear: 50,  enemyCharacterIds: ['shineGreymon', 'warGreymon'] },
      { index: 1, name: 'Corredor de Dados',      enemyCharacterId: 'magnadramon',  enemyLevel: 68, expReward: 52000, gemsFirstClear: 100, enemyCharacterIds: ['magnadramon', 'rosemon'] },
      { index: 2, name: 'Coração do Kernel',      enemyCharacterId: 'rosemon',      enemyLevel: 68, expReward: 53000, gemsFirstClear: 150, enemyCharacterIds: ['rosemon', 'phoenixmon', 'magnadramon'] },
      { index: 3, name: '⚔️ Boss — Sinduramon', enemyCharacterId: 'sinduramon', enemyLevel: 80, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 3.0, def: 1.5 }, enemyCharacterIds: ['phoenixmon', 'shineGreymon', 'sinduramon'] },
    ],
  },
  // ── WORLD 19: Setor Omega ────────────────────────────────────────────────────
  {
    id: 'map_apocalypse',
    name: 'Setor Omega',
    description: 'Uma instalação urbana de aço e concreto digital. Entidades de dados corrompidos patrulham cada corredor desta fortaleza sombria.',
    backgroundImage: require('../assets/images/maps/map_apocalypse.webp'),
    requiredMapCleared: 'map_void',
    bitsReward: 40000,
    tamerExpReward: 490,
    stages: [
      { index: 0, name: 'Setor Industrial',   enemyCharacterId: 'sinduramon',     enemyLevel: 68, expReward: 51000, gemsFirstClear: 50,  enemyCharacterIds: ['sinduramon', 'shineGreymon'] },
      { index: 1, name: 'Núcleo de Controle', enemyCharacterId: 'gulusGammamon',  enemyLevel: 68, expReward: 52000, gemsFirstClear: 100, enemyCharacterIds: ['gulusGammamon', 'sinduramon'] },
      { index: 2, name: 'Câmara Omega',       enemyCharacterId: 'valdurmon',      enemyLevel: 68, expReward: 53000, gemsFirstClear: 150, enemyCharacterIds: ['valdurmon', 'gulusGammamon'] },
      { index: 3, name: '⚔️ Boss — GulusGammamon', enemyCharacterId: 'gulusGammamon', enemyLevel: 81, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 3.0, def: 2.0 }, enemyCharacterIds: ['valdurmon', 'regulusmon', 'gulusGammamon'] },
    ],
  },
  // ── WORLD 20: Corredor Final ─────────────────────────────────────────────────
  {
    id: 'map_omega',
    name: 'Corredor Final',
    description: 'Um corredor interminável de aço e luz — a última fronteira antes do fim. Apenas as formas mais poderosas sobrevivem aqui.',
    backgroundImage: require('../assets/images/maps/map_omega.webp'),
    requiredMapCleared: 'map_apocalypse',
    bitsReward: 45000,
    tamerExpReward: 545,
    stages: [
      { index: 0, name: 'Corredor de Aço',    enemyCharacterId: 'valdurmon',         enemyLevel: 68,  expReward: 52000, gemsFirstClear: 50,  enemyCharacterIds: ['valdurmon', 'sinduramon'] },
      { index: 1, name: 'Sala de Julgamento', enemyCharacterId: 'shineGreymonBurstMode', enemyLevel: 70, expReward: 53000, gemsFirstClear: 100, enemyCharacterIds: ['shineGreymonBurstMode', 'warGreymon'] },
      { index: 2, name: 'Portal do Fim',      enemyCharacterId: 'rosemonBurstMode',  enemyLevel: 70, expReward: 54000, gemsFirstClear: 150, enemyCharacterIds: ['rosemonBurstMode', 'shineGreymonBurstMode', 'valdurmon'] },
      { index: 3, name: '⚔️ Boss — RosemonBurstMode', enemyCharacterId: 'rosemonBurstMode', enemyLevel: 85, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 3.5, def: 2.0 }, enemyCharacterIds: ['valdurmon', 'shineGreymonBurstMode', 'rosemonBurstMode'] },
    ],
  },
  // ── WORLD 21: Arena dos Dados ───────────────────────────────────────────────
  {
    id: 'map_pixel_arena',
    name: 'Arena dos Dados',
    description: 'Uma arena pixel art flutuante no coração do Mundo Digital. Os guerreiros mais poderosos se enfrentam aqui na batalha final.',
    backgroundImage: require('../assets/images/maps/dungeon_gulus_bg.webp'),
    requiredMapCleared: 'map_omega',
    bitsReward: 50000,
    tamerExpReward: 600,
    stages: [
      { index: 0, name: 'Pista de Entrada', enemyCharacterId: 'shineGreymonBurstMode', enemyLevel: 72,  expReward: 52000, gemsFirstClear: 50,  enemyCharacterIds: ['shineGreymonBurstMode', 'rosemonBurstMode'] },
      { index: 1, name: 'Centro da Arena',  enemyCharacterId: 'valdurmon',             enemyLevel: 72,  expReward: 54000, gemsFirstClear: 100, enemyCharacterIds: ['valdurmon', 'gulusGammamon', 'sinduramon'] },
      { index: 2, name: 'Final do Torneio', enemyCharacterId: 'rosemonBurstMode',      enemyLevel: 72, expReward: 55000, gemsFirstClear: 200, enemyCharacterIds: ['shineGreymonBurstMode', 'metalGarurumon', 'warGreymon'] },
      { index: 3, name: '⚔️ Boss — Omegamon', enemyCharacterId: 'omegamon', enemyLevel: 88, expReward: 0, gemsFirstClear: 100, isBoss: true, tamerCrestReward: { amount: 3 }, bossMultipliers: { hp: 4.0, def: 2.5 }, enemyCharacterIds: ['rosemonBurstMode', 'shineGreymonBurstMode', 'omegamon'] },
    ],
  },
  // ── DUNGEONS (ao final) ──────────────────────────────────────────────────────
];

// Eventos agendados.
export const EVENT_MAPS: GameMap[] = [
  {
    id: 'event_starry_night',
    name: 'Noite Estrelada',
    description: 'Um céu sagrado se abre a cada quinzena. Derrote os três anjos para receber 5 Fragmentos de Estrela Dourada por evento.',
    isBiweeklyEvent: true,
    requiredTamerLevel: 10,
    backgroundImage: require('../assets/images/events/noite-estrelada.jpg'),
    bitsReward: 5000,
    tamerExpReward: 500,
    stages: [
      {
        index: 0,
        name: 'Noite Estrelada — Trindade Angelical',
        enemyCharacterId: 'name:Dominimon',
        enemyCharacterIds: ['name:Dominimon', 'name:ClavisAngemon', 'name:SlashAngemon'],
        enemyLevel: 60,
        enemyAscensionStars: 1,
        expReward: 12000,
        bossMultipliers: { hp: 1.2, def: 1.1 },
        isBoss: true,
      },
    ],
  },
  {
    id: 'event_oasis_olimpo',
    name: 'Oásis do Olimpo',
    description: 'Evento semanal do Olimpo. Disponível toda quarta-feira, das 18:00 às 21:00. Derrote as duas levas de Digimon olímpicos.',
    isWeeklyEvent: true,
    requiredTamerLevel: 20,
    availableDays: [3],
    availableHours: [{ start: 18, end: 21 }],
    backgroundImage: require('../assets/images/oases_do_olimpo.gif'),
    bitsReward: 0,
    tamerExpReward: 0,
    stages: [
      {
        index: 0,
        name: 'Deuses do Olimpo',
        enemyCharacterId: 'name:Junomon',
        enemyCharacterIds: ['name:Junomon', 'name:Dianamon', 'name:Apollomon'],
        enemyLevel: 60,
        enemyLevels: [60, 60, 60],
        waves: [
          { enemyCharacterIds: ['name:Junomon', 'name:Dianamon', 'name:Apollomon'], enemyLevels: [60, 60, 60] },
          { enemyCharacterIds: ['name:Dianamon', 'name:Apollomon', 'name:GraceNovamon'], enemyLevels: [80, 80, 70] },
        ],
        expReward: 0,
        isBoss: true,
        drops: [
          { type: 'piece', id: 'piece_paper_apollomon', amount: 1, chance: 0.05 },
          { type: 'piece', id: 'piece_paper_bacchusmon', amount: 1, chance: 0.05 },
          { type: 'piece', id: 'piece_paper_ceresmon', amount: 1, chance: 0.05 },
          { type: 'piece', id: 'piece_paper_dianamon', amount: 1, chance: 0.05 },
          { type: 'piece', id: 'piece_paper_junomon', amount: 1, chance: 0.05 },
          { type: 'piece', id: 'piece_paper_jupitermon', amount: 1, chance: 0.05 },
          { type: 'piece', id: 'piece_paper_mercurymon', amount: 1, chance: 0.05 },
          { type: 'piece', id: 'piece_paper_minervamon', amount: 1, chance: 0.05 },
          { type: 'piece', id: 'piece_paper_neptunemon', amount: 1, chance: 0.05 },
          { type: 'piece', id: 'piece_paper_venusmon', amount: 1, chance: 0.05 },
          { type: 'piece', id: 'piece_paper_vulcanusmon', amount: 1, chance: 0.05 },
          { type: 'piece', id: 'piece_paper_plutomon', amount: 1, chance: 0.03 },
        ],
      },
    ],
  },
];

// Masmorras.
export const DUNGEON_MAPS: GameMap[] = [
  {
    id: 'dungeon_daily_xp',
    name: 'Treinamento Diário',
    description: 'Enfrente Lucemon Chaos Mode para ganhar EXP massiva. Reseta todo dia à meia-noite. Apenas 1x por dia.',
    isDungeon: true,
    isDaily: true,
    requiredTamerLevel: 10,
    backgroundImage: require('../assets/images/maps/dungeon_gulus_bg.webp'),
    bitsReward: 500,
    stages: [
      {
        index: 0,
        name: 'Boss — Lucemon Chaos Mode',
        enemyCharacterId: 'lucemonChaosMode',
        enemyLevel: 10,
        expReward: 3600,
        gemsFirstClear: 100,
        bossMultipliers: { hp: 1.5, def: 1.2 },
        drops: [
          { type: 'bits', amount: 500, chance: 1.00 },
        ],
      },
    ],
  },
  {
    id: 'dungeon_gulus',
    name: 'Covil do Gulus',
    description: 'Uma masmorra digital sombria onde GulusGammamon reina. Derrote-o para obter Bits e Fragmentos de Brasão.',
    isDungeon: true,
    requiredTamerLevel: 15,
    availableDays: [0, 1, 4],
    availableHours: [{ start: 6, end: 9 }, { start: 12, end: 15 }, { start: 18, end: 21 }],
    backgroundImage: require('../assets/images/maps/dungeon_gulus.webp'),
    stages: [
      {
        index: 0,
        name: 'Boss — GulusGammamon',
        enemyCharacterId: 'gulusGammamon',
        enemyLevel: 25,
        expReward: 0,
        gemsFirstClear: 100,
        bossMultipliers: { hp: 2, def: 4 / 3 },
        firstClearReward: 'digivice_d2',
        drops: [
          { type: 'bits',  amount: 1000,  chance: 1.00 },
          { type: 'piece', id: 'piece_brasao_coragem',      amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_brasao_esperanca',    amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_brasao_amizade',      amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_brasao_confianca',    amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_brasao_pureza',       amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_brasao_conhecimento', amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_brasao_luz',          amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_brasao_amor',         amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_brasao_bondade',      amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_black_digitron',       amount: 1, chance: 0.05 },
        ],
      },
    ],
  },
  {
    id: 'dungeon_gulus_digivice',
    name: 'Covil de Arcturiusmon',
    description: 'Enfrente Arcturiusmon, Omegamon X e Lucemon X para obter recompensas raras, incluindo Fragmentos do X-Antibody.',
    isDungeon: true,
    requiredTamerLevel: 15,
    availableDays: [2, 4, 6],
    availableHours: [{ start: 6, end: 9 }, { start: 12, end: 15 }, { start: 18, end: 21 }],
    backgroundImage: require('../assets/images/maps/dungeon_gulus.webp'),
    stages: [
      {
        index: 0,
        name: 'Covil de Arcturiusmon',
        enemyCharacterId: 'name:Arcturiusmon',
        enemyCharacterIds: ['name:Arcturiusmon', 'name:Omegamon X', 'name:Lucemon X'],
        enemyLevel: 60,
        enemyLevels: [60, 60, 60],
        enemyAscensionStarsByIndex: [0, 0, 0],
        expReward: 0,
        gemsFirstClear: 100,
        drops: [
          { type: 'piece', id: 'piece_digivice_d3', amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_digivice_d_ark', amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_digivice_xros_loader', amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_brasao_milagre', amount: 1, chance: 0.05 },
          { type: 'piece', id: 'piece_brasao_destino', amount: 1, chance: 0.05 },
          { type: 'piece', id: 'piece_x_antibody', amount: 1, chance: 0.05 },
        ],
      },
    ],
  },
];

export const GAME_MAPS: GameMap[] = [...NORMAL_MAPS, ...EVENT_MAPS, ...DUNGEON_MAPS];
