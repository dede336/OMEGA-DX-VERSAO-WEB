// Selection keeps TAMERS.image; this map is used only after choosing a Tamer.
const ACTIVE_TAMER_IMAGES: Record<string, any> = {
  tamer_tai: require('../assets/tamers/tai ativo.gif'),
  tamer_kari: require('../assets/tamers/kari ativo.gif'),
};

export function getActiveTamerImage(tamer: { id: string; image: any }) {
  return ACTIVE_TAMER_IMAGES[tamer.id] ?? tamer.image;
}
