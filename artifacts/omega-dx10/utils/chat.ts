export const CHAT_UNIT_LIMIT = 50;
export const CHAT_EMOJIS = ['😀', '😂', '🥰', '😎', '😢', '😡', '👍', '👎', '❤️', '🎉', '🔥', '✨', '🎮', '⚔️', '🛡️'];

export function countChatUnits(text: string): number {
  if (!text.trim()) return 0;
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('pt-BR', { granularity: 'word' });
    let count = 0;
    for (const part of segmenter.segment(text.trim())) {
      if (part.isWordLike || /\p{Extended_Pictographic}/u.test(part.segment)) count += 1;
    }
    return count;
  }
  return text.trim().split(/\s+/).length;
}

// Estrutura pronta para as figurinhas 50x50 criadas pelo proprietário do jogo.
// Exemplo futuro: omega_happy: require('../assets/images/stickers/omega_happy.webp')
export const CHAT_STICKERS: Record<string, number> = {};
export const CHAT_STICKER_SIZE = 50;
