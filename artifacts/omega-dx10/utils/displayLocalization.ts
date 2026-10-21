import type { Language } from '../constants/i18n';
import { translations } from '../constants/i18n';
import { portugueseDisplayOverrides } from '../constants/portugueseDisplayOverrides';
import { supplementalTranslations } from '../constants/supplementalTranslations';

let displayLanguage: Language = 'pt';
const listeners = new Set<() => void>();
export const getDisplayLanguage = () => displayLanguage;
export const getDisplayLocale = () => ({ pt: 'pt-BR', en: 'en-US', es: 'es-ES' }[displayLanguage]);
export const subscribeDisplayLanguage = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
export function setDisplayLanguage(language: Language): void {
  if (displayLanguage === language) return;
  displayLanguage = language;
  cache.clear();
  for (const listener of listeners) listener();
}
const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
type Entry = { source: string; en: string; es: string };
const bySource = new Map<string, Entry>();
for (const [key, pt] of Object.entries(translations.pt)) {
  bySource.set(normalize(pt), { source: normalize(pt), en: translations.en[key] ?? pt, es: translations.es[key] ?? pt });
}
for (const [source, targets] of Object.entries(supplementalTranslations)) {
  bySource.set(normalize(source), { source: normalize(source), en: targets[0], es: targets[1] });
}
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const placeholder = /\{(\w+)\}/g;
const templates = [...bySource.values()].filter(entry => /\{\w+\}/.test(entry.source))
  // Do not treat bare variables as translatable prose.
  .filter(entry => entry.source.replace(placeholder, '').replace(/[^A-Za-zÀ-ÿ]/g, '').length >= 4)
  .map(entry => {
    const keys: string[] = [];
    let cursor = 0;
    let pattern = '^';
    for (const match of entry.source.matchAll(placeholder)) {
      pattern += escapeRegex(entry.source.slice(cursor, match.index));
      pattern += '(.*?)';
      keys.push(match[1]);
      cursor = match.index! + match[0].length;
    }
    pattern += escapeRegex(entry.source.slice(cursor)) + '$';
    return { ...entry, keys, regex: new RegExp(pattern, 'u'), weight: entry.source.replace(placeholder, '').length };
  }).sort((a, b) => b.weight - a.weight);
// Only these variables are authored game labels. Player names, account data,
// moderation reasons and other interpolated text must stay verbatim.
const translatedSlots: Record<string, readonly string[]> = {
  '{0} usou {1}!': ['1'],
  '⚔️ {0} usa {1}{2}! -{3} HP': ['1', '2'],
  '{0} agora está {1}.': ['1'],
  'Evolução de {0} (Lv {1}){2}': ['2'],
  'Evolução de {0}{1}{2}': ['1', '2'],
  'Evolução Alt. de {0} (Lv {1}){2}{3}': ['2', '3'],
  'Comprar {0} por {1} Moedas PvP?': ['0'],
  'Forjar {0}': ['0'],
  '{0}× {1} obtida para a Farm! 🌿': ['1'],
  '⚔️ Itens: {0}': ['0'],
  '🔮 Fragmentos: {0}': ['0'],
};
const cache = new Map<string, string>();
/** Localize authored display text only. Never use for IDs, saves or user input. */
export function localizeText(value: string, language: Language = displayLanguage, depth = 0): string {
  if (!value || depth > 3) return value;
  if (language === 'pt') return portugueseDisplayOverrides[normalize(value)] ?? value;
  const fullMatch = bySource.get(normalize(value));
  if (fullMatch && /\S/.test(value)) return (value.match(/^\s*/)?.[0] ?? '') + fullMatch[language] + (value.match(/\s*$/)?.[0] ?? '');
  // Keep line breaks, indentation and deliberately padded fragments.
  if (value.includes('\n')) return value.split('\n').map(line => localizeText(line, language, depth)).join('\n');
  const key = `${language}:${value}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  const source = normalize(value);
  const leading = value.match(/^\s*/)?.[0] ?? '';
  const trailing = value.match(/\s*$/)?.[0] ?? '';
  const exact = bySource.get(source);
  let result: string | undefined = exact?.[language];
  if (result === undefined) {
    for (const template of templates) {
      const match = template.regex.exec(source);
      if (!match) continue;
      const vars = new Map(template.keys.map((name, i) => [name, match[i + 1]]));
      result = template[language].replace(placeholder, (whole, name: string) => {
        const part = vars.get(name);
        return part === undefined ? whole : translatedSlots[template.source]?.includes(name) ? localizeText(part, language, depth + 1) : part;
      });
      break;
    }
  }
  if (result === undefined) {
    // Icon and bullet prefixes are decoration; translate the complete prose after them.
    const decorated = source.match(/^([^\p{L}\p{N}]+)([\p{L}].*)$/u);
    if (decorated) {
      const body = localizeText(decorated[2], language, depth + 1);
      if (body !== decorated[2]) result = decorated[1] + body;
    }
  }
  const output = result === undefined ? value : leading + result + trailing;
  // Limit cache growth during long battle sessions.
  if (cache.size >= 2500) cache.clear();
  cache.set(key, output);
  return output;
}
