export type AttributeId = 'VC' | 'VR' | 'DA' | 'NO' | 'UN' | 'FR';
export type ElementId = 'FIRE' | 'PLANT' | 'WATER' | 'WIND' | 'EARTH' | 'LIGHTNING' | 'LIGHT' | 'DARK' | 'NULL' | 'ICE' | 'METAL';
export type RarityId = 'EGG' | 'BABY' | 'TRAINING' | 'ROOKIE' | 'CHAMPION' | 'ULTIMATE' | 'MEGA' | 'ULTRA' | 'BURST';

export interface BaseStats {
  hp: number;
  mp: number;
  atk: number;
  def: number;
  spt: number;
  spd: number;
  apt: number;
}

export interface Character {
  id: string;
  name: string;
  rarity: RarityId;
  attribute: AttributeId;
  element: ElementId;
  baseStats: BaseStats;
  description: string;
  attackName?: string;
  spiritName?: string;
  attackElement?: ElementId;
  spiritElement?: ElementId;
  spiritHitsAll?: boolean;
}

// ─── Attributes ────────────────────────────────────────────────────────────────
export const ATTRIBUTES: Record<AttributeId, { label: string; abbr: string; color: string; beats: AttributeId | null; weakTo: AttributeId | null }> = {
  VC: { label: 'Vacina',       abbr: 'VC', color: '#22c55e', beats: 'VR', weakTo: 'DA' },
  VR: { label: 'Vírus',        abbr: 'VR', color: '#ef4444', beats: 'DA', weakTo: 'VC' },
  DA: { label: 'Data',         abbr: 'DA', color: '#3b82f6', beats: 'VC', weakTo: 'VR' },
  NO: { label: 'Nulo',         abbr: 'NO', color: '#6b7280', beats: null, weakTo: 'UN' },
  UN: { label: 'Desconhecido', abbr: 'UN', color: '#a855f7', beats: 'NO', weakTo: null },
  FR: { label: 'Livre',        abbr: 'FR', color: '#f59e0b', beats: null, weakTo: null },
};

// ─── Elements ──────────────────────────────────────────────────────────────────
export const ELEMENTS: Record<ElementId, { label: string; color: string; beats: ElementId | null; weakTo: ElementId | null }> = {
  FIRE:      { label: 'Fogo',      color: '#ff6b35', beats: 'PLANT',     weakTo: 'WATER' },
  PLANT:     { label: 'Planta',    color: '#22c55e', beats: 'WATER',     weakTo: 'FIRE' },
  WATER:     { label: 'Água',      color: '#3b82f6', beats: 'FIRE',      weakTo: 'PLANT' },
  WIND:      { label: 'Vento',     color: '#84cc16', beats: 'EARTH',     weakTo: 'LIGHTNING' },
  EARTH:     { label: 'Terra',     color: '#a16207', beats: 'LIGHTNING', weakTo: 'WIND' },
  LIGHTNING: { label: 'Raio',      color: '#facc15', beats: 'WIND',      weakTo: 'EARTH' },
  LIGHT:     { label: 'Luz',       color: '#fde68a', beats: 'DARK',      weakTo: 'DARK' },
  DARK:      { label: 'Trevas',    color: '#8b5cf6', beats: 'LIGHT',     weakTo: 'LIGHT' },
  NULL:      { label: 'Nulo',      color: '#6b7280', beats: null,        weakTo: null },
  ICE:       { label: 'Gelo',      color: '#a8d8f0', beats: 'WIND',      weakTo: 'FIRE' },
  METAL:     { label: 'Metal',     color: '#94a3b8', beats: 'PLANT',     weakTo: 'FIRE' },
};

