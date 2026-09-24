import ENERGY_PILL_IMAGE from './energyPillImage';
const EQUIP_ITEM_IMAGES: Record<string, any> = {
  pilula_energetica: ENERGY_PILL_IMAGE,
  brasao_coragem:   require('../assets/images/brasao_coragem.webp'),
  brasao_esperanca: require('../assets/images/brasao_esperanca_v4.webp'),
  brasao_amizade:   require('../assets/images/brasao_amizade.webp'),
  brasao_confianca: require('../assets/images/brasao_confianca.webp'),
  brasao_pureza:    require('../assets/images/brasao_pureza.webp'),
  brasao_amor:      require('../assets/images/brasao_amor.webp'),
  brasao_luz:           require('../assets/images/brasao_luz.webp'),
  digivice_d2:             require('../assets/images/digivice_d2.webp'),
  digivice_d3:             require('../assets/images/digivice_d3.png'),
  digivice_d_ark:          require('../assets/images/digivice_d_ark.png'),
  digivice_xros_loader:    require('../assets/images/digivice_xros_loader.png'),
  oculos_escuro_fitado:    require('../assets/images/oculos_escuro_fitado.webp'),
  brasao_conhecimento:  require('../assets/images/brasao_conhecimento.webp'),
  brasao_bondade:       require('../assets/images/brasao_bondade.png'),
  brasao_milagre:       require('../assets/images/brasao do milagre.png'),
  brasao_destino:       require('../assets/images/brasão do destino.png'),
  pulseira_ouro:        require('../assets/images/pulseira_ouro.webp'),
  anel_sagrado:         require('../assets/images/anel_sagrado.webp'),
  piece_anel_sagrado:   require('../assets/images/anel_sagrado.webp'),
  piece_agulha:         require('../assets/images/agulha-media.webp'),
  piece_tecido:         require('../assets/images/tecido-arco-iris.webp'),
  piece_linha:          require('../assets/images/linha-arco-iris.webp'),
  piece_coragem:        require('../assets/images/brasao-coragem.webp'),
  piece_brasao_bondade:      require('../assets/images/bondade piece.png'),
  piece_brasao_coragem:      require('../assets/images/coragem piece.png'),
  piece_brasao_esperanca:    require('../assets/images/esperança piece.png'),
  piece_brasao_amizade:      require('../assets/images/amizade piece.png'),
  piece_brasao_confianca:    require('../assets/images/confiança piece.png'),
  piece_brasao_pureza:       require('../assets/images/sinceridade piece.png'),
  piece_brasao_amor:         require('../assets/images/amor piece.png'),
  piece_brasao_luz:          require('../assets/images/luz piece.png'),
  piece_brasao_conhecimento: require('../assets/images/conhecimento.png'),
  piece_brasao_milagre:      require('../assets/images/milagre piece.png'),
  piece_brasao_destino:      require('../assets/images/destino piece.png'),
  piece_digivice_d3:          require('../assets/images/piece_digivice_d3.png'),
  piece_digivice_d_ark:       require('../assets/images/piece_digivice_d_ark.png'),
  piece_digivice_xros_loader: require('../assets/images/piece_digivice_xros_loader.png'),
  piece_battery_green:  require('../assets/images/battery_green.webp'),
  piece_battery_blue:   require('../assets/images/battery_blue.webp'),
  piece_battery_purple: require('../assets/images/battery_purple.webp'),
  piece_battery_gold:   require('../assets/images/battery_gold.webp'),
  blusa_social:     require('../assets/images/blusa_social.webp'),
  bermuda_poliester: require('../assets/images/bermuda_poliester.webp'),
  tenis_corrida:    require('../assets/images/tenis_corrida.webp'),
  gehenna:              require('../assets/images/gehenna.webp'),
  piece_gehenna:        require('../assets/images/gehenna.webp'),
  permissao_real:       require('../assets/images/permissao_real.webp'),
  black_digitron:       require('../assets/images/items/black_digitron.webp'),
  piece_black_digitron: require('../assets/images/items/black_digitron.webp'),
  x_antibody:           require('../assets/images/items/x_antibody.webp'),
  piece_x_antibody:     require('../assets/images/items/x_antibody.webp'),
  piece_golden_ascension_star: require('../assets/images/items/golden_star_fragment.gif'),
};

const DIGIVICE_IMAGES: Record<string, Record<string, any>> = {
  digivice_d2: {
    tamer_tai: require('../assets/images/d_2_orange.png'), tamer_matt: require('../assets/images/d_2_blue.png'),
    tamer_tk: require('../assets/images/d_2_yelow.png'), tamer_kari: require('../assets/images/d_2_pink.png'),
    tamer_sora: require('../assets/images/d_2_red.png'), tamer_mimi: require('../assets/images/d_2_green.png'),
  },
  digivice_d3: {
    tamer_tai: require('../assets/images/d_3_orange.png'), tamer_matt: require('../assets/images/d_3_blue.png'),
    tamer_tk: require('../assets/images/d_3_yelow.png'), tamer_kari: require('../assets/images/d_3_pink.png'),
    tamer_sora: require('../assets/images/d_3_red.png'), tamer_mimi: require('../assets/images/d_3_green.png'),
  },
  digivice_d_ark: {
    tamer_tai: require('../assets/images/d_ark_orange.png'), tamer_matt: require('../assets/images/d_ark_blue.png'),
    tamer_tk: require('../assets/images/yelow.png'), tamer_kari: require('../assets/images/d_ark_pink.png'),
    tamer_sora: require('../assets/images/d_ark_red.png'), tamer_mimi: require('../assets/images/d_ark_green.png'),
  },
  digivice_xros_loader: {
    tamer_tai: require('../assets/images/Xros_Loader_orange.png'), tamer_matt: require('../assets/images/Xros_Loader_blue.png'),
    tamer_tk: require('../assets/images/Xros_Loader_yelow.png'), tamer_kari: require('../assets/images/Xros_Loader_pink.png'),
    tamer_sora: require('../assets/images/Xros_Loader_red.png'), tamer_mimi: require('../assets/images/Xros_Loader_green.png'),
  },
};

export function getEquipItemImage(itemId: string, tamerId?: string | null): any {
  if (tamerId && DIGIVICE_IMAGES[itemId]?.[tamerId]) return DIGIVICE_IMAGES[itemId][tamerId];
  return EQUIP_ITEM_IMAGES[itemId];
}

export default EQUIP_ITEM_IMAGES;
