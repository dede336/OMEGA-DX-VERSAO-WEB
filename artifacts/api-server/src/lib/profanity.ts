// Filtro conservador para um jogo com público amplo. O filtro impede o envio;
// somente Admin/Assistente podem decidir uma punição após análise humana.
const OFFENSIVE_TERMS = [
  "gay", "viado", "viada", "viadao", "viadinho", "bicha", "bixa", "bichinha",
  "baitola", "sapatao", "traveco", "faggot", "fag", "dyke",
  "crioulo", "macaco", "macaca", "preto imundo", "negro imundo", "nigger", "nigga",
  "nazista", "judeu imundo", "retardado", "retardada", "mongol", "mongoloide",
  "aleijado", "aleijada", "imbecil", "idiota", "cretino", "cretina", "burro", "burra",
  "puta", "puto", "putinha", "rapariga", "vagabundo", "vagabunda", "safado", "safada",
  "filho da puta", "filha da puta", "filho de puta", "fdp", "arrombado", "arrombada",
  "caralho", "porra", "buceta", "xoxota", "cuzao", "cuzinho", "piroca", "pica",
  "rola", "foda", "fode", "foder", "fodase", "vai tomar no cu", "vtnc", "vtc",
  "vai se foder", "vsf", "merda", "bosta", "putaria", "whore", "slut", "bitch",
  "motherfucker", "asshole", "bastard", "fuck", "shit", "cunt", "dick", "pussy",
  "vou te matar", "quero te matar", "morra", "se mata", "suicida", "vou te pegar",
];

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[4@]/g, "a").replace(/3/g, "e").replace(/[1!|]/g, "i")
    .replace(/0/g, "o").replace(/[5$]/g, "s").replace(/8/g, "b")
    .replace(/[._*~-]+/g, "").replace(/(.)\1{2,}/g, "$1$1");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function findOffensiveTerm(text: string): string | null {
  const normalized = normalize(text);
  for (const term of OFFENSIVE_TERMS) {
    const flexible = escapeRegExp(normalize(term)).replace(/\s+/g, "\\s*");
    if (new RegExp(`(^|[^a-z0-9])${flexible}([^a-z0-9]|$)`, "iu").test(normalized)) return term;
  }
  return null;
}

export function containsProfanity(text: string): boolean {
  return findOffensiveTerm(text) !== null;
}