// ─── Characters ───────────────────────────────────────────────────────────────
export const CHARACTERS: Record<string, Character> = {
  slashAngemon: {
    id: 'name:SlashAngemon',
    name: 'SlashAngemon',
    rarity: 'MEGA',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 272, mp: 233, atk: 155, def: 134, spt: 119, spd: 141, apt: 72 },
    description: 'SlashAngemon, Digimon do atributo Vacina e elemento Luz.',
    attackName: 'Sonic Counter',
    attackElement: 'NULL',
    spiritName: 'Shine Slash',
    spiritElement: 'LIGHT',
  },
  specialDigitama: {
    id: 'specialDigitama',
    name: 'Digitama Especial',
    rarity: 'EGG',
    attribute: 'DA',
    element: 'NULL',
    baseStats: { hp: 1, mp: 1, atk: 1, def: 1, spt: 1, spd: 1, apt: 0 },
    description: 'Digitama Especial. Pode chocar uma forma bebê aleatória do Mundo Digital.',
  },
  agumon: {
    id: 'agumon',
    name: 'Agumon',
    rarity: 'ROOKIE',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 135, mp: 132, atk: 88, def: 73, spt: 60, spd: 66, apt: 40 },
    description: 'Um dinossauro digital corajoso do tipo Vacina. Domina o fogo e possui força física notável.',
    attackName: 'Garras Afiadas ○',
    spiritName: 'Chama Bebê 🔥',
  },
  arestradamon: {
    id: 'arestradamon',
    name: 'Arestradamon',
    rarity: 'CHAMPION',
    attribute: 'DA',
    element: 'WIND',
    baseStats: { hp: 188, mp: 174, atk: 126, def: 108, spt: 102, spd: 114, apt: 35 },
    description: 'Digimon Champion que domina correntes de vento e lâminas de energia. Sua velocidade abre caminho através das defesas inimigas.',
    attackName: 'Flog Shot ⚔️',
    spiritName: 'Spin Caliber ⚔️',
  },
  agumonHakase: {
    id: 'agumonHakase',
    name: 'Agumon Hakase',
    rarity: 'ROOKIE',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 135, mp: 132, atk: 88, def: 73, spt: 60, spd: 66, apt: 40 },
    description: 'Uma variante de Agumon dedicada à pesquisa e ao conhecimento do Mundo Digital.',
    attackName: 'Garras Afiadas ○',
    spiritName: 'Chama Bebê 🔥',
  },
  agumonSaver: {
    id: 'agumonSaver',
    name: 'Agumon (Saver)',
    rarity: 'ROOKIE',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 135, mp: 130, atk: 94, def: 76, spt: 66, spd: 69, apt: 24 },
    description: 'Uma variante poderosa do Agumon com atributo Vacina. Lutador nato do fogo com ataque e defesa superiores à versão clássica.',
  },
  geoGreymon: {
    id: 'geoGreymon',
    name: 'GeoGreymon',
    rarity: 'CHAMPION',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 173, mp: 175, atk: 116, def: 98, spt: 71, spd: 80, apt: 35 },
    description: 'A poderosa evolução Champion do Agumon (Saver). Um dinossauro blindado do tipo Vacina com força de fogo devastadora e resistência excepcional em batalha.',
  },
  rizeGreymon: {
    id: 'rizeGreymon',
    name: 'RizeGreymon',
    rarity: 'ULTIMATE',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 220, mp: 247, atk: 138, def: 108, spt: 93, spd: 110, apt: 55 },
    description: 'A forma Ultimate do GeoGreymon. Um dinossauro cibernético do tipo Vacina armado com canhões de fogo. Combina poder bruto e tecnologia para devastar qualquer inimigo.',
  },
  shineGreymon: {
    id: 'shineGreymon',
    name: 'ShineGreymon',
    rarity: 'MEGA',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 323, mp: 330, atk: 173, def: 140, spt: 121, spd: 127, apt: 70 },
    description: 'O ápice da linha evolutiva do Agumon (Saver). Um guerreiro solar do tipo Vacina revestido em armadura de luz solar, capaz de desencadear chamas divinas devastadoras.',
  },
  gabumon: {
    id: 'gabumon',
    name: 'Gabumon',
    rarity: 'ROOKIE',
    attribute: 'DA',
    element: 'WATER',
    baseStats: { hp: 113, mp: 102, atk: 86, def: 59, spt: 53, spd: 63, apt: 22 },
    description: 'Um Digimon do tipo Data coberto por pele de lobo azul. Controla as forças da água.',
  },
  demiDevimon: {
    id: 'demiDevimon',
    name: 'DemiDevimon',
    rarity: 'ROOKIE',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 100, mp: 118, atk: 75, def: 67, spt: 63, spd: 64, apt: 22 },
    description: 'Um pequeno Digimon maligno do tipo Vírus. Usa suas asas e presas para atacar com poder das trevas.',
  },
  guilmon: {
    id: 'guilmon',
    name: 'Guilmon',
    rarity: 'ROOKIE',
    attribute: 'VR',
    element: 'FIRE',
    baseStats: { hp: 120, mp: 101, atk: 87, def: 67, spt: 55, spd: 50, apt: 23 },
    description: 'Um dinossauro digital do tipo Vírus imbuído do poder do fogo. Apesar de ser Rookie, possui força de ataque que rivaliza Champions.',
    attackName: 'Garras Afiadas ○',
    spiritName: 'Respiração Pimenta 🔥',
  },
  growlmon: {
    id: 'growlmon',
    name: 'Growlmon',
    rarity: 'CHAMPION',
    attribute: 'VR',
    element: 'FIRE',
    baseStats: { hp: 175, mp: 161, atk: 117, def: 94, spt: 78, spd: 72, apt: 40 },
    description: 'A evolução Champion do Guilmon. Um dragão do tipo Vírus que combina garras afiadas com chamas explosivas devastadoras.',
    attackName: 'Growl Claw ○',
    spiritName: 'Exhaust Flame 🔥',
  },
  megaloGrowlmon: {
    id: 'megaloGrowlmon',
    name: 'MegaloGrowlmon',
    rarity: 'ULTIMATE',
    attribute: 'VR',
    element: 'FIRE',
    baseStats: { hp: 230, mp: 226, atk: 144, def: 124, spt: 98, spd: 92, apt: 50 },
    description: 'A forma Ultimate do Growlmon. Um dragão cibernético do tipo Vírus com armadura blindada e canhões de fogo capazes de devastar qualquer oponente.',
    attackName: 'Dramon Claw ○',
    spiritName: 'Giga Flame 🔥',
  },
  gallantmon: {
    id: 'gallantmon',
    name: 'Gallantmon',
    rarity: 'MEGA',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 326, mp: 344, atk: 182, def: 165, spt: 165, spd: 137, apt: 85 },
    description: 'O Cavaleiro Sagrado do Digital. A forma Mega do MegaloGrowlmon, um guerreiro do tipo Vírus que paradoxalmente empunha a luz divina para proteger o mundo.',
    attackName: 'EX Damage ○',
    spiritName: 'Heroic Power ✨',
  },
  gallantmonCrimsonMode: {
    id: 'gallantmonCrimsonMode',
    name: 'Gallantmon Crimson Mode',
    rarity: 'ULTRA',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 336, mp: 370, atk: 190, def: 170, spt: 168, spd: 143, apt: 99 },
    description: 'A forma transcendente do Gallantmon fundido com o poder do Seraphimon. Seu Shining Laser purifica todos os inimigos simultaneamente com luz divina absoluta.',
    attackName: 'Mach Rush ○',
    spiritName: 'Shining Laser ✨',
    spiritHitsAll: false,
  },
  lucemon: {
    id: 'lucemon',
    name: 'Lucemon',
    rarity: 'ROOKIE',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 112, mp: 116, atk: 79, def: 69, spt: 78, spd: 72, apt: 30 },
    description: 'O Anjo Caído em forma de criança. Um Rookie do tipo Vacina com poder divino imenso e uma dualidade entre a luz pura e a escuridão latente que o conduzirá a transformações devastadoras.',
    attackName: 'Holy Bolt ✨',
    spiritName: 'Grand Cross ✨',
  },
  lucemonChaosMode: {
    id: 'lucemonChaosMode',
    name: 'Lucemon Chaos Mode',
    rarity: 'ULTIMATE',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 243, mp: 265, atk: 142, def: 113, spt: 119, spd: 118, apt: 70 },
    description: 'A forma corrompida do Anjo Caído. Nascido da fusão da luz e das trevas, Lucemon Chaos Mode é um ser de poder absoluto e destruição implacável, equilibrando o divino e o demoníaco em perfeita harmonia sombria.',
    attackName: 'Divine Dasher ✨',
    spiritName: 'Chaos Blast 🌑',
  },
  lucemonSatanMode: {
    id: 'lucemonSatanMode',
    name: 'Lucemon Satan Mode',
    rarity: 'MEGA',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 250, mp: 265, atk: 142, def: 113, spt: 119, spd: 118, apt: 90 },
    description: 'A encarnação definitiva da destruição. Lucemon Satan Mode é a forma final e mais aterrorizante do Anjo Caído, um ser de trevas absolutas capaz de aniquilar qualquer coisa que se oponha a ele com seu poder demoníaco incomparável.',
    attackName: 'Divine Atonement 🌑',
    spiritName: 'Purgatorial Flame 🔥',
  },
  lucemonFM: {
    id: 'lucemonFM',
    name: 'Lucemon Larva Mode',
    rarity: 'MEGA',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 250, mp: 265, atk: 142, def: 113, spt: 119, spd: 118, apt: 80 },
    description: 'A verdadeira forma de Lucemon oculta dentro de Satan Mode. Após a destruição do corpo externo, a Larva emerge — um ser de trevas puras com poder que transcende o nível Mega.',
    attackName: 'Paradise Lost Kai 🌑',
    spiritName: 'Divine Atonement ⚡',
  },
  lucemonX: {
    id: 'lucemonX',
    name: 'Lucemon X',
    rarity: 'MEGA',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 255, mp: 270, atk: 148, def: 118, spt: 125, spd: 122, apt: 85 },
    description: 'A variante X-Antibody do Anjo Caído. Potencializado pelo X-Antibody, Lucemon X transcende os limites normais do Mega, manifestando um poder das trevas ainda mais absoluto e aterrorizante.',
    attackName: 'Paradise Lost X 🌑',
    spiritName: 'Eternal Damnation 💀',
  },
  magnadramon: {
    id: 'magnadramon',
    name: 'Magnadramon',
    rarity: 'MEGA',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 261, mp: 296, atk: 139, def: 134, spt: 149, spd: 131, apt: 66 },
    description: 'O Dragão Sagrado das Chamas Rosadas. A forma Mega da Angewomon, um poderoso dragão do tipo Vacina que incorpora o poder puro da luz e do vento. Sua presença sagrada é capaz de purificar qualquer corrupção no Mundo Digital.',
    attackName: 'Giga Scissor ⚡',
    spiritName: 'Holy Bolt ✨',
  },
  ophanimon: {
    id: 'ophanimon',
    name: 'Ophanimon',
    rarity: 'MEGA',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 233, mp: 275, atk: 131, def: 124, spt: 141, spd: 125, apt: 80 },
    description: 'A Anja Celestial Suprema. A forma Mega da Angewomon, guardiã do Mundo Digital e uma das três anjas celestiais do tipo Vacina. Com poder divino absoluto, Ophanimon mantém o equilíbrio entre a luz e as trevas com perfeição inabalável.',
    attackName: 'Giga Scissor ⚡',
    spiritName: 'Holy Bolt ✨',
  },
  angewomon: {
    id: 'angewomon',
    name: 'Angewomon',
    rarity: 'ULTIMATE',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 215, mp: 237, atk: 127, def: 99, spt: 117, spd: 114, apt: 46 },
    description: 'A Anjo Guerreira Sagrada. A forma Ultimate da Tailmon, uma bela e poderosa anja do tipo Vacina que desce dos céus com luz divina. Sua flecha celestial é capaz de purificar qualquer trevas e derrotar até as forças do mal mais obscuras.',
    attackName: 'Saint Air ✨',
    spiritName: 'Celestial Arrow ✨',
  },
  tailmon: {
    id: 'tailmon',
    name: 'Tailmon',
    rarity: 'CHAMPION',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 138, mp: 151, atk: 95, def: 77, spt: 86, spd: 89, apt: 32 },
    description: 'O Digimon Gato Sagrado. A forma Champion da Salamon, uma guerreira ágil e misteriosa do tipo Vacina. Suas garras banhadas de luz divina são capazes de dissipar as trevas, e sua velocidade surpreende até os inimigos mais poderosos.',
    attackName: 'Sharp Claw ○',
    spiritName: 'Lightning Paw ✨',
  },
  salamon: {
    id: 'salamon',
    name: 'Salamon',
    rarity: 'ROOKIE',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 105, mp: 119, atk: 76, def: 59, spt: 64, spd: 61, apt: 20 },
    description: 'O Digimon Cachorrinho Sagrado. Um Rookie do tipo Vacina pacífico e gentil, dotado de luz divina. Apesar de sua aparência inofensiva, carrega dentro de si um poder celestial capaz de evoluir em poderosas guerreiras da luz.',
    attackName: 'Petit Bite ○',
    spiritName: 'Puppy Howl ✨',
  },
  phoenixmon: {
    id: 'phoenixmon',
    name: 'Phoenixmon',
    rarity: 'MEGA',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 325, mp: 352, atk: 171, def: 141, spt: 167, spd: 141, apt: 80 },
    description: 'A Fênix Sagrada. A forma Mega da Garudamon, considerada a encarnação da luz e do renascimento. Dotada de poder divino inigualável, esta majestosa ave lendária do tipo Vacina representa a esperança eterna e a purificação das trevas.',
    attackName: 'Fatal Cannon ✨',
    spiritName: 'Starlight Explosion ✨',
  },
  garudamon: {
    id: 'garudamon',
    name: 'Garudamon',
    rarity: 'ULTIMATE',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 215, mp: 250, atk: 128, def: 99, spt: 116, spd: 115, apt: 50 },
    description: 'O Digimon Guerreiro das Chamas. A forma Ultimate da Birdramon, uma poderosa ave de batalha do tipo Vacina revestida de armadura vermelha. Seus ataques de fogo são capazes de varrer campos inteiros de inimigos.',
    attackName: 'Crimson Claw 🔥',
    spiritName: 'Shadow Wing 🔥',
  },
  birdramon: {
    id: 'birdramon',
    name: 'Birdramon',
    rarity: 'CHAMPION',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 149, mp: 168, atk: 92, def: 75, spt: 88, spd: 90, apt: 35 },
    description: 'O Digimon Pássaro de Chamas. A forma Champion da Biyomon, uma enorme ave de fogo do tipo Vacina que domina os céus com velocidade e poder devastador. Suas asas incandescentes evaporam qualquer obstáculo.',
    attackName: 'Air Cutter 🌀',
    spiritName: 'Meteor Wing 🌀',
  },
  pyomon: {
    id: 'pyomon',
    name: 'Biyomon',
    rarity: 'ROOKIE',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 101, mp: 114, atk: 72, def: 61, spt: 66, spd: 79, apt: 21 },
    description: 'O Digimon Pássaro de Fogo. Um Rookie do tipo Vacina ágil e corajoso, com asas flamejantes e personalidade ardente. Usa ataques de fogo e impacto para surpreender os inimigos com velocidade.',
    attackName: 'Double Flick ○',
    spiritName: 'Raging Fire 🔥',
  },
  patamon: {
    id: 'patamon',
    name: 'Patamon',
    rarity: 'ROOKIE',
    attribute: 'DA',
    element: 'WIND',
    baseStats: { hp: 121, mp: 114, atk: 68, def: 54, spt: 58, spd: 55, apt: 20 },
    description: 'O Digimon Asa-Orelha. Um Rookie do tipo Vacina com personalidade gentil e corajosa. Apesar de sua aparência fofa, esconde um poder divino capaz de evoluir para poderosos anjos guerreiros.',
    attackName: 'Tackle ○',
    spiritName: 'Air Shot 🌀',
  },
  angemon: {
    id: 'angemon',
    name: 'Angemon',
    rarity: 'CHAMPION',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 168, mp: 191, atk: 96, def: 79, spt: 89, spd: 78, apt: 37 },
    description: 'O Anjo de Seis Asas. A forma Champion do Patamon, um guerreiro celestial do tipo Vacina que usa a luz sagrada para proteger os inocentes e combater as forças das trevas.',
    attackName: 'Light Knuckle ✨',
    spiritName: 'Heart Break ✨',
  },
  magnaAngemon: {
    id: 'magnaAngemon',
    name: 'MagnaAngemon',
    rarity: 'ULTIMATE',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 234, mp: 264, atk: 128, def: 112, spt: 123, spd: 102, apt: 57 },
    description: 'O Anjo Sagrado de armadura dourada. A forma Ultimate do Angemon, um guerreiro celestial do tipo Vacina que empunha a luz divina para combater o mal com precisão e poder inabaláveis.',
    attackName: 'Ring of Light ✨',
    spiritName: 'Shine Slash ✨',
  },
  goldramon: {
    id: 'goldramon',
    name: 'Goldramon',
    rarity: 'MEGA',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 333, mp: 349, atk: 182, def: 151, spt: 168, spd: 138, apt: 80 },
    description: 'O Dragão Divino do Céu Dourado. Forma Mega do MagnaAngemon, um imponente dragão Vacina revestido de armadura dourada que comanda a luz e a terra. Sua presença irradia poder sagrado capaz de julgar qualquer ser corrompido.',
    attackName: 'God Cannon ✨',
    spiritName: 'Burst Counter 🌍',
  },
  seraphimon: {
    id: 'seraphimon',
    name: 'Seraphimon',
    rarity: 'MEGA',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 308, mp: 366, atk: 178, def: 148, spt: 177, spd: 137, apt: 77 },
    description: 'O Lorde dos Anjos. A forma Mega do MagnaAngemon, guardião celestial do tipo Vacina que concentra a luz divina para purificar qualquer mal.',
    attackName: 'Starlight EX ✨',
    spiritName: '7 Heavens ✨',
  },
  devimon: {
    id: 'devimon',
    name: 'Devimon',
    rarity: 'CHAMPION',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 166, mp: 170, atk: 108, def: 82, spt: 92, spd: 79, apt: 48 },
    description: 'O Anjo das Trevas. A forma Champion do DemiDevimon, um Digimon do tipo Vírus com poderes sombrios devastadores e asas negras imponentes.',
  },
  myotismon: {
    id: 'myotismon',
    name: 'Myotismon',
    rarity: 'ULTIMATE',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 233, mp: 260, atk: 132, def: 121, spt: 119, spd: 95, apt: 60 },
    description: 'O Lorde das Trevas. A forma Ultimate do Devimon, um vampiro Digimon do tipo Vírus com domínio sobre a escuridão e poderes de manipulação da mente.',
  },
  vnonMyotismon: {
    id: 'vnonMyotismon',
    name: 'VenomMyotismon',
    rarity: 'MEGA',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 322, mp: 345, atk: 231, def: 182, spt: 186, spd: 163, apt: 66 },
    description: 'A forma Mega corrompida do Myotismon. Consumido pelo veneno das trevas, VenomMyotismon é uma força destrutiva imparável do tipo Vírus, com poder devastador e brutalidade sem limites.',
  },
  garurumon: {
    id: 'garurumon',
    name: 'Garurumon',
    rarity: 'CHAMPION',
    attribute: 'DA',
    element: 'ICE',
    baseStats: { hp: 144, mp: 107, atk: 91, def: 80, spt: 53, spd: 61, apt: 22 },
    description: 'A evolução feroz do Gabumon. Um lobo de gelo do tipo Vacina com mandíbulas poderosas capazes de congelar qualquer inimigo.',
  },
  wereGarurumon: {
    id: 'wereGarurumon',
    name: 'WereGarurumon',
    rarity: 'ULTIMATE',
    attribute: 'DA',
    element: 'ICE',
    baseStats: { hp: 200, mp: 220, atk: 130, def: 115, spt: 80, spd: 100, apt: 30 },
    description: 'A forma Ultimate do Garurumon. Um guerreiro humanoide do gelo com força devastadora e velocidade surpreendente.',
  },
  merukimon: {
    id: 'merukimon',
    name: 'Merukimon',
    rarity: 'MEGA',
    attribute: 'VR',
    element: 'WIND',
    baseStats: { hp: 290, mp: 265, atk: 172, def: 130, spt: 135, spd: 188, apt: 72 },
    description: 'Merukimon, Digimon do tipo Vírus que domina o elemento Vento.',
    attackName: 'Wind Claw',
    attackElement: 'WIND',
    spiritName: 'Razor Wind',
    spiritElement: 'WIND',
  },
  armageddemon: {
    id: 'armageddemon',
    name: 'Armageddemon',
    rarity: 'MEGA',
    attribute: 'UN',
    element: 'DARK',
    baseStats: { hp: 320, mp: 290, atk: 190, def: 150, spt: 150, spd: 145, apt: 80 },
    description: 'Armageddemon, Digimon de nível Mega e natureza desconhecida, registrado no catálogo principal do jogo.',
    attackName: 'Ultimate Flare',
    attackElement: 'DARK',
    spiritName: 'Black Rain',
    spiritElement: 'DARK',
  },
  metalGarurumon: {
    id: 'metalGarurumon',
    name: 'MetalGarurumon',
    rarity: 'MEGA',
    attribute: 'DA',
    element: 'ICE',
    baseStats: { hp: 312, mp: 338, atk: 167, def: 121, spt: 124, spd: 131, apt: 72 },
    description: 'A forma Mega do WereGarurumon. Um lobo metálico blindado que domina os elementos gelo e água, disparando mísseis criogênicos devastadores. Considerado um dos Digimon Vacina mais poderosos.',
  },
  omegamon: {
    id: 'omegamon',
    name: 'Omegamon',
    rarity: 'ULTRA',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 334, mp: 358, atk: 185, def: 143, spt: 170, spd: 143, apt: 99 },
    description: 'A fusão suprema entre WarGreymon e MetalGarurumon. Um Digimon Ultra lendário do tipo Vacina, portador da espada Grey Sword e do canhão Garuru Cannon. Protege o mundo digital com poder absoluto.',
    attackName: 'Espada Cinzenta ✨',
    spiritName: 'Canhão Garuru ❄️',
  },
  shineGreymonBurstMode: {
    id: 'shineGreymonBurstMode',
    name: 'ShineGreymon BM',
    rarity: 'BURST',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 332, mp: 350, atk: 187, def: 160, spt: 162, spd: 142, apt: 85 },
    description: 'A forma definitiva do ShineGreymon, amplificada ao extremo com o poder do Burst Mode. Seu corpo emana energia solar devastadora capaz de consumir qualquer Digimon das trevas. A fusão com o ImperialDramon FM desperta um poder além dos limites do Mega.',
    attackName: 'Shine Slash ✨',
    spiritName: 'Corona Blaze Sword 🔥',
  },
  veemon: {
    id: 'veemon',
    name: 'Veemon',
    rarity: 'ROOKIE',
    attribute: 'FR',
    element: 'FIRE',
    baseStats: { hp: 116, mp: 104, atk: 81, def: 63, spt: 52, spd: 60, apt: 38 },
    description: 'Um Digimon do tipo Livre com aparência de dragão azul e espírito aguerrido. Parceiro leal de Davis, carrega uma força oculta capaz de despertar evoluções poderosas.',
    attackName: 'Vee Headbutt ○',
    attackElement: 'NULL',
    spiritName: 'Boom Boom Punch 🔥',
    spiritElement: 'FIRE',
  },
  exVeemon: {
    id: 'exVeemon',
    name: 'ExVeemon',
    rarity: 'CHAMPION',
    attribute: 'FR',
    element: 'FIRE',
    baseStats: { hp: 204, mp: 178, atk: 131, def: 97, spt: 85, spd: 105, apt: 60 },
    description: 'A evolução poderosa do Veemon, com asas de dragão e músculos forjados em batalha. Seu corpo livre de qualquer atributo fixo o torna imprevisível. Com o parceiro certo, pode transcender ao Paildramon.',
    attackName: 'Vee Laser 🔥',
    attackElement: 'FIRE',
    spiritName: 'Flashing Wyvern ⚡',
    spiritElement: 'LIGHTNING',
  },
  paildramon: {
    id: 'paildramon',
    name: 'Paildramon',
    rarity: 'ULTIMATE',
    attribute: 'DA',
    element: 'FIRE',
    baseStats: { hp: 264, mp: 271, atk: 168, def: 121, spt: 108, spd: 141, apt: 72 },
    description: 'Digimon dragão de fusão entre ExVeemon e Stingmon. Combina a força explosiva do fogo com a agilidade cortante do vento, tornando-se um dos Digimon mais versáteis do Mundo Digital.',
    attackName: 'Desperado Blaster 🔥',
    attackElement: 'FIRE',
    spiritName: 'Sonic Flapper 💨',
    spiritElement: 'WIND',
  },
  imperialDramonFM: {
    id: 'imperialDramonFM',
    name: 'Imperialdramon FM',
    rarity: 'MEGA',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 320, mp: 340, atk: 174, def: 142, spt: 120, spd: 128, apt: 80 },
    description: 'A forma Fighter Mode do ImperialDramon, um cavaleiro bípede de poder incomparável. Empunha a lâmina Positron Laser com maestria absoluta e é considerado um dos Digimon mais poderosos do Mundo Digital.',
    attackName: 'Positron Laser ✨',
    attackElement: 'LIGHT',
    spiritName: 'Giga Death 🔥',
    spiritElement: 'FIRE',
  },
  imperialDramonRM: {
    id: 'imperialDramonRM',
    name: 'Imperialdramon RM',
    rarity: 'MEGA',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 315, mp: 342, atk: 173, def: 141, spt: 111, spd: 127, apt: 90 },
    description: 'Forma de Rage Mode do Imperialdramon Fighter Mode. Libera uma fúria destruidora canalizando todo o poder de fogo em seu corpo de dragão. Pode alternar livremente com o Fighter Mode.',
    attackName: 'Mega Death 🔥',
    attackElement: 'FIRE',
    spiritName: 'Giga Fire 🔥',
    spiritElement: 'FIRE',
  },
  imperialDramonPM: {
    id: 'imperialDramonPM',
    name: 'Imperialdramon PM',
    rarity: 'ULTRA',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 341, mp: 366, atk: 188, def: 150, spt: 166, spd: 145, apt: 95 },
    description: 'A forma suprema do ImperialDramon, o Paladin Mode. Empunha a Omni Sword forjada do Omegamon sacrificado e emana uma luz sagrada devastadora. Considerado o Digimon mais poderoso do Mundo Digital.',
    attackName: 'Burning Power 🔥',
    attackElement: 'FIRE',
    spiritName: 'Royal Slash ⚔️',
    spiritElement: 'LIGHT',
  },
  blackImperialdramonFM: {
    id: 'blackImperialdramonFM',
    name: 'Black Imperialdramon FM',
    rarity: 'MEGA',
    attribute: 'VC',
    element: 'DARK',
    baseStats: { hp: 330, mp: 355, atk: 185, def: 148, spt: 130, spd: 140, apt: 85 },
    description: 'A forma negra e corrompida do Imperialdramon Fighter Mode, forjada pelo poder sombrio do Black Digitron. Empunha o Positron Laser corrompido pelas trevas com força devastadora e velocidade incomparável.',
    attackName: 'Dark Positron Laser 🖤',
    attackElement: 'DARK',
    spiritName: 'Giga Darkness 🌑',
    spiritElement: 'DARK',
  },
  rosemon: {
    id: 'rosemon',
    name: 'Rosemon',
    rarity: 'MEGA',
    attribute: 'DA',
    element: 'PLANT',
    baseStats: { hp: 251, mp: 288, atk: 139, def: 117, spt: 132, spd: 121, apt: 62 },
    description: 'A majestosa Rainha das Flores, forma Mega da Lillymon. Guerreira elegante e implacável, comanda o poder das plantas com graça absoluta. Sua beleza ofusca até os Digimon mais poderosos enquanto os perfura com sua lança de rosas.',
    attackName: 'Beauty Slap 🌸',
    spiritName: 'Rose Spear 🌹',
  },
  rosemonBurstMode: {
    id: 'rosemonBurstMode',
    name: 'Rosemon BM',
    rarity: 'BURST',
    attribute: 'DA',
    element: 'PLANT',
    baseStats: { hp: 318, mp: 378, atk: 161, def: 135, spt: 158, spd: 142, apt: 88 },
    description: 'O Burst Mode de Rosemon, forjado com o sacrifício da luz de Ophanimon. Uma força da natureza transcendente que mistura o poder das plantas com relámpagos e luz celestial. Considerada por muitos a forma mais poderosa da linhagem verde.',
    attackName: 'Beauty Shock ⚡',
    attackElement: 'LIGHTNING',
    spiritName: 'Aguichant Lèvres ✨',
    spiritElement: 'LIGHT',
  },
  lillymon: {
    id: 'lillymon',
    name: 'Lillymon',
    rarity: 'ULTIMATE',
    attribute: 'DA',
    element: 'PLANT',
    baseStats: { hp: 209, mp: 244, atk: 112, def: 108, spt: 118, spd: 114, apt: 50 },
    description: 'A elegante fada das flores, forma Ultimate da Togemon. Seu charme encantador pode enfeitiçar qualquer adversário, e seus poderes da natureza são capazes de fazer florescer até os dados mais corrompidos do mundo digital.',
    attackName: 'Energy Shot ⚡',
    spiritName: 'Flower Temptation 🌍',
  },
  togemon: {
    id: 'togemon',
    name: 'Togemon',
    rarity: 'CHAMPION',
    attribute: 'DA',
    element: 'PLANT',
    baseStats: { hp: 166, mp: 166, atk: 108, def: 96, spt: 67, spd: 71, apt: 35 },
    description: 'A forma Champion da Palmon, um gigantesco cacto lutador com luvas de boxe. Apesar da aparência dura e espinhosa, tem um coração gentil. Seus socos são capazes de derrubar inimigos muito maiores.',
    attackName: 'Gatling Punch 💥',
    spiritName: 'Chikuchiku Bang Bang 🌍',
  },
  palmon: {
    id: 'palmon',
    name: 'Palmon',
    rarity: 'ROOKIE',
    attribute: 'DA',
    element: 'PLANT',
    baseStats: { hp: 103, mp: 114, atk: 74, def: 57, spt: 55, spd: 61, apt: 20 },
    description: 'Um Digimon planta do tipo Data com pétalas coloridas e uma personalidade calorosa. Apesar da aparência delicada, suas vinhas são surpreendentemente fortes e seu veneno pode paralisar inimigos.',
    attackName: 'Poison Ivy 🌿',
    spiritName: 'Stun Whipping ⚡',
  },
  gulusGammamon: {
    id: 'gulusGammamon',
    name: 'GulusGammamon',
    rarity: 'CHAMPION',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 290, mp: 260, atk: 230, def: 170, spt: 150, spd: 210, apt: 60 },
    description: 'A forma sombria do Gammamon. Um Digimon Champion do tipo Vírus corrompido pelas trevas, com velocidade e poder de ataque devastadores.',
  },
  greymon: {
    id: 'greymon',
    name: 'Greymon',
    rarity: 'CHAMPION',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 170, mp: 165, atk: 115, def: 92, spt: 72, spd: 80, apt: 35 },
    attackName: 'Horn Thrust ○',
    spiritName: 'Mega Flame 🔥',
    description: 'A poderosa evolução do Agumon. Um Digimon de nível Champion do tipo Vacina com força de fogo devastadora.',
  },
  metalGreymon: {
    id: 'metalGreymon',
    name: 'MetalGreymon',
    rarity: 'ULTIMATE',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 215, mp: 210, atk: 137, def: 117, spt: 94, spd: 100, apt: 51 },
    attackName: 'Metal Flame 🔥',
    spiritName: 'Giga Destroyer ⚙️',
    description: 'A forma Ultimate do Greymon. Metade de seu corpo foi reconstruído com metal cibernético, tornando-o um dos Digimon mais poderosos do tipo Vacina.',
  },
  warGreymon: {
    id: 'warGreymon',
    name: 'WarGreymon',
    rarity: 'MEGA',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 320, mp: 335, atk: 171, def: 146, spt: 126, spd: 122, apt: 72 },
    attackName: 'Dramon Killer ⚙️',
    attackElement: 'METAL',
    spiritName: 'Gaia Force 🔥',
    spiritElement: 'FIRE',
    description: 'O ápice da evolução do Agumon. Guerreiro lendário do tipo Vacina revestido por armadura Dramon Destroyer, capaz de destruir qualquer Dragonoid.',
  },
  silphymon: {
    id: 'silphymon',
    name: 'Silphymon',
    rarity: 'MEGA',
    attribute: 'DA',
    element: 'WIND',
    baseStats: { hp: 290, mp: 310, atk: 160, def: 135, spt: 155, spd: 165, apt: 74 },
    description: 'A forma Mega nascida da fusão de Aquilamon e Tailmon. Um Digimon do tipo Vacina que domina o vento com agilidade e poder superiores, capaz de voar a velocidades inimagináveis pelo Mundo Digital.',
    attackName: 'Top Storm 💨',
    attackElement: 'WIND',
    spiritName: 'Static Force ⚡',
    spiritElement: 'LIGHTNING',
  },
  sinduramon: {
    id: 'sinduramon',
    name: 'Sinduramon',
    rarity: 'ULTIMATE',
    attribute: 'VC',
    element: 'LIGHTNING',
    baseStats: { hp: 205, mp: 215, atk: 125, def: 105, spt: 115, spd: 110, apt: 52 },
    description: 'O Digimon Galináceo Celestial do tipo Ultimate. Um dos doze Deva, servo do Deus Digimon Baihumon. Seus poderes elétricos são capazes de acumular e descarregar energia eletromagnética devastadora.',
    attackName: 'Positron Pulse ⚡',
    attackElement: 'LIGHTNING',
    spiritName: 'Electric Charge ⚡',
    spiritElement: 'LIGHTNING',
  },
  valdurmon: {
    id: 'valdurmon',
    name: 'Valdurmon',
    rarity: 'MEGA',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 326, mp: 352, atk: 178, def: 146, spt: 175, spd: 143, apt: 78 },
    description: 'O Digimon Pássaro Sagrado do nível Mega. Dotado de asas enormes que irradiam luz pura, Valdurmon voa pelos céus do Mundo Digital como guardião celestial. Sua velocidade e poder mágico são temidos por todos os Digimons das trevas.',
    attackName: 'Gatling Spin 💨',
    attackElement: 'WIND',
    spiritName: 'Spiral Wave 💨',
    spiritElement: 'WIND',
  },
  blackSalamon: {
    id: 'blackSalamon',
    name: 'BlackSalamon',
    rarity: 'ROOKIE',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 110, mp: 105, atk: 78, def: 65, spt: 72, spd: 60, apt: 22 },
    description: 'A versão sombria de Salamon. Um filhote digital do tipo Vírus que emana energia das trevas, contrastando com sua aparência inofensiva.',
    attackName: 'Sombra Negra 🌑',
    spiritName: 'Pata das Trevas 🌑',
  },
  mushroomon: {
    id: 'mushroomon',
    name: 'Mushroomon',
    rarity: 'ROOKIE',
    attribute: 'VR',
    element: 'PLANT',
    baseStats: { hp: 105, mp: 115, atk: 72, def: 62, spt: 75, spd: 58, apt: 20 },
    description: 'Um Digimon cogumelo do tipo Vírus. Libera esporos venenosos para confundir os inimigos.',
    attackName: 'Spore Attack 🍄',
    spiritName: 'Poison Spore 🍄',
  },
  tentomon: {
    id: 'tentomon',
    name: 'Tentomon',
    rarity: 'ROOKIE',
    attribute: 'DA',
    element: 'LIGHTNING',
    baseStats: { hp: 118, mp: 125, atk: 82, def: 68, spt: 80, spd: 64, apt: 24 },
    description: 'Um inseto digital do tipo Data que canaliza energia elétrica. Parceiro fiel e confiável com poder de raio.',
    attackName: 'Super Shocker ⚡',
    spiritName: 'Electro Shocker ⚡',
  },
  renamon: {
    id: 'renamon',
    name: 'Renamon',
    rarity: 'ROOKIE',
    attribute: 'DA',
    element: 'WIND',
    baseStats: { hp: 108, mp: 120, atk: 92, def: 58, spt: 78, spd: 82, apt: 26 },
    description: 'Uma raposa digital do tipo Data ágil e misteriosa. Combina velocidade excepcional com golpes certeiros.',
    attackName: 'Diamond Storm 💠',
    spiritName: 'Fox Tail Inferno 💠',
  },
  terriermon: {
    id: 'terriermon',
    name: 'Terriermon',
    rarity: 'ROOKIE',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 115, mp: 118, atk: 84, def: 70, spt: 68, spd: 76, apt: 22 },
    description: 'Um pequeno Digimon canino do tipo Vacina. Apesar do tamanho, possui agilidade e força surpreendentes.',
    attackName: 'Terrier Tornado 💨',
    spiritName: 'Bunny Blast 💨',
  },
  wormon: {
    id: 'wormon',
    name: 'Wormmon',
    rarity: 'ROOKIE',
    attribute: 'VR',
    element: 'PLANT',
    baseStats: { hp: 100, mp: 112, atk: 70, def: 60, spt: 65, spd: 55, apt: 18 },
    description: 'Um inseto larval digital do tipo Data. Usa fios de seda para prender inimigos e ataca com veneno.',
    attackName: 'Silk Thread 🕸️',
    spiritName: 'Sticky Net 🕸️',
  },
  kumamon: {
    id: 'kumamon',
    name: 'Kumamon',
    rarity: 'ROOKIE',
    attribute: 'VC',
    element: 'ICE',
    baseStats: { hp: 122, mp: 110, atk: 80, def: 72, spt: 66, spd: 68, apt: 22 },
    description: 'Um urso digital do tipo Vacina coberto de neve e gelo. Utiliza o poder do frio para paralisar os inimigos.',
    attackName: 'Blizzard Blaster ❄️',
    spiritName: 'Snow Claw ❄️',
  },
  woodmon: {
    id: 'woodmon',
    name: 'Woodmon',
    rarity: 'CHAMPION',
    attribute: 'VR',
    element: 'PLANT',
    baseStats: { hp: 168, mp: 162, atk: 112, def: 90, spt: 85, spd: 72, apt: 35 },
    description: 'Um Digimon árvore do nível Champion do tipo Vírus. Capaz de se camuflar nas florestas digitais e atacar com galhos enormes.',
    attackName: 'Branch Bash 🌿',
    spiritName: 'Leaf Storm 🌿',
  },
  gomamon: {
    id: 'gomamon',
    name: 'Gomamon',
    rarity: 'ROOKIE',
    attribute: 'VC',
    element: 'WATER',
    baseStats: { hp: 112, mp: 108, atk: 78, def: 65, spt: 62, spd: 70, apt: 20 },
    description: 'Um Digimon aquático do tipo Vacina cheio de energia. Comanda cardumes de peixes digitais para atacar.',
    attackName: 'Marching Fishes 🐟',
    spiritName: 'Claw Attack 🐟',
  },
  kokwamon: {
    id: 'kokwamon',
    name: 'Kokuwamon',
    rarity: 'ROOKIE',
    attribute: 'DA',
    element: 'LIGHTNING',
    baseStats: { hp: 106, mp: 130, atk: 74, def: 60, spt: 85, spd: 58, apt: 20 },
    description: 'Um Digimon inseto mecânico do tipo Data. Gera correntes elétricas para paralisar os adversários.',
    attackName: 'Scissor Arms ⚡',
    spiritName: 'Electric Bite ⚡',
  },
  lalamon: {
    id: 'lalamon',
    name: 'Lalamon',
    rarity: 'ROOKIE',
    attribute: 'DA',
    element: 'PLANT',
    baseStats: { hp: 105, mp: 122, atk: 72, def: 62, spt: 82, spd: 60, apt: 20 },
    description: 'Um Digimon floral do tipo Vacina. Usa sementes e pétalas como projéteis e possui habilidades curativas.',
    attackName: 'Seed Blast 🌸',
    spiritName: 'Lala Spiral 🌸',
  },
  gaomon: {
    id: 'gaomon',
    name: 'Gaomon',
    rarity: 'ROOKIE',
    attribute: 'DA',
    element: 'WIND',
    baseStats: { hp: 120, mp: 108, atk: 88, def: 72, spt: 60, spd: 75, apt: 24 },
    description: 'Um Digimon canino do tipo Data com extraordinária velocidade e força de combate. Especialista em golpes rápidos.',
    attackName: 'Double Back Knuckle 👊',
    spiritName: 'Rolling Upper 👊',
  },
  kotemon: {
    id: 'kotemon',
    name: 'Kotemon',
    rarity: 'ROOKIE',
    attribute: 'DA',
    element: 'FIRE',
    baseStats: { hp: 115, mp: 105, atk: 85, def: 78, spt: 58, spd: 62, apt: 22 },
    description: 'Um Digimon guerreiro do tipo Vacina que treina com espadas de fogo. Possui disciplina e força de vontade excepcionais.',
    attackName: 'Fire Kendo 🔥',
    spiritName: 'Flame Sword 🔥',
  },
  otamamon: {
    id: 'otamamon',
    name: 'Otamamon',
    rarity: 'ROOKIE',
    attribute: 'VR',
    element: 'WATER',
    baseStats: { hp: 108, mp: 118, atk: 72, def: 64, spt: 75, spd: 58, apt: 20 },
    description: 'Um Digimon girino digital do tipo Vírus. Vive em rios de dados e usa cantos sônicos para atordoar inimigos.',
    attackName: 'Lullaby 💧',
    spiritName: 'Bubble Blow 💧',
  },
  betamon: {
    id: 'betamon',
    name: 'Betamon',
    rarity: 'ROOKIE',
    attribute: 'VR',
    element: 'WATER',
    baseStats: { hp: 118, mp: 112, atk: 80, def: 68, spt: 65, spd: 60, apt: 22 },
    description: 'Um Digimon anfíbio do tipo Vírus. Gera descargas elétricas pela água para paralisar e derrotar inimigos.',
    attackName: 'Electric Shock 💧',
    spiritName: 'Delta Ray ⚡',
  },
  candlemon: {
    id: 'candlemon',
    name: 'Candlemon',
    rarity: 'ROOKIE',
    attribute: 'DA',
    element: 'FIRE',
    baseStats: { hp: 108, mp: 122, atk: 78, def: 60, spt: 85, spd: 56, apt: 22 },
    description: 'Um Digimon vela do tipo Vírus. Sua chama digital nunca se apaga e pode queimar até os dados mais resistentes.',
    attackName: 'Lava Gob 🔥',
    spiritName: 'Melting Wax 🔥',
  },
  falcomon: {
    id: 'falcomon',
    name: 'Falcomon',
    rarity: 'ROOKIE',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 112, mp: 105, atk: 82, def: 64, spt: 62, spd: 88, apt: 24 },
    description: 'Um Digimon falcão do tipo Vacina ágil e rápido. Mergulha em alta velocidade para atacar inimigos desprevenidos.',
    attackName: 'Scratch Smash 💨',
    spiritName: 'Shurimon Blade 💨',
  },
  hagurumon: {
    id: 'hagurumon',
    name: 'Hagurumon',
    rarity: 'ROOKIE',
    attribute: 'VR',
    element: 'METAL',
    baseStats: { hp: 115, mp: 112, atk: 76, def: 80, spt: 68, spd: 52, apt: 20 },
    description: 'Um Digimon engrenagem do tipo Data. Corpo formado por engrenagens metálicas interligadas que giram em alta velocidade.',
    attackName: 'Cog Crusher ⚙️',
    spiritName: 'Darkness Gear ⚙️',
  },
  kamemon: {
    id: 'kamemon',
    name: 'Kamemon',
    rarity: 'ROOKIE',
    attribute: 'VC',
    element: 'WATER',
    baseStats: { hp: 118, mp: 108, atk: 74, def: 80, spt: 62, spd: 56, apt: 20 },
    description: 'Um Digimon tartaruga do tipo Vacina. Usa sua carapaça dura como escudo e arma ao mesmo tempo.',
    attackName: 'Shell Attack 🐢',
    spiritName: 'Hydro Tackle 💧',
  },
  monodramon: {
    id: 'monodramon',
    name: 'Monodramon',
    rarity: 'ROOKIE',
    attribute: 'VR',
    element: 'EARTH',
    baseStats: { hp: 120, mp: 108, atk: 86, def: 70, spt: 64, spd: 68, apt: 24 },
    description: 'Um pequeno dragão digital do tipo Vírus. Possui instintos selvagens e combate com garras e chifres afiados.',
    attackName: 'Beat Knuckle 🐉',
    spiritName: 'Cracking Bite 🐉',
  },
  penguinmon: {
    id: 'penguinmon',
    name: 'Penguinmon',
    rarity: 'ROOKIE',
    attribute: 'DA',
    element: 'ICE',
    baseStats: { hp: 112, mp: 110, atk: 74, def: 68, spt: 65, spd: 75, apt: 20 },
    description: 'Um Digimon pinguim do tipo Data que habita regiões geladas do Mundo Digital. Surpreende inimigos com sua velocidade no gelo.',
    attackName: 'Ice Slicer ❄️',
    spiritName: 'Sliding Attack ❄️',
  },
  pipismon: {
    id: 'pipismon',
    name: 'Pipismon',
    rarity: 'CHAMPION',
    attribute: 'FR',
    element: 'WIND',
    baseStats: { hp: 172, mp: 168, atk: 110, def: 88, spt: 90, spd: 95, apt: 35 },
    description: 'Um Digimon morcego Champion do tipo Livre. Utiliza ultrassom para desorientar inimigos e ataca com velocidade impressionante.',
    attackName: 'Ultrasonic Wave 🦇',
    spiritName: 'Night Flapper 🦇',
  },
  guardromon: {
    id: 'guardromon',
    name: 'Guardromon',
    rarity: 'CHAMPION',
    attribute: 'DA',
    element: 'METAL',
    baseStats: { hp: 178, mp: 158, atk: 115, def: 105, spt: 82, spd: 68, apt: 35 },
    description: 'Um Digimon robô Champion do tipo Data. Construído para proteger e defender, possui armadura de aço e canhões de alarme.',
    attackName: 'Grenade Destroyer 💣',
    spiritName: 'Alarm Voice ⚠️',
  },
  solarmon: {
    id: 'solarmon',
    name: 'Solarmon',
    rarity: 'ROOKIE',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 108, mp: 112, atk: 76, def: 68, spt: 72, spd: 60, apt: 20 },
    description: 'Um Digimon sol do tipo Vacina que irradia calor e luz divina. Seus raios solares são capazes de purificar dados corrompidos.',
    attackName: 'Solar Ray ☀️',
    spiritName: 'Prominence Beam ☀️',
  },
  toyagumon: {
    id: 'toyagumon',
    name: 'ToyAgumon',
    rarity: 'ROOKIE',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 115, mp: 105, atk: 80, def: 72, spt: 58, spd: 64, apt: 20 },
    description: 'Uma versão de brinquedo do Agumon, feita de plástico colorido. Apesar da aparência frágil, possui força e determinação reais.',
    attackName: 'Plastic Blaze 🧱',
    spiritName: 'Toy Flame 🔥',
  },
  piddomon: {
    id: 'piddomon',
    name: 'Piddomon',
    rarity: 'CHAMPION',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 170, mp: 175, atk: 112, def: 90, spt: 105, spd: 80, apt: 35 },
    description: 'Um Digimon anjo Champion do tipo Vacina. Serve como mensageiro divino e utiliza chamas sagradas para combater o mal.',
    attackName: 'Fire Feather 🔥',
    spiritName: 'Apollo Tornado 💡',
  },
  reppamon: {
    id: 'reppamon',
    name: 'Reppamon',
    rarity: 'CHAMPION',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 175, mp: 165, atk: 118, def: 92, spt: 88, spd: 95, apt: 35 },
    description: 'Um Digimon felino Champion do tipo Vacina. Possui cauda de espada e lança cortes de vento devastadores a alta velocidade.',
    attackName: 'Turbulence Saber 💨',
    spiritName: 'Infinite Blade 💨',
  },
  stingmon: {
    id: 'stingmon',
    name: 'Stingmon',
    rarity: 'CHAMPION',
    attribute: 'VR',
    element: 'PLANT',
    baseStats: { hp: 172, mp: 168, atk: 122, def: 88, spt: 90, spd: 92, apt: 38 },
    description: 'A evolução Champion de Wormmon. Um inseto guerreiro do tipo Vírus com braços em forma de estacas mortíferas.',
    attackName: 'Spiking Strike 🌿',
    spiritName: 'Hell Squeeze 🌿',
  },
  aquilamon: {
    id: 'aquilamon',
    name: 'Aquilamon',
    rarity: 'CHAMPION',
    attribute: 'DA',
    element: 'WIND',
    baseStats: { hp: 175, mp: 162, atk: 118, def: 90, spt: 85, spd: 95, apt: 35 },
    description: 'Um Digimon águia gigante Champion do tipo Data. Usa correntes elétricas dos chifres para atacar do alto.',
    attackName: 'Grand Horn ⚡',
    spiritName: 'Blast Rings 💨',
  },
  ogremon: {
    id: 'ogremon',
    name: 'Ogremon',
    rarity: 'CHAMPION',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 180, mp: 152, atk: 125, def: 95, spt: 80, spd: 85, apt: 38 },
    description: 'Um oni digital Champion do tipo Vírus. Portador de uma clava poderosa, busca incansavelmente a batalha e a glória.',
    attackName: 'Pummel Whack 🪨',
    spiritName: 'Bone Cudgel 🌑',
  },
  airdramon: {
    id: 'airdramon',
    name: 'Airdramon',
    rarity: 'CHAMPION',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 168, mp: 168, atk: 112, def: 85, spt: 92, spd: 98, apt: 35 },
    description: 'Um dragão alado Champion do tipo Vacina que domina os ventos. Seus golpes de asa criam tornados devastadores.',
    attackName: 'Spinning Needle 💨',
    spiritName: 'Mach Storm 💨',
  },
  tyranomon: {
    id: 'tyranomon',
    name: 'Tyranomon',
    rarity: 'CHAMPION',
    attribute: 'VR',
    element: 'FIRE',
    baseStats: { hp: 182, mp: 155, atk: 120, def: 98, spt: 78, spd: 75, apt: 38 },
    description: 'Um dinossauro tirano Champion do tipo Vírus. Ataca com chamas brutais e força física avassaladora.',
    attackName: 'Fire Blast 🔥',
    spiritName: 'Mega Flames 🔥',
  },
  seadramon: {
    id: 'seadramon',
    name: 'Seadramon',
    rarity: 'CHAMPION',
    attribute: 'DA',
    element: 'WATER',
    baseStats: { hp: 175, mp: 165, atk: 115, def: 92, spt: 85, spd: 88, apt: 35 },
    description: 'Um dragão marinho Champion do tipo Data que habita os oceanos digitais. Usa gelo e água para enredar e destruir adversários.',
    attackName: 'Ice Blast ❄️',
    spiritName: 'Maelstrom 💧',
  },
  allomon: {
    id: 'allomon',
    name: 'Allomon',
    rarity: 'CHAMPION',
    attribute: 'DA',
    element: 'FIRE',
    baseStats: { hp: 178, mp: 155, atk: 122, def: 96, spt: 80, spd: 78, apt: 36 },
    description: 'Um dinossauro Champion do tipo Data com chifres poderosos. Especialista em ataques frontais implacáveis.',
    attackName: 'Dino Burst 🔥',
    spiritName: 'Dynamite Head 🔥',
  },
  darktyranomon: {
    id: 'darktyranomon',
    name: 'DarkTyranomon',
    rarity: 'CHAMPION',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 185, mp: 158, atk: 128, def: 102, spt: 82, spd: 78, apt: 38 },
    description: 'A variante sombria do Tyranomon, corrompida pelas trevas digitais. Mais poderosa e agressiva do que o original.',
    attackName: 'Dark Fire 🌑',
    spiritName: 'Fire Tower 🌑',
  },
  blacktailmon: {
    id: 'blacktailmon',
    name: 'BlackTailmon',
    rarity: 'CHAMPION',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 172, mp: 168, atk: 115, def: 90, spt: 100, spd: 88, apt: 36 },
    description: 'A versão Vírus de Tailmon, mergulhada nas trevas. Possui velocidade e instinto predatório amplificados pela corrupção.',
    attackName: 'Neko Punch 🌑',
    spiritName: 'Dark Claw 🌑',
  },
  darklizardmon: {
    id: 'darklizardmon',
    name: 'DarkLizardmon',
    rarity: 'CHAMPION',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 175, mp: 162, atk: 118, def: 92, spt: 85, spd: 82, apt: 36 },
    description: 'Um lagarto das trevas Champion do tipo Vírus. Rasteja pelas sombras digitais e ataca com veneno e energia sombria.',
    attackName: 'Dark Venom 🌑',
    spiritName: 'Shadow Claw 🌑',
  },
  devidramon: {
    id: 'devidramon',
    name: 'Devidramon',
    rarity: 'CHAMPION',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 178, mp: 162, atk: 122, def: 92, spt: 88, spd: 85, apt: 36 },
    description: 'Um dragão demoníaco Champion do tipo Vírus com quatro olhos que hipnotizam vítimas. Suas garras rasgam dados digitais.',
    attackName: 'Crimson Claw 🌑',
    spiritName: 'Red Eye 🌑',
  },
  tiranomon: {
    id: 'tiranomon',
    name: 'Tiranomon',
    rarity: 'CHAMPION',
    attribute: 'VR',
    element: 'FIRE',
    baseStats: { hp: 168, mp: 155, atk: 122, def: 85, spt: 68, spd: 92, apt: 35 },
    attackName: 'Bola de Fogo 🔥',
    spiritName: 'Garra Sombria 🔥',
    description: 'A evolução sombria do Agumon. Um Digimon Champion do tipo Vírus com força bruta e garras poderosas capaz de rivalizar com o Greymon.',
  },
  skullgreymon: {
    id: 'skullgreymon',
    name: 'SkullGreymon',
    rarity: 'ULTIMATE',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 248, mp: 225, atk: 152, def: 118, spt: 95, spd: 110, apt: 52 },
    description: 'O esqueleto de um Greymon que evoluiu pelo ódio e destruição. Um Ultimate do tipo Vírus incapaz de controlar seu próprio poder devastador.',
    attackName: 'Dark Shot 💀',
    spiritName: 'Ground Zero 💀',
  },
};

