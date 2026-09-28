// Each asset in the uploaded theme folder is mapped to its Tamer explicitly.
export const TEMA_IMAGES: Record<string, { menu: any; banco: any; digibank: any }> = {
  tamer_kari: {
    menu: require('../assets/images/tema/tela menu kari.png'),
    banco: require('../assets/images/tema/banco quadrado fundo onde fica o digimon kari.png'),
    digibank: require('../assets/images/tema/digibank quadrado onde fica o digimon kari.gif'),
  },
  tamer_matt: {
    menu: require('../assets/images/tema/tela menu matt.png'),
    banco: require('../assets/images/tema/banco quadrado fundo onde fica o digimon matt.png'),
    digibank: require('../assets/images/tema/digibank quadrado onde fica o digimon mat.gif'),
  },
  tamer_mimi: {
    menu: require('../assets/images/tema/tela menu mimi.png'),
    banco: require('../assets/images/tema/banco quadrado fundo onde fica o digimon mimi.png'),
    digibank: require('../assets/images/tema/digibank quadrado onde fica o digimon mimi.gif'),
  },
  tamer_sora: {
    menu: require('../assets/images/tema/tela menu sora.png'),
    banco: require('../assets/images/tema/banco quadrado fundo onde fica o digimon sora.png'),
    digibank: require('../assets/images/tema/digibank quadrado onde fica o digimon matsora.gif'),
  },
  tamer_tai: {
    menu: require('../assets/images/tema/tela menu tai.png'),
    banco: require('../assets/images/tema/banco quadrado fundo onde fica o digimon tai.png'),
    digibank: require('../assets/images/tema/digibank quadrado onde fica o digimon tai.gif'),
  },
  tamer_tk: {
    menu: require('../assets/images/tema/tela menu tk.png'),
    banco: require('../assets/images/tema/banco quadrado fundo onde fica o digimon tk.png'),
    digibank: require('../assets/images/tema/digibank quadrado onde fica o digimon tk.gif'),
  },
};

export const getTemaImages = (tamerId: string | null | undefined) =>
  TEMA_IMAGES[tamerId ?? ''] ?? TEMA_IMAGES.tamer_tai;