// ─── Fusion paths ─────────────────────────────────────────────────────────────
export interface FusionRecipe {
  partner?: string;
  partners?: string[];
  resultId: string;
  resultName: string;
  requiredLevel: number;
  requiredItem?: string;
}

export const FUSIONS: Record<string, FusionRecipe[]> = {
  warGreymon: [{ partner: 'metalGarurumon', resultId: 'omegamon', resultName: 'Omegamon', requiredLevel: 60 }],
  metalGarurumon: [{ partner: 'warGreymon', resultId: 'omegamon', resultName: 'Omegamon', requiredLevel: 60 }],
  gallantmon: [{ partner: 'seraphimon', resultId: 'gallantmonCrimsonMode', resultName: 'Gallantmon Crimson Mode', requiredLevel: 60 }],
  angemon: [{ partner: 'devimon', resultId: 'lucemonChaosMode', resultName: 'Lucemon Chaos Mode', requiredLevel: 40 }],
  devimon: [{ partner: 'angemon', resultId: 'lucemonChaosMode', resultName: 'Lucemon Chaos Mode', requiredLevel: 40 }],
  exVeemon: [{ partner: 'stingmon', resultId: 'paildramon', resultName: 'Paildramon', requiredLevel: 36 }],
  stingmon: [{ partner: 'exVeemon', resultId: 'paildramon', resultName: 'Paildramon', requiredLevel: 36 }],
  shineGreymon: [
    { partner: 'imperialDramonFM', resultId: 'shineGreymonBurstMode', resultName: 'ShineGreymon Burst Mode', requiredLevel: 68 },
    { partner: 'megidramon', resultId: 'shineGreymonRuinMode', resultName: 'ShineGreymon Ruin Mode', requiredLevel: 68 },
  ],
  rosemon: [{ partner: 'ophanimon', resultId: 'rosemonBurstMode', resultName: 'Rosemon Burst Mode', requiredLevel: 64 }],
  mirageGaogamon: [{ partner: 'kentaurusmon', resultId: 'mirageGaogamonBurstMode', resultName: 'MirageGaogamon Burst Mode', requiredLevel: 68 }],
  ravemon: [{ partner: 'valkyrimon', resultId: 'ravemonBurstMode', resultName: 'Ravemon Burst Mode', requiredLevel: 68 }],
  imperialDramonFM: [{ partner: 'omegamon', resultId: 'imperialDramonPM', resultName: 'Imperialdramon PM', requiredLevel: 60 }],
  silphymon: [{ partner: 'sinduramon', resultId: 'valdurmon', resultName: 'Valdurmon', requiredLevel: 63 }],
  kimeramon: [{ partner: 'machinedramon', resultId: 'millenniummon', resultName: 'Millenniummon', requiredLevel: 60 }],
  millenniummon: [{ partner: 'gigaSeadramon', resultId: 'moonMillenniummon', resultName: 'MoonMillenniummon', requiredLevel: 70 }],
  moonMillenniummon: [{ partner: 'millenniummon', resultId: 'zeedMillenniummon', resultName: 'ZeedMillenniummon', requiredLevel: 80 }],
  'name:Zhuqiaomon': [{ partners: ['name:Baihumon','name:Azulongmon','name:Ebonwumon'], resultId: 'name:Huanglongmon', resultName: 'Huanglongmon', requiredLevel: 60 }],
  'name:Baihumon': [{ partners: ['name:Zhuqiaomon','name:Azulongmon','name:Ebonwumon'], resultId: 'name:Huanglongmon', resultName: 'Huanglongmon', requiredLevel: 60 }],
  'name:Azulongmon': [{ partners: ['name:Zhuqiaomon','name:Baihumon','name:Ebonwumon'], resultId: 'name:Huanglongmon', resultName: 'Huanglongmon', requiredLevel: 60 }],
  'name:Ebonwumon': [{ partners: ['name:Zhuqiaomon','name:Baihumon','name:Azulongmon'], resultId: 'name:Huanglongmon', resultName: 'Huanglongmon', requiredLevel: 60 }],
  'name:Arcturiusmon': [{ partner: 'name:Siriusmon', resultId: 'name:Proximamon', resultName: 'Proximamon', requiredLevel: 70 }],
  'name:Siriusmon': [{ partner: 'name:Arcturiusmon', resultId: 'name:Proximamon', resultName: 'Proximamon', requiredLevel: 70 }],
};

export const EVOLUTIONS: Record<string, { evolvesTo: string; requiredLevel: number; label: string; requiredItem?: string }> = {
  // ── Patamon / SlashAngemon Line ───────────────────────────────────────────
  patamon:     { evolvesTo: 'unimon',       requiredLevel: 18, label: 'Unimon' },
  unimon:      { evolvesTo: 'piximon',      requiredLevel: 37, label: 'Piximon' },
  piximon:     { evolvesTo: 'slashAngemon', requiredLevel: 63, label: 'SlashAngemon', requiredItem: 'anel_sagrado' },
  // ── Agumon / WarGreymon / Omegamon Line ──────────────────────────────────
  agumon:       { evolvesTo: 'greymon',       requiredLevel: 16, label: 'Greymon' },
  greymon:      { evolvesTo: 'metalGreymon',  requiredLevel: 34, label: 'MetalGreymon' },
  metalGreymon: { evolvesTo: 'warGreymon',    requiredLevel: 52, label: 'WarGreymon' },
  // ── Tiranomon / SkullGreymon Line (evolução alternativa do Agumon) ────────
  tyranomon:    { evolvesTo: 'skullgreymon',  requiredLevel: 38, label: 'SkullGreymon' },
  // ── Agumon Savers / ShineGreymon Line ─────────────────────────────────────
  agumonSaver:  { evolvesTo: 'geoGreymon',    requiredLevel: 20, label: 'GeoGreymon' },
  geoGreymon:   { evolvesTo: 'rizeGreymon',   requiredLevel: 35, label: 'RizeGreymon' },
  rizeGreymon:  { evolvesTo: 'shineGreymon',  requiredLevel: 59, label: 'ShineGreymon' },
  // ── Gabumon / MetalGarurumon Line ─────────────────────────────────────────
  gabumon:      { evolvesTo: 'garurumon',      requiredLevel: 19, label: 'Garurumon' },
  garurumon:    { evolvesTo: 'wereGarurumon',  requiredLevel: 35, label: 'WereGarurumon' },
  wereGarurumon:{ evolvesTo: 'metalGarurumon', requiredLevel: 52, label: 'MetalGarurumon' },
  blackWereGarurumon: { evolvesTo: 'merukimon', requiredLevel: 65, label: 'Merukimon' },
  // ── Guilmon / Gallantmon (Dukemon) Line ───────────────────────────────────
  guilmon:        { evolvesTo: 'growlmon',       requiredLevel: 16, label: 'Growlmon' },
  growlmon:       { evolvesTo: 'megaloGrowlmon', requiredLevel: 40, label: 'WarGrowlmon' },
  megaloGrowlmon: { evolvesTo: 'gallantmon',     requiredLevel: 60, label: 'Gallantmon' },
  // ── Lucemon Line ──────────────────────────────────────────────────────────
  lucemon:          { evolvesTo: 'lucemonChaosMode', requiredLevel: 40, label: 'Lucemon Chaos Mode' },
  // ── Biyomon / Phoenixmon (Hououmon) Line ──────────────────────────────────
  pyomon:    { evolvesTo: 'birdramon', requiredLevel: 16, label: 'Birdramon' },
  birdramon: { evolvesTo: 'garudamon', requiredLevel: 32, label: 'Garudamon' },
  garudamon: { evolvesTo: 'phoenixmon', requiredLevel: 48, label: 'Phoenixmon' },
  // ── Salamon / Holydramon (Magnadramon) Line ───────────────────────────────
  salamon:     { evolvesTo: 'tailmon',   requiredLevel: 13, label: 'Tailmon' },
  tailmon:     { evolvesTo: 'angewomon', requiredLevel: 35, label: 'Angewomon' },
  angewomon:   { evolvesTo: 'magnadramon', requiredLevel: 60, label: 'Magnadramon' },
  blackSalamon:{ evolvesTo: 'blacktailmon', requiredLevel: 13, label: 'BlackTailmon' },
  // ── Palmon / Rosemon Line ─────────────────────────────────────────────────
  palmon:  { evolvesTo: 'togemon', requiredLevel: 19, label: 'Togemon' },
  togemon: { evolvesTo: 'lillymon', requiredLevel: 33, label: 'Lillymon' },
  lillymon:{ evolvesTo: 'rosemon',  requiredLevel: 50, label: 'Rosemon' },
  // ── Patamon / Goldramon (Goddramon) Line ──────────────────────────────────
  angemon:     { evolvesTo: 'magnaAngemon', requiredLevel: 33, label: 'MagnaAngemon' },
  magnaAngemon:{ evolvesTo: 'goldramon',   requiredLevel: 60, label: 'Goldramon' },
  // ── Veemon / Imperialdramon Line ──────────────────────────────────────────
  veemon:     { evolvesTo: 'exVeemon',         requiredLevel: 22, label: 'ExVeemon' },
  paildramon: { evolvesTo: 'imperialDramonFM', requiredLevel: 60, label: 'Imperialdramon FM' },
  // ── DemiDevimon / VenomMyotismon Line ─────────────────────────────────────
  demiDevimon: { evolvesTo: 'devimon',       requiredLevel: 21, label: 'Devimon' },
  devimon:     { evolvesTo: 'myotismon',     requiredLevel: 32, label: 'Myotismon' },
  myotismon:   { evolvesTo: 'vnonMyotismon', requiredLevel: 56, label: 'VenomMyotismon' },
  // ── Wormmon / Stingmon Line ───────────────────────────────────────────────
  wormon:   { evolvesTo: 'stingmon', requiredLevel: 22, label: 'Stingmon' },
  // ── Betamon / Seadramon Line ──────────────────────────────────────────────
  betamon:  { evolvesTo: 'seadramon', requiredLevel: 22, label: 'Seadramon' },
  // ── Hawkmon / Aquilamon / Silphymon Line ──────────────────────────────────
  aquilamon: { evolvesTo: 'silphymon', requiredLevel: 35, label: 'Silphymon' },
  // ── Hagurumon / Guardromon Line ───────────────────────────────────────────
  hagurumon:  { evolvesTo: 'guardromon', requiredLevel: 22, label: 'Guardromon' },
  // ── Mushroomon / Woodmon Line ─────────────────────────────────────────────
  mushroomon: { evolvesTo: 'woodmon', requiredLevel: 22, label: 'Woodmon' },
};

// ─── Sacrifice System ────────────────────────────────────────────────────────

export const ALTERNATE_EVOLUTIONS: Record<string, { evolvesTo: string; requiredLevel: number; label: string; requiredItem?: string; requiredSacrificeCharacter?: string; requiredSacrificeCharacters?: string[] }> = {
  angewomon:        { evolvesTo: 'ophanimon',          requiredLevel: 60, label: 'Ophanimon',          requiredItem: 'anel_sagrado' },
  magnaAngemon:     { evolvesTo: 'seraphimon',         requiredLevel: 60, label: 'Seraphimon',         requiredItem: 'anel_sagrado' },
  lucemonChaosMode: { evolvesTo: 'lucemonSatanMode',  requiredLevel: 50, label: 'Lucemon Satan Mode', requiredItem: 'gehenna' },
};

export const SACRIFICE_DROPS: Record<string, { itemId: string; chance: number }[]> = {
  magnaAngemon:     [{ itemId: 'piece_anel_sagrado', chance: 0.30 }],
  angewomon:        [{ itemId: 'piece_anel_sagrado', chance: 0.30 }],
  lucemonChaosMode: [{ itemId: 'piece_anel_sagrado', chance: 0.40 }],
  angemon:          [{ itemId: 'piece_anel_sagrado', chance: 0.10 }],
  tailmon:          [{ itemId: 'piece_anel_sagrado', chance: 0.10 }],
  // ── Fragmentos do Gehenna (7 Lordes das Trevas) ───────────────────────────
  lilithmon:  [{ itemId: 'piece_gehenna', chance: 1.0 }],
  barbamon:   [{ itemId: 'piece_gehenna', chance: 1.0 }],
  beelzemon:  [{ itemId: 'piece_gehenna', chance: 1.0 }],
  leviamon:   [{ itemId: 'piece_gehenna', chance: 1.0 }],
  belphemon:  [{ itemId: 'piece_gehenna', chance: 1.0 }],
  demon:      [{ itemId: 'piece_gehenna', chance: 1.0 }],
  // ── Estilhaços Corrompidos (4 Guardiões Celestiais + Huanglongmon) ──
  'name:Zhuqiaomon':  [{ itemId: 'piece_fragmento_corrompido', chance: 1.0 }],
  'name:Baihumon':  [{ itemId: 'piece_fragmento_corrompido', chance: 1.0 }],
  'name:Ebonwumon':  [{ itemId: 'piece_fragmento_corrompido', chance: 1.0 }],
  'name:Azulongmon': [{ itemId: 'piece_fragmento_corrompido', chance: 1.0 }],
  'name:Huanglongmon':  [{ itemId: 'piece_fragmento_corrompido', chance: 0.5 }],
};

// ─── 4 Celestial Beasts → Huanglongmon (hardcoded, survive catalogue reloads) ──
// IDs: Zhuqiaomon=name:Zhuqiaomon, Baihumon=name:Baihumon, Ebonwumon=name:Ebonwumon, Azulongmon=name:Azulongmon
// Huanglongmon=name:Huanglongmon, HuanglongmonRuinMode=name:HuanglongmonRuinMode
// ─── Arcturiusmon + Siriusmon → Proximamon ──
// IDs: Arcturiusmon=name:Arcturiusmon, Siriusmon=name:Siriusmon, Proximamon=name:Proximamon
export const HARDCODED_ALTERNATE_EVOLUTIONS: Record<string, {
  evolvesTo: string; requiredLevel: number; label: string;
  requiredItem?: string; requiredSacrificeCharacters?: string[];
}> = {
  'name:Huanglongmon': { evolvesTo: 'name:HuanglongmonRuinMode', requiredLevel: 70, label: 'Huanglongmon: Ruin Mode', requiredItem: 'fragmento_corrompido' },
};

export const EXTRA_ALTERNATE_EVOLUTIONS: Record<string, { evolvesTo: string; requiredLevel: number; label: string; requiredItem?: string; requiredSacrificeCharacter?: string }> = {
  imperialDramonFM: { evolvesTo: 'blackImperialdramonFM', requiredLevel: 50, label: 'Black Imperialdramon FM', requiredItem: 'black_digitron' },
};

// Bidirectional form changes — no level reset, no requirement, toggle freely
export const FORM_CHANGES: Record<string, string> = {
  imperialDramonFM: 'imperialDramonRM',
  imperialDramonRM: 'imperialDramonFM',
  lucemonFM:        'lucemonSatanMode',
  lucemonSatanMode: 'lucemonFM',
};

export const FORM_CHANGE_MIN_LEVEL: Record<string, number> = {
  lucemonSatanMode: 70,
  lucemonFM: 70,
};

export const ROOKIE_OF: Record<string, string> = {
  // Agumon / WarGreymon / Omegamon
  greymon: 'agumon',          metalGreymon: 'agumon',         warGreymon: 'agumon',
  omegamon: 'agumon',
  tyranomon: 'agumon',        skullgreymon: 'agumon',
  // Agumon Savers / ShineGreymon
  geoGreymon: 'agumonSaver',  rizeGreymon: 'agumonSaver',     shineGreymon: 'agumonSaver',    shineGreymonBurstMode: 'agumonSaver',
  // Gabumon / MetalGarurumon
  garurumon: 'gabumon',       wereGarurumon: 'gabumon',       metalGarurumon: 'gabumon',
  // Guilmon / Gallantmon
  growlmon: 'guilmon',        megaloGrowlmon: 'guilmon',      gallantmon: 'guilmon',          gallantmonCrimsonMode: 'guilmon',
  // Biyomon / Phoenixmon
  birdramon: 'pyomon',        garudamon: 'pyomon',            phoenixmon: 'pyomon',
  // Patamon / Goldramon
  angemon: 'patamon',         magnaAngemon: 'patamon',        seraphimon: 'patamon',          goldramon: 'patamon',
  // Salamon / Magnadramon
  tailmon: 'salamon',         angewomon: 'salamon',           ophanimon: 'salamon',           magnadramon: 'salamon',
  blacktailmon: 'blackSalamon',
  // Palmon / Rosemon
  togemon: 'palmon',          lillymon: 'palmon',             rosemon: 'palmon',              rosemonBurstMode: 'palmon',
  // DemiDevimon / VenomMyotismon
  devimon: 'demiDevimon',     myotismon: 'demiDevimon',       vnonMyotismon: 'demiDevimon',
  // Lucemon
  lucemonChaosMode: 'lucemon',
  lucemonSatanMode: 'lucemon',
  lucemonFM:        'lucemon',
  lucemonX:         'lucemon',
  // Veemon / Imperialdramon
  exVeemon:         'veemon',
  paildramon:       'veemon',
  imperialDramonFM:    'veemon',
  imperialDramonRM:    'veemon',
  imperialDramonPM:    'veemon',
  blackImperialdramonFM: 'veemon',
  // Silphymon / Valdurmon
  silphymon:        'aquilamon',
  valdurmon:        'silphymon',
  // Wormmon / Stingmon (JewelBeemon / TigerVespamon are custom, not listed here)
  stingmon:         'wormon',
  // Betamon / Seadramon (MegaSeadramon / MetalSeadramon are custom)
  seadramon:        'betamon',
  // Hagurumon / Guardromon (Andromon / HiAndromon are custom)
  guardromon:       'hagurumon',
  // Mushroomon / Woodmon (Cherrymon / Hydramon are custom)
  woodmon:          'mushroomon',
};

export const SACRIFICE_SCAN_OVERRIDES: Record<string, { characterId: string; percent: number }> = {
  lucemonChaosMode: { characterId: 'lucemon', percent: 0.05 },
};

export const SACRIFICE_SCAN_PCT: Partial<Record<RarityId, number>> = {
  CHAMPION:      0.10,
  ULTIMATE:      0.20,
  MEGA: 0.50,
};

export const ITEM_NAMES: Record<string, string> = {
  pilula_energetica:       'Pílula Energética',
  brasao_coragem:       'Brasão da Coragem',
  brasao_esperanca:     'Brasão da Esperança',
  brasao_amizade:       'Brasão da Amizade',
  brasao_confianca:     'Brasão da Confiança',
  brasao_pureza:        'Brasão da Pureza',
  brasao_amor:          'Brasão do Amor',
  brasao_luz:           'Brasão da Luz',
  brasao_conhecimento:  'Brasão do Conhecimento',
  brasao_bondade:       'Brasão da Bondade',
  brasao_milagre:       'Brasão do Milagre',
  brasao_destino:       'Brasão do Destino',

  golden_ascension_star:       'Estrela de Ascensão Dourada ⭐',
  piece_golden_ascension_star: 'Fragmento de Estrela Dourada',
  anel_sagrado:           'Anel Sagrado ✨',
  chrono_core:             'Chrono Core',
  pergaminho_runa_antiga:  'Pergaminho de Runa Antiga',
  piece_anel_sagrado:     'Fragmento do Anel Sagrado',
  permissao_real:         'Permissão Real da Deusa ⚔️',
  gehenna:                'Gehenna 🌑',
  piece_gehenna:          'Fragmento do Gehenna',
  piece_battery_green:    'Bateria Verde',
  piece_battery_blue:     'Bateria Azul',
  piece_battery_purple:   'Bateria Roxa',
  piece_battery_gold:     'Bateria Dourada',
  fragmento_corrompido:       'Fragmento Corrompido',
  piece_fragmento_corrompido: 'Fragmento Corrompido',
  black_digitron:         'Black Digitron 🖤',
  piece_black_digitron:   'Fragmento do Black Digitron',
  piece_digivice_d3:      'Fragmento D-3',
  piece_digivice_d_ark:   'Fragmento D-Ark',
  piece_digivice_xros_loader: 'Fragmento Xros Loader',
  piece_brasao_coragem:      'Fragmento da Coragem',
  piece_brasao_esperanca:    'Fragmento da Esperança',
  piece_brasao_amizade:      'Fragmento da Amizade',
  piece_brasao_confianca:    'Fragmento da Confiança',
  piece_brasao_pureza:       'Fragmento da Pureza',
  piece_brasao_conhecimento: 'Fragmento do Conhecimento',
  piece_brasao_luz:          'Fragmento da Luz',
  piece_brasao_amor:         'Fragmento do Amor',
  piece_brasao_bondade:      'Fragmento da Bondade',
  piece_brasao_milagre:   'Fragmento do Milagre',
  piece_brasao_destino:   'Fragmento do Destino',
  x_antibody:             'X-Antibody 🧬',
  piece_x_antibody:       'Fragmento do X-Antibody',
  piece_paper_apollomon: 'Apollomon Paper',
  piece_paper_bacchusmon: 'Bacchusmon Paper',
  piece_paper_ceresmon: 'Ceresmon Paper',
  piece_paper_dianamon: 'Dianamon Paper',
  piece_paper_junomon: 'Junomon Paper',
  piece_paper_jupitermon: 'Jupitermon Paper',
  piece_paper_mercurymon: 'Mercurymon Paper',
  piece_paper_minervamon: 'Minervamon Paper',
  piece_paper_neptunemon: 'Neptunemon Paper',
  piece_paper_venusmon: 'Venusmon Paper',
  piece_paper_vulcanusmon: 'Vulcanusmon Paper',
  piece_paper_plutomon: 'Plutomon Paper',
  card_aero_wing: 'Aero Wing',
  card_asas_brancas: 'Asas Brancas',
  card_battle_tomahawk: 'Battle Tomahawk',
  card_boost_chip: 'Boost Chip',
  card_broca_aco: 'Broca de Aço',
  card_devil_chip: 'Devil Chip',
  card_heavy_metal: 'Heavy Metal',
  card_king_device: 'King Device',
  card_knight_device: 'Knight Device',
  card_alta_velocidade_d: 'Plug-In de Alta Velocidade D',
  card_alta_velocidade_h: 'Plug-In de Alta Velocidade H',
  card_alta_velocidade_t: 'Plug-In de Alta Velocidade T',
  card_ataque_a: 'Plug-In de Ataque A',
  card_defesa_g: 'Plug-In de Defesa G',
  card_forca_o: 'Plug-In de Força O',
  card_forca_w: 'Plug-In de Força W',
  card_invalidacao_p: 'Plug-In de Invalidação P',
  card_recarregamento_q: 'Plug-In de Recarregamento Q',
  card_super_evolucao_s: 'Plug-In de Super Evolução S',
  card_power_charger: 'Power Charger',
  card_queen_device: 'Queen Device',
  card_semente_durabilidade: 'Semente da Durabilidade',
  card_st_51: 'ST-51',
  card_st_382: 'ST-382',
  card_st_384: 'ST-384',
  card_thor_hammer: 'Thor Hammer',
  card_training_grips: 'Training Grips',
  card_universo_expansao: 'Universo em Expansão!',
  card_blue_caseira: 'Blue Card Caseira',
  card_blue: 'Blue Card',
  card_red: 'Red Card',
  // ── Espíritos Lendários do Frontier ──────────────────────────────────────────
  spirit_humano_fogo:       'Spirit Humano do Fogo 🔥',
  spirit_besta_fogo:        'Spirit Besta do Fogo 🔥',
  spirit_humano_vento:      'Spirit Humano do Vento 💨',
  spirit_besta_vento:       'Spirit Besta do Vento 💨',
  spirit_humano_raio:       'Spirit Humano do Raio ⚡',
  spirit_besta_raio:        'Spirit Besta do Raio ⚡',
  spirit_humano_luz:        'Spirit Humano da Luz ✨',
  spirit_besta_luz:         'Spirit Besta da Luz ✨',
  spirit_humano_gelo:       'Spirit Humano do Gelo ❄️',
  spirit_besta_gelo:        'Spirit Besta do Gelo ❄️',
  spirit_humano_escuridao:  'Spirit Humano da Escuridão 🌑',
  spirit_besta_escuridao:   'Spirit Besta da Escuridão 🌑',
  spirit_humano_agua:       'Spirit Humano da Água 💧',
  spirit_besta_agua:        'Spirit Besta da Água 💧',
  spirit_humano_terra:      'Spirit Humano da Terra 🌍',
  spirit_besta_terra:       'Spirit Besta da Terra 🌍',
  spirit_humano_madeira:    'Spirit Humano da Madeira 🌿',
  spirit_besta_madeira:     'Spirit Besta da Madeira 🌿',
  // Exclusivos da distribuição administrativa (sem drop e sem receita).
  spirit_humano_metal:      'Spirit Humano do Metal ⚙️',
  spirit_besta_metal:       'Spirit Besta do Metal ⚙️',
  spirit_conjunto_lendario: 'Conjunto dos Espíritos Lendários 🌟',
};

// Characters that can be scanned (encountered as enemies in battle)
// Only normal-phase Rookie (ROOKIE rarity) Digimon can be scanned
export const SCANNABLE_CHARACTERS: string[] = [
  // Original Rookies
  'agumon', 'gabumon', 'demiDevimon', 'patamon', 'pyomon', 'salamon', 'palmon',
  // World 2 — Santuário de Gelo
  'blackSalamon', 'mushroomon', 'tentomon', 'renamon', 'terriermon', 'wormon', 'kumamon',
  // World 3 — Catacumbas Sombrias
  'gomamon', 'kokwamon', 'lalamon',
  // World 4 — Floresta Encantada
  'gaomon', 'kotemon', 'otamamon', 'betamon',
  // World 5 — Mina de Crômio
  'candlemon', 'falcomon', 'hagurumon', 'kamemon', 'monodramon', 'penguinmon',
  // World 6 — Costa da Luz
  'solarmon', 'toyagumon',
];

// Display order in the Codex (grouped by evolution line)
export const CODEX_ORDER: string[] = [
  // Agumon / WarGreymon / Omegamon
  'agumon', 'greymon', 'metalGreymon', 'warGreymon', 'omegamon',
  // Tiranomon / SkullGreymon / MasterTyrannomon / Gaioumon (linha alternativa do Agumon)
  'tiranomon', 'skullgreymon',
  // Agumon Savers / ShineGreymon
  'agumonSaver', 'geoGreymon', 'rizeGreymon', 'shineGreymon', 'shineGreymonBurstMode',
  // Gabumon / MetalGarurumon
  'gabumon', 'garurumon', 'wereGarurumon', 'metalGarurumon',
  // Guilmon / Gallantmon
  'guilmon', 'growlmon', 'megaloGrowlmon', 'gallantmon', 'gallantmonCrimsonMode',
  // Lucemon
  'lucemon', 'lucemonChaosMode', 'lucemonSatanMode', 'lucemonFM', 'lucemonX',
  // Patamon / Goldramon / Seraphimon
  'patamon', 'angemon', 'magnaAngemon', 'goldramon', 'seraphimon',
  // Biyomon / Phoenixmon
  'pyomon', 'birdramon', 'garudamon', 'phoenixmon',
  // Salamon / Magnadramon / Ophanimon
  'salamon', 'tailmon', 'angewomon', 'magnadramon', 'ophanimon',
  'blackSalamon', 'blacktailmon',
  // Palmon / Rosemon
  'palmon', 'togemon', 'lillymon', 'rosemon', 'rosemonBurstMode',
  // DemiDevimon / VenomMyotismon
  'demiDevimon', 'devimon', 'myotismon', 'vnonMyotismon',
  // Veemon / Imperialdramon
  'veemon', 'exVeemon', 'paildramon', 'imperialDramonFM', 'imperialDramonRM', 'imperialDramonPM', 'blackImperialdramonFM',
  // Wormmon / Stingmon line (JewelBeemon / TigerVespamon via DB)
  'wormon', 'stingmon',
  // Betamon / Seadramon line (MegaSeadramon / MetalSeadramon via DB)
  'betamon', 'seadramon',
  // Hawkmon / Aquilamon / Silphymon / Valdurmon
  'aquilamon', 'silphymon', 'sinduramon', 'valdurmon',
  // Hagurumon / Guardromon line (Andromon / HiAndromon via DB)
  'hagurumon', 'guardromon',
  // Mushroomon / Woodmon line (Cherrymon / Hydramon via DB)
  'mushroomon', 'woodmon',
  // World 2 — Tentomon / Renamon / Terriermon / Kumamon lines (full chains via DB)
  'tentomon', 'renamon', 'terriermon', 'kumamon',
  // World 3 — Gomamon / Kokwamon / Pipismon / Lalamon lines (full chains via DB)
  'gomamon', 'kokwamon', 'pipismon', 'lalamon',
  // World 4 — Gaomon / Kotemon / Otamamon lines (full chains via DB)
  'gaomon', 'kotemon', 'otamamon',
  // World 5 — Candlemon / Falcomon / Kamemon / Monodramon / Penguinmon lines
  'candlemon', 'falcomon', 'kamemon', 'monodramon', 'penguinmon',
  // World 6 — Solarmon / ToyAgumon lines
  'solarmon', 'toyagumon',
  // Standalone / Special
  'gulusGammamon',
];

export const RARITY_COLORS: Record<RarityId, string> = {
  EGG:       '#fde68a',
  BABY:      '#fbcfe8',
  TRAINING:  '#6ee7b7',
  ROOKIE:    '#94a3b8',
  CHAMPION:      '#3b82f6',
  ULTIMATE:      '#8b5cf6',
  MEGA: '#f59e0b',
  ULTRA:     '#ff3c6e',
  BURST:     '#ff3c6e',
};

export const RARITY_LABELS: Record<RarityId, string> = {
  EGG:       'Ovo',
  BABY:      'Bebê',
  TRAINING:  'Treinamento',
  ROOKIE:    'Rookie',
  CHAMPION:      'Champion',
  ULTIMATE:      'Ultimate',
  MEGA: 'Mega',
  ULTRA:     'Ultra',
  BURST:     'Burst',
};

export const RARITY_ORDER: RarityId[] = ['EGG','BABY','TRAINING','ROOKIE','CHAMPION','ULTIMATE','MEGA','ULTRA','BURST'];

export const PRE_ROOKIE_STAGE_RARITIES = new Set<RarityId>(['EGG', 'BABY', 'TRAINING']);

// ─── Tamer Equipment ──────────────────────────────────────────────────────────
export type EquipSlot = 'blusa' | 'calca' | 'sapato' | 'brasao' | 'digivice' | 'pulseira' | 'oculos';
export type TamerGender = 'M' | 'F' | 'N';

export interface ElementBonus {
  elements: ElementId[];
  percent: number;
}

export interface EquipItem {
  id: string;
  name: string;
  slot: EquipSlot;
  rarity: RarityId;
  description: string;
  bonuses: Partial<BaseStats>;
  percentBonuses?: Partial<BaseStats>;
  xpBonusPercent?: number;
  xpSharePercent?: number;
  tamerXpBonusPercent?: number;
  elementBonus?: ElementBonus;
}

export const EQUIP_SLOT_LABELS: Record<EquipSlot, string> = {
  blusa:    'Blusa',
  calca:    'Calça',
  sapato:   'Sapato',
  brasao:   'Brasão',
  digivice: 'Digivice',
  pulseira: 'Pulseira',
  oculos:   'Óculos',
};

export const EQUIP_SLOT_ICONS: Record<EquipSlot, string> = {
  blusa:    'wind',
  calca:    'align-justify',
  sapato:   'chevrons-down',
  brasao:   'shield',
  digivice: 'cpu',
  pulseira: 'link',
  oculos:   'eye',
};

export const EQUIPMENT_ITEMS: EquipItem[] = [
  { id: 'blusa_tamer',    name: 'Camiseta de Tamer',  slot: 'blusa',    rarity: 'ROOKIE',    description: 'Camiseta padrão dos Tamers. Aumenta o ataque do parceiro.',          bonuses: { atk: 5 } },
  { id: 'calca_treino',   name: 'Calça de Treino',    slot: 'calca',    rarity: 'ROOKIE',    description: 'Calça confortável para treinamento. Aumenta a defesa.',              bonuses: { def: 5 } },
  { id: 'sapato_tenis',   name: 'Tênis de Corrida',   slot: 'sapato',   rarity: 'ROOKIE',    description: 'Leve e rápido. Aumenta a velocidade do parceiro.',                  bonuses: { spd: 6 } },
  { id: 'brasao_digital',  name: 'Brasão Digital',      slot: 'brasao',   rarity: 'ROOKIE',    description: 'Símbolo de um Tamer legítimo. Aumenta o HP do parceiro.',                           bonuses: { hp: 15 } },
  { id: 'brasao_coragem',   name: 'Brasão da Coragem',   slot: 'brasao', rarity: 'MEGA', description: 'O Brasão da Coragem de Tai. Aumenta em 20% todos os status de Digimon do tipo Fogo.',                          bonuses: {}, elementBonus: { elements: ['FIRE'],          percent: 0.20 } },
  { id: 'brasao_esperanca', name: 'Brasão da Esperança', slot: 'brasao', rarity: 'MEGA', description: 'O Brasão da Esperança de TK. Aumenta em 20% todos os status de Digimon do tipo Luz.',                           bonuses: {}, elementBonus: { elements: ['LIGHT'],         percent: 0.20 } },
  { id: 'brasao_amizade',   name: 'Brasão da Amizade',   slot: 'brasao', rarity: 'MEGA', description: 'O Brasão da Amizade de Matt. Aumenta em 20% todos os status de Digimon do tipo Água e Gelo.', bonuses: {}, elementBonus: { elements: ['WATER', 'ICE'], percent: 0.20 } },
  { id: 'brasao_confianca', name: 'Brasão da Confiança', slot: 'brasao', rarity: 'MEGA', description: 'O Brasão da Confiança. Aumenta em 20% todos os status de Digimon do tipo Água e Metal.', bonuses: {}, elementBonus: { elements: ['WATER', 'METAL'], percent: 0.20 } },
  { id: 'brasao_pureza',    name: 'Brasão da Pureza',    slot: 'brasao', rarity: 'MEGA', description: 'O Brasão da Pureza. Aumenta em 20% todos os status de Digimon do tipo Planta.',          bonuses: {}, elementBonus: { elements: ['PLANT'],          percent: 0.20 } },
  { id: 'brasao_amor',      name: 'Brasão do Amor',      slot: 'brasao', rarity: 'MEGA', description: 'O Brasão do Amor. Aumenta em 15% todos os status de Digimon do tipo Fogo e Vento.',     bonuses: {}, elementBonus: { elements: ['FIRE', 'WIND'],   percent: 0.15 } },
  { id: 'brasao_luz',           name: 'Brasão da Luz',           slot: 'brasao', rarity: 'MEGA', description: 'O Brasão da Luz. Aumenta em 15% todos os status de Digimon do tipo Luz e Trevas.',           bonuses: {}, elementBonus: { elements: ['LIGHT', 'DARK'],        percent: 0.15 } },
  { id: 'brasao_conhecimento',  name: 'Brasão do Conhecimento',  slot: 'brasao', rarity: 'MEGA', description: 'O Brasão do Conhecimento. Aumenta em 15% todos os status de Digimon do tipo Trovão e Planta.', bonuses: {}, elementBonus: { elements: ['LIGHTNING', 'PLANT'], percent: 0.15 } },
  { id: 'brasao_bondade',       name: 'Brasão da Bondade',       slot: 'brasao', rarity: 'MEGA', description: 'Coração Protetor: toda a equipe recebe 10% menos dano. Uma vez por batalha, quando um aliado fica com 30% de HP ou menos, recupera 30% do HP máximo.', bonuses: {} },
  { id: 'brasao_milagre',       name: 'Brasão do Milagre',       slot: 'brasao', rarity: 'ULTRA', description: 'Poder do Milagre: +15% em todos os status. Uma vez por batalha, um golpe fatal é evitado e o Digimon recupera 20% do HP máximo.', bonuses: {}, percentBonuses: { hp: 0.15, mp: 0.15, atk: 0.15, def: 0.15, spt: 0.15, spd: 0.15, apt: 0.15 } },
  { id: 'brasao_destino',       name: 'Brasão do Destino',       slot: 'brasao', rarity: 'ULTRA', description: 'Destino Inevitável: +10% em todos os status. Abaixo de 50% de HP: +5% ATK/SPT; abaixo de 25%: +10% ATK/SPT. Os bônus condicionais não acumulam.', bonuses: {}, percentBonuses: { hp: 0.10, mp: 0.10, atk: 0.10, def: 0.10, spt: 0.10, spd: 0.10, apt: 0.10 } },
  { id: 'digivice_d2',    name: 'Digivice D-2',       slot: 'digivice', rarity: 'ULTIMATE',      description: 'Recompensa por derrotar GulusGammamon. Aumenta em 20% o XP do Jogador.', bonuses: {}, tamerXpBonusPercent: 0.20 },
  { id: 'digivice_d3',    name: 'D-3 — Impulso de DNA', slot: 'digivice', rarity: 'ULTIMATE', description: 'Impulso de DNA: +10% ATK e +10% SPD para todos os Digimon do time.', bonuses: {}, percentBonuses: { atk: 0.10, spd: 0.10 } },
  { id: 'digivice_d_ark', name: 'D-Ark — Carta de Aprimoramento', slot: 'digivice', rarity: 'ULTIMATE', description: 'Carta de Aprimoramento: no início da batalha, +10% ATK, DEF e SPT para todo o time por 3 turnos.', bonuses: {} },
  { id: 'digivice_xros_loader', name: 'Xros Loader — DigiXros', slot: 'digivice', rarity: 'ULTIMATE', description: 'DigiXros: +15% de dano causado enquanto houver 2 ou mais Digimon vivos no time.', bonuses: {} },
  { id: 'pulseira_forca', name: 'Pulseira de Força',  slot: 'pulseira', rarity: 'ROOKIE',    description: 'Amplifica a força bruta do Digimon parceiro.',                      bonuses: { atk: 7 } },
  { id: 'pulseira_ouro',  name: 'Pulseira Dourada',   slot: 'pulseira', rarity: 'CHAMPION',      description: 'Pulseira lendária que amplifica múltiplos atributos de batalha.',   bonuses: { atk: 10, spt: 8 } },
  { id: 'oculos_escuro_fitado', name: 'Óculos Escuro Fitado', slot: 'oculos', rarity: 'CHAMPION', description: 'Recompensa do Trono do Caos. Aumenta em 1% a DEF do Digimon e +10% ao XP Tamer.', bonuses: {}, percentBonuses: { def: 0.01 }, tamerXpBonusPercent: 0.10 },
  { id: 'oculos_scanner', name: 'Óculos de Scanner',  slot: 'oculos',   rarity: 'ROOKIE',    description: 'Analisa inimigos em tempo real. Aumenta o MP do parceiro.',         bonuses: { mp: 8 } },
  // ── Artesanal (crafted from sewing materials) ─────────────────────────────
  // ── Costura Premium (multi-material crafts) ───────────────────────────────
  { id: 'blusa_social',      name: 'Blusa Social',       slot: 'blusa',  rarity: 'CHAMPION', description: 'Blusa social costurada com materiais premium. Aumenta em 2% o ATK e HP do Digimon.', bonuses: {}, percentBonuses: { atk: 0.02, hp: 0.02 } },
  { id: 'bermuda_poliester', name: 'Bermuda de Poliéster', slot: 'calca', rarity: 'CHAMPION', description: 'Bermuda leve de poliéster digital. Aumenta em 3% a DEF do Digimon.', bonuses: {}, percentBonuses: { def: 0.03 } },
  { id: 'tenis_corrida',     name: 'Tênis de Corrida',   slot: 'sapato', rarity: 'CHAMPION', description: 'Tênis aerodinâmico de corrida. Aumenta em 3% a SPD do Digimon.',                    bonuses: {}, percentBonuses: { spd: 0.03 } },
];

export const EQUIP_SLOTS_ORDER: EquipSlot[] = ['blusa', 'calca', 'sapato', 'brasao', 'digivice', 'pulseira', 'oculos'];

export const DEFAULT_INVENTORY: string[] = [];

// ─── Crafting / Pieces ─────────────────────────────────────────────────────────
export interface PieceRequirement {
  pieceId: string;
  count: number;
  pieceName: string;
  pieceIcon: string;
  pieceColor: string;
}

export interface CraftRecipe {
  pieceId: string;
  pieceName: string;
  pieceDescription: string;
  pieceIcon: string;
  pieceColor: string;
  requiredCount: number;
  pieceRequirements?: PieceRequirement[];
  bitsCost?: number;
  resultItemId: string;
  resultItemName: string;
  resultRarity: RarityId;
}

// ─── Tamers ───────────────────────────────────────────────────────────────────
export interface TamerOption {
  id: string;
  name: string;
  fullName: string;
  description: string;
  accentColor: string;
  image: number;
  forGender: 'M' | 'F' | 'N';
  avatarOffset: number;  // vertical px: negative = clip from top, positive = show from very top
  avatarOffsetX: number; // horizontal px: negative = shift left, positive = shift right (0 = centered)
}

export const TAMERS: TamerOption[] = [
  // Female tamers
  {
    id: 'tamer_mimi',
    name: 'Mimi',
    fullName: 'Mimi Tachikawa',
    description: 'Gentil e determinada, sua amizade com seus Digimon é inabalável.',
    accentColor: '#22c55e',
    image: require('../assets/tamers/mimi.png'),
    forGender: 'F',
    avatarOffset: -8,
    avatarOffsetX: 0,
  },
  {
    id: 'tamer_sora',
    name: 'Sora',
    fullName: 'Sora Takenouchi',
    description: 'Corajosa e protetora, cuida dos seus companheiros em qualquer batalha.',
    accentColor: '#ef4444',
    image: require('../assets/tamers/sora.png'),
    forGender: 'F',
    avatarOffset: -8,
    avatarOffsetX: 0,
  },
  {
    id: 'tamer_kari',
    name: 'Kari',
    fullName: 'Hikari Kamiya',
    description: 'Bondosa e iluminada, sua luz guia os Digimon pelo mundo digital.',
    accentColor: '#ec4899',
    image: require('../assets/tamers/kari.png'),
    forGender: 'F',
    avatarOffset: -8,
    avatarOffsetX: -2,
  },
  // Male tamers
  {
    id: 'tamer_matt',
    name: 'Matt',
    fullName: 'Yamato Ishida',
    description: 'Frio e determinado, lidera com amizade e força inabalável.',
    accentColor: '#3b82f6',
    image: require('../assets/tamers/matt.png'),
    forGender: 'M',
    avatarOffset: -8,
    avatarOffsetX: 0,
  },
  {
    id: 'tamer_tai',
    name: 'Tai',
    fullName: 'Taichi Kamiya',
    description: 'Destemido e impulsivo, enfrenta qualquer desafio de cabeça.',
    accentColor: '#f97316',
    image: require('../assets/tamers/tai.png'),
    forGender: 'M',
    avatarOffset: -8,
    avatarOffsetX: 0,
  },
  {
    id: 'tamer_tk',
    name: 'TK',
    fullName: 'Takeru Takaishi',
    description: 'Esperançoso e resiliente, sua esperança nunca se apaga nas trevas.',
    accentColor: '#eab308',
    image: require('../assets/tamers/tk.png'),
    forGender: 'M',
    avatarOffset: -23,
    avatarOffsetX: 0,
  },
];


export interface CardDefinition {
  id: string;
  name: string;
  description: string;
  bonuses?: Partial<BaseStats>;
  temporaryType?: 'ascension' | 'fusion';
  temporaryBonus?: number;
  durationMs?: number;
}

export const CARD_DEFINITIONS: CardDefinition[] = [
  { id: 'card_aero_wing', name: 'Aero Wing', description: '+10 SPD permanente no Digivice selecionado.', bonuses: { spd: 10 } },
  { id: 'card_asas_brancas', name: 'Asas Brancas', description: '+10 SPT permanente no Digivice selecionado.', bonuses: { spt: 10 } },
  { id: 'card_battle_tomahawk', name: 'Battle Tomahawk', description: '+10 ATK permanente no Digivice selecionado.', bonuses: { atk: 10 } },
  { id: 'card_boost_chip', name: 'Boost Chip', description: '+5 ATK e +5 SPD permanentes.', bonuses: { atk: 5, spd: 5 } },
  { id: 'card_broca_aco', name: 'Broca de Aço', description: '+10 DEF permanente.', bonuses: { def: 10 } },
  { id: 'card_devil_chip', name: 'Devil Chip', description: '+15 ATK e -5 DEF permanentes.', bonuses: { atk: 15, def: -5 } },
  { id: 'card_heavy_metal', name: 'Heavy Metal', description: '+15 DEF e -5 SPD permanentes.', bonuses: { def: 15, spd: -5 } },
  { id: 'card_king_device', name: 'King Device', description: '+5 ATK, +5 DEF e +5 SPT permanentes.', bonuses: { atk: 5, def: 5, spt: 5 } },
  { id: 'card_knight_device', name: 'Knight Device', description: '+10 DEF e +5 ATK permanentes.', bonuses: { def: 10, atk: 5 } },
  { id: 'card_alta_velocidade_d', name: 'Plug-In de Alta Velocidade D', description: '+10 SPD permanente.', bonuses: { spd: 10 } },
  { id: 'card_alta_velocidade_h', name: 'Plug-In de Alta Velocidade H', description: '+15 SPD permanente.', bonuses: { spd: 15 } },
  { id: 'card_alta_velocidade_t', name: 'Plug-In de Alta Velocidade T', description: '+20 SPD permanente.', bonuses: { spd: 20 } },
  { id: 'card_ataque_a', name: 'Plug-In de Ataque A', description: '+10 ATK permanente.', bonuses: { atk: 10 } },
  { id: 'card_defesa_g', name: 'Plug-In de Defesa G', description: '+10 DEF permanente.', bonuses: { def: 10 } },
  { id: 'card_forca_o', name: 'Plug-In de Força O', description: '+15 ATK permanente.', bonuses: { atk: 15 } },
  { id: 'card_forca_w', name: 'Plug-In de Força W', description: '+20 ATK permanente.', bonuses: { atk: 20 } },
  { id: 'card_invalidacao_p', name: 'Plug-In de Invalidação P', description: '+10 DEF e +10 SPT permanentes.', bonuses: { def: 10, spt: 10 } },
  { id: 'card_recarregamento_q', name: 'Plug-In de Recarregamento Q', description: '+10 SPT permanente.', bonuses: { spt: 10 } },
  { id: 'card_super_evolucao_s', name: 'Plug-In de Super Evolução S', description: '+5 em todos os atributos principais.', bonuses: { hp: 5, mp: 5, atk: 5, def: 5, spt: 5, spd: 5 } },
  { id: 'card_power_charger', name: 'Power Charger', description: '+10 ATK e +10 SPT permanentes.', bonuses: { atk: 10, spt: 10 } },
  { id: 'card_queen_device', name: 'Queen Device', description: '+5 DEF, +5 SPT e +5 SPD permanentes.', bonuses: { def: 5, spt: 5, spd: 5 } },
  { id: 'card_semente_durabilidade', name: 'Semente da Durabilidade', description: '+100 HP permanente.', bonuses: { hp: 100 } },
  { id: 'card_st_51', name: 'ST-51', description: '+10 ATK permanente.', bonuses: { atk: 10 } },
  { id: 'card_st_382', name: 'ST-382', description: '+10 DEF permanente.', bonuses: { def: 10 } },
  { id: 'card_st_384', name: 'ST-384', description: '+10 SPT permanente.', bonuses: { spt: 10 } },
  { id: 'card_thor_hammer', name: 'Thor Hammer', description: '+20 ATK permanente.', bonuses: { atk: 20 } },
  { id: 'card_training_grips', name: 'Training Grips', description: '+5 ATK e +5 DEF permanentes.', bonuses: { atk: 5, def: 5 } },
  { id: 'card_universo_expansao', name: 'Universo em Expansão!', description: '+150 HP e +5 SPT permanentes.', bonuses: { hp: 150, spt: 5 } },
  { id: 'card_blue_caseira', name: 'Blue Card Caseira', description: '+2 pontos percentuais na Ascensão por 3 horas.', temporaryType: 'ascension', temporaryBonus: 0.02, durationMs: 3 * 60 * 60 * 1000 },
  { id: 'card_blue', name: 'Blue Card', description: '+5 pontos percentuais na Ascensão por 3 horas.', temporaryType: 'ascension', temporaryBonus: 0.05, durationMs: 3 * 60 * 60 * 1000 },
  { id: 'card_red', name: 'Red Card', description: '+5 pontos percentuais na Fusão por 3 horas.', temporaryType: 'fusion', temporaryBonus: 0.05, durationMs: 3 * 60 * 60 * 1000 },
];

export const CARD_IDS = new Set(CARD_DEFINITIONS.map((card) => card.id));
export const TEMPORARY_CARD_IDS = new Set(CARD_DEFINITIONS.filter((card) => card.temporaryType).map((card) => card.id));

export const CRAFT_RECIPES: CraftRecipe[] = [
  // ── Anel Sagrado: sacrifice drops ─────────────────────────────────────────
  {
    pieceId: 'piece_anel_sagrado',
    pieceName: 'Fragmento do Anel Sagrado',
    pieceDescription: 'Obtido sacrificando Angemon, Tailmon, MagnaAngemon, Angewomon ou Lucemon Chaos Mode. Junte 10 para forjar o Anel Sagrado.',
    pieceIcon: 'circle',
    pieceColor: '#fde68a',
    requiredCount: 10,
    bitsCost: 0,
    resultItemId: 'anel_sagrado',
    resultItemName: 'Anel Sagrado ✨',
    resultRarity: 'ULTIMATE',
  },
  // ── fragmento corrompido: 4 Guardiões Celestiais ─────────────────────────────────
  {
    pieceId: 'piece_fragmento_corrompido',
    pieceName: 'Fragmento Corrompido',
    pieceDescription: 'Obtido sacrificando um dos 4 Guardiões Celestiais (Zhuqiaomon, Baihumon, Azulongmon ou Ebonwumon) ou do próprio Huanglongmon. Junte 10 para formar o Fragmento Corrompido.',
    pieceIcon: 'feather',
    pieceColor: '#a855f7',
    requiredCount: 10,
    bitsCost: 0,
    resultItemId: 'fragmento_corrompido',
    resultItemName: 'Fragmento Corrompido',
    resultRarity: 'BURST',
  },
  // ── Gehenna: Dark Lords sacrifice ─────────────────────────────────────────
  {
    pieceId: 'piece_gehenna',
    pieceName: 'Fragmento do Gehenna',
    pieceDescription: 'Obtido sacrificando um dos 7 Lordes das Trevas (Lilithmon, Barbamon, Beelzemon, Leviamon, Belphemon ou Demon). Junte 6 para forjar o Gehenna.',
    pieceIcon: 'zap',
    pieceColor: '#6d28d9',
    requiredCount: 6,
    bitsCost: 0,
    resultItemId: 'gehenna',
    resultItemName: 'Gehenna 🌑',
    resultRarity: 'MEGA',
  },
  // ── Chip Forest drops: piece_coragem ──────────────────────────────────────
  // ── Dungeon Gulus drop: piece_brasao_coragem ─────────────────────────────
  {
    pieceId: 'piece_brasao_coragem',
    pieceName: 'Fragmento do Brasão',
    pieceDescription: 'Drop raro da masmorra do GulusGammamon. Necessário para forjar o lendário Brasão da Coragem.',
    pieceIcon: 'sun',
    pieceColor: '#f97316',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_coragem',
    resultItemName: 'Brasão da Coragem',
    resultRarity: 'MEGA',
  },
  {
    pieceId: 'piece_brasao_esperanca',
    pieceName: 'Fragmento da Esperança',
    pieceDescription: 'Drop raro da masmorra do GulusGammamon. Necessário para forjar o lendário Brasão da Esperança.',
    pieceIcon: 'sun',
    pieceColor: '#eab308',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_esperanca',
    resultItemName: 'Brasão da Esperança',
    resultRarity: 'MEGA',
  },
  {
    pieceId: 'piece_brasao_amizade',
    pieceName: 'Fragmento da Amizade',
    pieceDescription: 'Drop raro da masmorra do GulusGammamon. Necessário para forjar o lendário Brasão da Amizade.',
    pieceIcon: 'users',
    pieceColor: '#3b82f6',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_amizade',
    resultItemName: 'Brasão da Amizade',
    resultRarity: 'MEGA',
  },
  {
    pieceId: 'piece_brasao_confianca',
    pieceName: 'Fragmento da Confiança',
    pieceDescription: 'Fragmento raro necessário para forjar o lendário Brasão da Confiança.',
    pieceIcon: 'shield',
    pieceColor: '#94a3b8',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_confianca',
    resultItemName: 'Brasão da Confiança',
    resultRarity: 'MEGA',
  },
  {
    pieceId: 'piece_brasao_pureza',
    pieceName: 'Fragmento da Pureza',
    pieceDescription: 'Fragmento raro necessário para forjar o lendário Brasão da Pureza.',
    pieceIcon: 'droplet',
    pieceColor: '#22c55e',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_pureza',
    resultItemName: 'Brasão da Pureza',
    resultRarity: 'MEGA',
  },
  {
    pieceId: 'piece_brasao_conhecimento',
    pieceName: 'Fragmento do Conhecimento',
    pieceDescription: 'Fragmento raro necessário para forjar o lendário Brasão do Conhecimento.',
    pieceIcon: 'book',
    pieceColor: '#a855f7',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_conhecimento',
    resultItemName: 'Brasão do Conhecimento',
    resultRarity: 'MEGA',
  },
  {
    pieceId: 'piece_brasao_luz',
    pieceName: 'Fragmento da Luz',
    pieceDescription: 'Fragmento raro necessário para forjar o lendário Brasão da Luz.',
    pieceIcon: 'star',
    pieceColor: '#c084fc',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_luz',
    resultItemName: 'Brasão da Luz',
    resultRarity: 'MEGA',
  },
  {
    pieceId: 'piece_brasao_amor',
    pieceName: 'Fragmento do Amor',
    pieceDescription: 'Fragmento raro necessário para forjar o lendário Brasão do Amor.',
    pieceIcon: 'heart',
    pieceColor: '#f43f5e',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_amor',
    resultItemName: 'Brasão do Amor',
    resultRarity: 'MEGA',
  },
  {
    pieceId: 'piece_brasao_bondade',
    pieceName: 'Fragmento da Bondade',
    pieceDescription: 'Fragmento raro da masmorra do GulusGammamon. Necessário para forjar o lendário Brasão da Bondade.',
    pieceIcon: 'heart',
    pieceColor: '#d946ef',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_bondade',
    resultItemName: 'Brasão da Bondade',
    resultRarity: 'MEGA',
  },
  {
    pieceId: 'piece_brasao_milagre',
    pieceName: 'Fragmento do Milagre',
    pieceDescription: 'Fragmento especial obtido no Covil do Gulus — Fragmentos de Digivice com 5% de chance. Junte 100 e pague 100.000 Bits para forjar o Brasão do Milagre.',
    pieceIcon: 'star',
    pieceColor: '#facc15',
    requiredCount: 100,
    bitsCost: 100000,
    resultItemId: 'brasao_milagre',
    resultItemName: 'Brasão do Milagre',
    resultRarity: 'ULTRA',
  },
  {
    pieceId: 'piece_brasao_destino',
    pieceName: 'Fragmento do Destino',
    pieceDescription: 'Fragmento especial obtido no Covil do Gulus — Fragmentos de Digivice com 5% de chance. Junte 100 e pague 100.000 Bits para forjar o Brasão do Destino.',
    pieceIcon: 'compass',
    pieceColor: '#a78bfa',
    requiredCount: 100,
    bitsCost: 100000,
    resultItemId: 'brasao_destino',
    resultItemName: 'Brasão do Destino',
    resultRarity: 'ULTRA',
  },
  // ── Acess Glacier drops: piece_gelo ──────────────────────────────────────
  // ── Costura Premium: multi-material recipes ──────────────────────────────
  {
    pieceId: 'piece_tecido',
    pieceName: 'Tecido Colorido',
    pieceDescription: 'Receita premium de múltiplos materiais. Forja a Blusa Social com bônus percentuais.',
    pieceIcon: 'layers',
    pieceColor: '#ec4899',
    requiredCount: 20,
    pieceRequirements: [
      { pieceId: 'piece_tecido', count: 20, pieceName: 'Tecido Colorido', pieceIcon: 'layers', pieceColor: '#ec4899' },
      { pieceId: 'piece_linha',  count: 30, pieceName: 'Linha Colorida',  pieceIcon: 'wind',   pieceColor: '#06b6d4' },
      { pieceId: 'piece_agulha', count: 20, pieceName: 'Agulha Média',    pieceIcon: 'edit-2', pieceColor: '#8b5cf6' },
    ],
    bitsCost: 10000,
    resultItemId: 'blusa_social',
    resultItemName: 'Blusa Social',
    resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_tecido',
    pieceName: 'Tecido Colorido',
    pieceDescription: 'Receita premium de múltiplos materiais. Forja a Bermuda de Poliéster com bônus percentuais.',
    pieceIcon: 'layers',
    pieceColor: '#ec4899',
    requiredCount: 20,
    pieceRequirements: [
      { pieceId: 'piece_tecido', count: 20, pieceName: 'Tecido Colorido', pieceIcon: 'layers', pieceColor: '#ec4899' },
      { pieceId: 'piece_linha',  count: 30, pieceName: 'Linha Colorida',  pieceIcon: 'wind',   pieceColor: '#06b6d4' },
      { pieceId: 'piece_agulha', count: 20, pieceName: 'Agulha Média',    pieceIcon: 'edit-2', pieceColor: '#8b5cf6' },
    ],
    bitsCost: 10000,
    resultItemId: 'bermuda_poliester',
    resultItemName: 'Bermuda de Poliéster',
    resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_tecido',
    pieceName: 'Tecido Colorido',
    pieceDescription: 'Receita premium de múltiplos materiais. Forja o Tênis de Corrida com bônus percentuais.',
    pieceIcon: 'layers',
    pieceColor: '#ec4899',
    requiredCount: 20,
    pieceRequirements: [
      { pieceId: 'piece_tecido', count: 20, pieceName: 'Tecido Colorido', pieceIcon: 'layers', pieceColor: '#ec4899' },
      { pieceId: 'piece_linha',  count: 30, pieceName: 'Linha Colorida',  pieceIcon: 'wind',   pieceColor: '#06b6d4' },
      { pieceId: 'piece_agulha', count: 20, pieceName: 'Agulha Média',    pieceIcon: 'edit-2', pieceColor: '#8b5cf6' },
    ],
    bitsCost: 10000,
    resultItemId: 'tenis_corrida',
    resultItemName: 'Tênis de Corrida',
    resultRarity: 'CHAMPION',
  },
  // ── Conjunto dos Espíritos Lendários: 8 espíritos não-fogo → Susanoomon ─────
  {
    pieceId: 'spirit_humano_vento',
    pieceName: 'Spirit Humano do Vento',
    pieceDescription: 'Obtido sacrificando Kazemon. Colete todos os 8 espíritos não-fogo para forjar o Conjunto Lendário e evoluir KaiserGreymon para Susanoomon.',
    pieceIcon: 'wind',
    pieceColor: '#22d3ee',
    requiredCount: 1,
    bitsCost: 0,
    pieceRequirements: [
      { pieceId: 'spirit_humano_vento',     count: 1, pieceName: 'Spirit Humano do Vento',     pieceIcon: 'wind',     pieceColor: '#22d3ee' },
      { pieceId: 'spirit_humano_raio',      count: 1, pieceName: 'Spirit Humano do Raio',      pieceIcon: 'zap',      pieceColor: '#facc15' },
      { pieceId: 'spirit_humano_luz',       count: 1, pieceName: 'Spirit Humano da Luz',       pieceIcon: 'sun',      pieceColor: '#fde68a' },
      { pieceId: 'spirit_humano_gelo',      count: 1, pieceName: 'Spirit Humano do Gelo',      pieceIcon: 'cloud',    pieceColor: '#93c5fd' },
      { pieceId: 'spirit_humano_escuridao', count: 1, pieceName: 'Spirit Humano da Escuridão', pieceIcon: 'moon',     pieceColor: '#7c3aed' },
      { pieceId: 'spirit_humano_agua',      count: 1, pieceName: 'Spirit Humano da Água',      pieceIcon: 'droplet',  pieceColor: '#38bdf8' },
      { pieceId: 'spirit_humano_terra',     count: 1, pieceName: 'Spirit Humano da Terra',     pieceIcon: 'triangle', pieceColor: '#a16207' },
      { pieceId: 'spirit_humano_madeira',   count: 1, pieceName: 'Spirit Humano da Madeira',   pieceIcon: 'feather',  pieceColor: '#4ade80' },
    ],
    resultItemId: 'spirit_conjunto_lendario',
    resultItemName: 'Conjunto dos Espíritos Lendários 🌟',
    resultRarity: 'ULTRA',
  },
  // ── Chaos Brain drops: piece_caos ────────────────────────────────────────
  {
    pieceId: 'piece_caos',
    pieceName: 'Fragmento do Caos',
    pieceDescription: 'Drop do Chaos Brain. Usado para forjar itens épicos.',
    pieceIcon: 'cpu',
    pieceColor: '#a855f7',
    requiredCount: 5,
    bitsCost: 500,
    resultItemId: 'pulseira_ouro',
    resultItemName: 'Pulseira Dourada',
    resultRarity: 'CHAMPION',
  },
  // ── Fragmentos de Digivice: Covil do Gulus ───────────────────────────────
  {
    pieceId: 'piece_digivice_d3',
    pieceName: 'Fragmento D-3',
    pieceDescription: 'Fragmento obtido no Covil do Gulus. Junte 50 e pague 100.000 Bits para criar o D-3.',
    pieceIcon: 'cpu',
    pieceColor: '#3b82f6',
    requiredCount: 50,
    bitsCost: 100000,
    resultItemId: 'digivice_d3',
    resultItemName: 'D-3 — Impulso de DNA',
    resultRarity: 'ULTIMATE',
  },
  {
    pieceId: 'piece_digivice_d_ark',
    pieceName: 'Fragmento D-Ark',
    pieceDescription: 'Fragmento obtido no Covil do Gulus. Junte 50 e pague 100.000 Bits para criar o D-Ark.',
    pieceIcon: 'cpu',
    pieceColor: '#22c55e',
    requiredCount: 50,
    bitsCost: 100000,
    resultItemId: 'digivice_d_ark',
    resultItemName: 'D-Ark — Carta de Aprimoramento',
    resultRarity: 'ULTIMATE',
  },
  {
    pieceId: 'piece_digivice_xros_loader',
    pieceName: 'Fragmento Xros Loader',
    pieceDescription: 'Fragmento obtido no Covil do Gulus. Junte 50 e pague 100.000 Bits para criar o Xros Loader.',
    pieceIcon: 'cpu',
    pieceColor: '#f59e0b',
    requiredCount: 50,
    bitsCost: 100000,
    resultItemId: 'digivice_xros_loader',
    resultItemName: 'Xros Loader — DigiXros',
    resultRarity: 'ULTIMATE',
  },
  // ── X-Antibody: Covil de Arcturiusmon ────────────────────────────────────
  {
    pieceId: 'piece_x_antibody',
    pieceName: 'Fragmento do X-Antibody',
    pieceDescription: 'Drop raro (5%) do Covil de Arcturiusmon. Junte 10 fragmentos para criar o X-Antibody, usado nas evoluções X.',
    pieceIcon: 'activity',
    pieceColor: '#38bdf8',
    requiredCount: 10,
    bitsCost: 0,
    resultItemId: 'x_antibody',
    resultItemName: 'X-Antibody 🧬',
    resultRarity: 'MEGA',
  },
  // ── Black Digitron: Dungeon Gulus drop ────────────────────────────────────
  {
    pieceId: 'piece_black_digitron',
    pieceName: 'Fragmento do Black Digitron',
    pieceDescription: 'Drop raro (5%) da masmorra do GulusGammamon. Junte 10 para forjar o Black Digitron e evoluir o Imperialdramon FM para Black Imperialdramon FM.',
    pieceIcon: 'zap',
    pieceColor: '#1e1b4b',
    requiredCount: 10,
    bitsCost: 0,
    resultItemId: 'black_digitron',
    resultItemName: 'Black Digitron 🖤',
    resultRarity: 'MEGA',
  },
  // ── Cards ───────────────────────────────────────────────────────────────
  {
    pieceId: 'piece_paper_dianamon', pieceName: 'Dianamon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_dianamon', count: 10, pieceName: 'Dianamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_mercurymon', count: 10, pieceName: 'Mercurymon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_junomon', count: 10, pieceName: 'Junomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_neptunemon', count: 10, pieceName: 'Neptunemon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_aero_wing', resultItemName: 'Aero Wing', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_venusmon', pieceName: 'Venusmon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_venusmon', count: 10, pieceName: 'Venusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_junomon', count: 10, pieceName: 'Junomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_dianamon', count: 10, pieceName: 'Dianamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_ceresmon', count: 10, pieceName: 'Ceresmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_asas_brancas', resultItemName: 'Asas Brancas', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_vulcanusmon', pieceName: 'Vulcanusmon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_vulcanusmon', count: 10, pieceName: 'Vulcanusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_minervamon', count: 10, pieceName: 'Minervamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_apollomon', count: 10, pieceName: 'Apollomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_jupitermon', count: 10, pieceName: 'Jupitermon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_battle_tomahawk', resultItemName: 'Battle Tomahawk', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_mercurymon', pieceName: 'Mercurymon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_mercurymon', count: 10, pieceName: 'Mercurymon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_jupitermon', count: 10, pieceName: 'Jupitermon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_apollomon', count: 10, pieceName: 'Apollomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_bacchusmon', count: 10, pieceName: 'Bacchusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_boost_chip', resultItemName: 'Boost Chip', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_vulcanusmon', pieceName: 'Vulcanusmon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_vulcanusmon', count: 10, pieceName: 'Vulcanusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_ceresmon', count: 10, pieceName: 'Ceresmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_minervamon', count: 10, pieceName: 'Minervamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_neptunemon', count: 10, pieceName: 'Neptunemon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_broca_aco', resultItemName: 'Broca de Aço', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_plutomon', pieceName: 'Plutomon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 8, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_plutomon', count: 8, pieceName: 'Plutomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_minervamon', count: 8, pieceName: 'Minervamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_bacchusmon', count: 8, pieceName: 'Bacchusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_apollomon', count: 8, pieceName: 'Apollomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_mercurymon', count: 8, pieceName: 'Mercurymon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_devil_chip', resultItemName: 'Devil Chip', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_vulcanusmon', pieceName: 'Vulcanusmon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_vulcanusmon', count: 10, pieceName: 'Vulcanusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_jupitermon', count: 10, pieceName: 'Jupitermon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_ceresmon', count: 10, pieceName: 'Ceresmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_neptunemon', count: 10, pieceName: 'Neptunemon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_heavy_metal', resultItemName: 'Heavy Metal', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_jupitermon', pieceName: 'Jupitermon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 8, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_jupitermon', count: 8, pieceName: 'Jupitermon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_apollomon', count: 8, pieceName: 'Apollomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_plutomon', count: 8, pieceName: 'Plutomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_vulcanusmon', count: 8, pieceName: 'Vulcanusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_minervamon', count: 8, pieceName: 'Minervamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_king_device', resultItemName: 'King Device', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_jupitermon', pieceName: 'Jupitermon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_jupitermon', count: 10, pieceName: 'Jupitermon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_vulcanusmon', count: 10, pieceName: 'Vulcanusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_minervamon', count: 10, pieceName: 'Minervamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_ceresmon', count: 10, pieceName: 'Ceresmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_knight_device', resultItemName: 'Knight Device', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_dianamon', pieceName: 'Dianamon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_dianamon', count: 10, pieceName: 'Dianamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_mercurymon', count: 10, pieceName: 'Mercurymon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_neptunemon', count: 10, pieceName: 'Neptunemon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_junomon', count: 10, pieceName: 'Junomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_alta_velocidade_d', resultItemName: 'Plug-In de Alta Velocidade D', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_mercurymon', pieceName: 'Mercurymon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_mercurymon', count: 10, pieceName: 'Mercurymon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_neptunemon', count: 10, pieceName: 'Neptunemon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_dianamon', count: 10, pieceName: 'Dianamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_bacchusmon', count: 10, pieceName: 'Bacchusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_alta_velocidade_h', resultItemName: 'Plug-In de Alta Velocidade H', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_mercurymon', pieceName: 'Mercurymon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_mercurymon', count: 10, pieceName: 'Mercurymon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_dianamon', count: 10, pieceName: 'Dianamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_apollomon', count: 10, pieceName: 'Apollomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_junomon', count: 10, pieceName: 'Junomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_alta_velocidade_t', resultItemName: 'Plug-In de Alta Velocidade T', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_apollomon', pieceName: 'Apollomon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_apollomon', count: 10, pieceName: 'Apollomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_minervamon', count: 10, pieceName: 'Minervamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_vulcanusmon', count: 10, pieceName: 'Vulcanusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_jupitermon', count: 10, pieceName: 'Jupitermon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_ataque_a', resultItemName: 'Plug-In de Ataque A', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_ceresmon', pieceName: 'Ceresmon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_ceresmon', count: 10, pieceName: 'Ceresmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_jupitermon', count: 10, pieceName: 'Jupitermon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_neptunemon', count: 10, pieceName: 'Neptunemon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_vulcanusmon', count: 10, pieceName: 'Vulcanusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_defesa_g', resultItemName: 'Plug-In de Defesa G', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_apollomon', pieceName: 'Apollomon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_apollomon', count: 10, pieceName: 'Apollomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_vulcanusmon', count: 10, pieceName: 'Vulcanusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_minervamon', count: 10, pieceName: 'Minervamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_bacchusmon', count: 10, pieceName: 'Bacchusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_forca_o', resultItemName: 'Plug-In de Força O', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_apollomon', pieceName: 'Apollomon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_apollomon', count: 10, pieceName: 'Apollomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_minervamon', count: 10, pieceName: 'Minervamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_vulcanusmon', count: 10, pieceName: 'Vulcanusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_jupitermon', count: 10, pieceName: 'Jupitermon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_forca_w', resultItemName: 'Plug-In de Força W', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_jupitermon', pieceName: 'Jupitermon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 8, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_jupitermon', count: 8, pieceName: 'Jupitermon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_plutomon', count: 8, pieceName: 'Plutomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_ceresmon', count: 8, pieceName: 'Ceresmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_dianamon', count: 8, pieceName: 'Dianamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_venusmon', count: 8, pieceName: 'Venusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_invalidacao_p', resultItemName: 'Plug-In de Invalidação P', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_bacchusmon', pieceName: 'Bacchusmon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_bacchusmon', count: 10, pieceName: 'Bacchusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_ceresmon', count: 10, pieceName: 'Ceresmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_mercurymon', count: 10, pieceName: 'Mercurymon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_venusmon', count: 10, pieceName: 'Venusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_recarregamento_q', resultItemName: 'Plug-In de Recarregamento Q', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_jupitermon', pieceName: 'Jupitermon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 8, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_jupitermon', count: 8, pieceName: 'Jupitermon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_junomon', count: 8, pieceName: 'Junomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_plutomon', count: 8, pieceName: 'Plutomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_apollomon', count: 8, pieceName: 'Apollomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_ceresmon', count: 8, pieceName: 'Ceresmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_super_evolucao_s', resultItemName: 'Plug-In de Super Evolução S', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_apollomon', pieceName: 'Apollomon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_apollomon', count: 10, pieceName: 'Apollomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_bacchusmon', count: 10, pieceName: 'Bacchusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_mercurymon', count: 10, pieceName: 'Mercurymon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_vulcanusmon', count: 10, pieceName: 'Vulcanusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_power_charger', resultItemName: 'Power Charger', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_junomon', pieceName: 'Junomon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 8, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_junomon', count: 8, pieceName: 'Junomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_venusmon', count: 8, pieceName: 'Venusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_dianamon', count: 8, pieceName: 'Dianamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_ceresmon', count: 8, pieceName: 'Ceresmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_jupitermon', count: 8, pieceName: 'Jupitermon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_queen_device', resultItemName: 'Queen Device', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_ceresmon', pieceName: 'Ceresmon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_ceresmon', count: 10, pieceName: 'Ceresmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_neptunemon', count: 10, pieceName: 'Neptunemon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_venusmon', count: 10, pieceName: 'Venusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_junomon', count: 10, pieceName: 'Junomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_semente_durabilidade', resultItemName: 'Semente da Durabilidade', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_mercurymon', pieceName: 'Mercurymon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_mercurymon', count: 10, pieceName: 'Mercurymon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_dianamon', count: 10, pieceName: 'Dianamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_apollomon', count: 10, pieceName: 'Apollomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_neptunemon', count: 10, pieceName: 'Neptunemon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_st_51', resultItemName: 'ST-51', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_neptunemon', pieceName: 'Neptunemon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_neptunemon', count: 10, pieceName: 'Neptunemon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_minervamon', count: 10, pieceName: 'Minervamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_vulcanusmon', count: 10, pieceName: 'Vulcanusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_bacchusmon', count: 10, pieceName: 'Bacchusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_st_382', resultItemName: 'ST-382', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_ceresmon', pieceName: 'Ceresmon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_ceresmon', count: 10, pieceName: 'Ceresmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_venusmon', count: 10, pieceName: 'Venusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_junomon', count: 10, pieceName: 'Junomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_jupitermon', count: 10, pieceName: 'Jupitermon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_st_384', resultItemName: 'ST-384', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_jupitermon', pieceName: 'Jupitermon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 8, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_jupitermon', count: 8, pieceName: 'Jupitermon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_vulcanusmon', count: 8, pieceName: 'Vulcanusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_apollomon', count: 8, pieceName: 'Apollomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_minervamon', count: 8, pieceName: 'Minervamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_plutomon', count: 8, pieceName: 'Plutomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_thor_hammer', resultItemName: 'Thor Hammer', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_minervamon', pieceName: 'Minervamon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_minervamon', count: 10, pieceName: 'Minervamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_bacchusmon', count: 10, pieceName: 'Bacchusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_apollomon', count: 10, pieceName: 'Apollomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_ceresmon', count: 10, pieceName: 'Ceresmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_training_grips', resultItemName: 'Training Grips', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_dianamon', pieceName: 'Dianamon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 8, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_dianamon', count: 8, pieceName: 'Dianamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_neptunemon', count: 8, pieceName: 'Neptunemon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_plutomon', count: 8, pieceName: 'Plutomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_mercurymon', count: 8, pieceName: 'Mercurymon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_venusmon', count: 8, pieceName: 'Venusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_universo_expansao', resultItemName: 'Universo em Expansão!', resultRarity: 'CHAMPION',
  },
  {
    pieceId: 'piece_paper_dianamon', pieceName: 'Dianamon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_dianamon', count: 10, pieceName: 'Dianamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_mercurymon', count: 10, pieceName: 'Mercurymon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_junomon', count: 10, pieceName: 'Junomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_venusmon', count: 10, pieceName: 'Venusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_ceresmon', count: 10, pieceName: 'Ceresmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_blue_caseira', resultItemName: 'Blue Card Caseira', resultRarity: 'ULTIMATE',
  },
  {
    pieceId: 'piece_paper_dianamon', pieceName: 'Dianamon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_dianamon', count: 10, pieceName: 'Dianamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_junomon', count: 10, pieceName: 'Junomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_jupitermon', count: 10, pieceName: 'Jupitermon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_mercurymon', count: 10, pieceName: 'Mercurymon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_venusmon', count: 10, pieceName: 'Venusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_plutomon', count: 10, pieceName: 'Plutomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_blue', resultItemName: 'Blue Card', resultRarity: 'MEGA',
  },
  {
    pieceId: 'piece_paper_apollomon', pieceName: 'Apollomon Paper', pieceDescription: 'Papers do Oásis do Olimpo.', pieceIcon: 'layers', pieceColor: '#60a5fa', requiredCount: 10, bitsCost: 0,
    pieceRequirements: [{ pieceId: 'piece_paper_apollomon', count: 10, pieceName: 'Apollomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_minervamon', count: 10, pieceName: 'Minervamon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_vulcanusmon', count: 10, pieceName: 'Vulcanusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_jupitermon', count: 10, pieceName: 'Jupitermon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_bacchusmon', count: 10, pieceName: 'Bacchusmon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }, { pieceId: 'piece_paper_plutomon', count: 10, pieceName: 'Plutomon Paper', pieceIcon: 'file-text', pieceColor: '#60a5fa' }],
    resultItemId: 'card_red', resultItemName: 'Red Card', resultRarity: 'MEGA',
  }

];

export function expToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

export function tamerExpToNextLevel(level: number): number {
  if (level <= 4) {
    return Math.round(100 * Math.pow(1.276, level - 1));
  }
  return Math.round(528 * Math.pow(1.218, level - 5));
}

export function getScaledStats(base: BaseStats, level: number): BaseStats {
  const mult = 1 + (level - 1) * 0.05;
  return {
    hp:  Math.floor(base.hp  * mult),
    mp:  Math.floor(base.mp  * mult),
    atk: Math.floor(base.atk * mult),
    def: Math.floor(base.def * mult),
    spt: Math.floor(base.spt * mult),
    spd: Math.floor(base.spd * mult),
    apt: Math.floor(base.apt * mult),
  };
}
