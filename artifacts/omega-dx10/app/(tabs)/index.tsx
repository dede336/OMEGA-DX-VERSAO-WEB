import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, Modal, FlatList } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { CHARACTERS, ATTRIBUTES, getScaledStats, TAMERS, EQUIPMENT_ITEMS } from '@/constants/gameData';
import { GAME_MAPS } from '@/constants/fases';
import { getEquipItemImage } from '@/constants/equipImages';
import { getItemImageSource } from '@/constants/extendedItems';
import { getCharacter } from '@/constants/digimon';
import { AttributeBadge, ElementBadge, HPBar, CharacterAvatar } from '@/components/GameComponents';
import { pixelStyle } from '@/constants/pixelStyle';
import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/constants/i18n';

const FLAG_IMAGES: Record<Language, any> = {
  pt: require('../../assets/images/flag_pt.webp'),
  en: require('../../assets/images/flag_en.webp'),
  es: require('../../assets/images/flag_es.webp'),
};
const LANG_CYCLE: Language[] = ['pt', 'en', 'es'];

const GEM_ICON_IMG = require('../../assets/images/diamante.gif');

const HOME_THEME: Record<string, { header: any; active: any; base: any; currency: any; accent: string }> = {
  tamer_kari: { header: require('../../assets/images/tema/tela de inicio kari.png'), active: require('../../assets/images/tema/tela digimon ativo kari.png'), base: require('../../assets/images/tema/base digimon ativo kari.png'), currency: require('../../assets/images/tema/imagem fundo botão sari-trocar senha kari.png'), accent: '#fa60ba' },
  tamer_matt: { header: require('../../assets/images/tema/tela de inicio matt.png'), active: require('../../assets/images/tema/tela digimon ativo matt.png'), base: require('../../assets/images/tema/base digimon ativo matt.png'), currency: require('../../assets/images/tema/imagem fundo botão sari-trocar senha matt.png'), accent: '#54dbe6' },
  tamer_mimi: { header: require('../../assets/images/tema/tela de inicio mimi.png'), active: require('../../assets/images/tema/tela digimon ativo mimi.png'), base: require('../../assets/images/tema/base digimon ativo mimi.png'), currency: require('../../assets/images/tema/imagem fundo botão sari-trocar senha mimi.png'), accent: '#a6e8bb' },
  tamer_sora: { header: require('../../assets/images/tema/tela de inicio sora.png'), active: require('../../assets/images/tema/tela digimon ativo sora.png'), base: require('../../assets/images/tema/base digimon ativo sora.png'), currency: require('../../assets/images/tema/imagem fundo botão sari-trocar senha sora.png'), accent: '#fc605c' },
  tamer_tai: { header: require('../../assets/images/tema/tela de inicio tai.png'), active: require('../../assets/images/tema/tela digimon ativo tai.png'), base: require('../../assets/images/tema/base digimon ativo tai.png'), currency: require('../../assets/images/tema/imagem fundo botão sari-trocar senha tai.png'), accent: '#fe751d' },
  tamer_tk: { header: require('../../assets/images/tema/tela de inicio tk.png'), active: require('../../assets/images/tema/tela digimon ativo tk.png'), base: require('../../assets/images/tema/base digimon ativo tk.png'), currency: require('../../assets/images/tema/imagem fundo botão sari-trocar senha tk.png'), accent: '#f4d65d' },
};

const ELEMENT_GIFS: Record<string, any> = {
  FIRE:      require('../../assets/images/fire_status.webp'),
  WATER:     require('../../assets/images/water_status.webp'),
  ICE:       require('../../assets/images/ice_status.webp'),
  WIND:      require('../../assets/images/wind_status.webp'),
  PLANT:     require('../../assets/images/plant_status.webp'),
  LIGHT:     require('../../assets/images/light_status.webp'),
  DARK:      require('../../assets/images/dark_status.webp'),
  LIGHTNING: require('../../assets/images/thunder_status.webp'),
  EARTH:     require('../../assets/images/earth_status.webp'),
};

const SPECIAL_GIFS: Record<string, any> = {
  omegamon:              require('../../assets/images/omegamon_digivolve.webp'),
  shineGreymonBurstMode: require('../../assets/images/characters/shinegreymonbm_special.webp'),
  rosemonBurstMode:      require('../../assets/images/characters/rosemonBurstMode_status.webp'),
  imperialDramonPM:      require('../../assets/images/characters/imperialDramonPM_status.webp'),
};

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  function cycleLanguage() {
    const idx = LANG_CYCLE.indexOf(language);
    const next = LANG_CYCLE[(idx + 1) % LANG_CYCLE.length];
    setLanguage(next);
  }
  const { selectedCharacter, collection, clearedStages, playerName, totalPlayerLevel, bits, gemas, tamerId, setSelectedCharacter, setTamerId, equippedItems, pvpCrest, pvpDigivice } = game;

  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [tamerPickerVisible, setTamerPickerVisible] = useState(false);
  const isAdmin = user?.isAdmin ?? false;

  const totalStages = GAME_MAPS.reduce((s, m) => s + m.stages.length, 0);
  const clearedCount = Object.keys(clearedStages).length;

  const char = selectedCharacter ? (getCharacter(selectedCharacter.characterId) ?? CHARACTERS[selectedCharacter.characterId] ?? null) : null;
  const scaled = char && selectedCharacter ? getScaledStats(char.baseStats, selectedCharacter.level) : null;
  const attrData = char ? ATTRIBUTES[char.attribute] : null;

  const tamer = tamerId ? TAMERS.find((t) => t.id === tamerId) : null;
  const homeTheme = HOME_THEME[tamerId ?? ''] ?? HOME_THEME.tamer_tai;
  // Home shows the player's current Crest and Digivice.
  // Normal equipment is authoritative; PvP registration is a compatibility fallback
  // for saves where these two selections were already persisted there.
  const equippedCrestId = equippedItems.brasao ?? pvpCrest ?? null;
  const equippedDigiviceId = equippedItems.digivice ?? pvpDigivice ?? null;

  const resolveHomeEquipImage = (itemId: string | null, slot: 'brasao' | 'digivice') => {
    if (!itemId) return null;
    const candidates = slot === 'brasao'
      ? [itemId, itemId.replace(/^piece_/, ''), itemId.replace(/^crest_/, 'brasao_')]
      : [itemId, itemId.replace(/^piece_/, ''), itemId.replace(/^digivice-/, 'digivice_')];

    for (const id of candidates) {
      const staticImage = getEquipItemImage(id, tamerId);
      if (staticImage) return staticImage;
      const customImage = getItemImageSource(id);
      if (customImage) return customImage;
    }
    return null;
  };

  const equippedCrestImage = resolveHomeEquipImage(equippedCrestId, 'brasao');
  const equippedDigiviceImage = resolveHomeEquipImage(equippedDigiviceId, 'digivice');

  const botPad = Platform.OS === 'web' ? 20 : insets.bottom + 20;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: 'transparent' }]}
      contentContainerStyle={{ paddingBottom: botPad }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.body, { marginTop: insets.top + 24 }]}>
        {/* Tamer information at the top of the home screen. */}
        <View style={styles.heroBanner}>
        {/* Tamer portrait */}
        <TouchableOpacity
          style={styles.tamerPortrait}
          onPress={() => isAdmin && setTamerPickerVisible(true)}
          activeOpacity={isAdmin ? 0.7 : 1}
        >
          {tamer ? (
            <Image
              source={tamer.image}
              style={styles.tamerPortraitImg}
              resizeMode="contain"
            />
          ) : (
            <Feather name="user" size={36} color={colors.primary} />
          )}
          {isAdmin && (
            <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#000a', borderRadius: 8, padding: 2 }}>
              <Feather name="edit-2" size={10} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        {/* Welcome text */}
        <View style={styles.heroText}>
          <Text style={[styles.heroGreeting, { color: colors.primary }]}>{t('home.welcome')}</Text>
          <Text style={[styles.heroName, { color: colors.foreground }]} numberOfLines={1}>{playerName}</Text>
          {tamer && (
            <Text style={[styles.heroTamer, { color: colors.primary + 'cc' }]}>{tamer.fullName}</Text>
          )}
          {(equippedCrestImage || equippedDigiviceImage) && (
            <View style={styles.heroEquipmentCompact}>
              {equippedCrestImage && (
                <View style={styles.heroEquipmentCompactItem}>
                  <Image source={equippedCrestImage} style={styles.heroEquipmentCompactImage} resizeMode="contain" />
                </View>
              )}
              {equippedDigiviceImage && (
                <View style={styles.heroEquipmentCompactItem}>
                  <Image source={equippedDigiviceImage} style={styles.heroEquipmentCompactImage} resizeMode="contain" />
                </View>
              )}
            </View>
          )}

        </View>

        {/* Rank badge + account + language */}
        <View style={styles.heroBadges}>
          <View style={[styles.rankBadge, { backgroundColor: colors.primary, }, pixelStyle]}>
            <Text style={[styles.rankBadgeLabel, { color: colors.primaryForeground }]}>RANK</Text>
            <Text style={[styles.rankBadgeNum, { color: colors.primaryForeground }]}>{totalPlayerLevel}</Text>
          </View>
          {user ? (
            <View style={[styles.userBadge, { backgroundColor: '#22c55e22', borderColor: '#22c55e55' }, pixelStyle]}>
              <Feather name="user-check" size={11} color="#22c55e" />
              <Text style={[styles.userBadgeText, { color: '#22c55e' }]} numberOfLines={1}>{user.username}</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/login')}
              style={[styles.userBadge, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}
            >
              <Feather name="log-in" size={11} color={colors.mutedForeground} />
              <Text style={[styles.userBadgeText, { color: colors.mutedForeground }]}>{t('home.signin')}</Text>
            </TouchableOpacity>
          )}
          {/* Language toggle flag */}
          <TouchableOpacity onPress={cycleLanguage} style={styles.langFlag} activeOpacity={0.75}>
            <Image source={FLAG_IMAGES[language]} style={styles.langFlagImg} resizeMode="cover" />
          </TouchableOpacity>
        </View>
      </View>

      </View>

      <View style={styles.topPanel}>
        <Image source={homeTheme.header} style={styles.themeFrame} resizeMode="contain" />
      </View>

      {/* ── Stats strip ── */}
      <View style={styles.statsStrip}>
        <Image source={homeTheme.currency} style={styles.themeFrame} resizeMode="stretch" />
        <View style={styles.statItem}>
          <Image source={require('../../assets/images/digimon-icon.webp')} style={styles.statIcon} resizeMode="contain" />
          <Text style={[styles.statNum, { color: colors.foreground }]}>{collection.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t('home.stat.digimons')}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Image source={require('../../assets/images/bits-icon.gif')} style={styles.statIcon} resizeMode="contain" />
          <Text style={[styles.statNum, { color: '#facc15' }]}>{bits >= 1000 ? `${(bits / 1000).toFixed(1)}k` : bits}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t('home.stat.bits')}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Image source={GEM_ICON_IMG} style={styles.statIcon} resizeMode="contain" />
          <Text style={[styles.statNum, { color: '#22d3ee' }]}>{gemas >= 1000 ? `${(gemas / 1000).toFixed(1)}k` : gemas}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t('home.stat.gems')}</Text>
        </View>
      </View>

      <View style={styles.body}>
        {/* ── Active Digimon ── */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('home.activeDigimon')}</Text>
        {char && scaled && selectedCharacter && attrData ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setSwapModalVisible(true)}
            style={styles.activeCard}
          >
            {/* top colored strip */}
            <View style={styles.activeStrip}>
              {(() => {
                const bgSrc = SPECIAL_GIFS[char.id] ?? ELEMENT_GIFS[char.element] ?? null;
                return (
                  <>
                    {bgSrc && (
                      <ExpoImage
                        source={bgSrc}
                        style={[StyleSheet.absoluteFillObject, styles.activeBackgroundGeometry, styles.activeStripGif]}
                        contentFit="cover"
                        autoplay
                      />
                    )}
                    <View style={[styles.activeStripShade, styles.activeBackgroundGeometry]} pointerEvents="none" />
                    <View style={styles.activeDigimonStage}>
                      <Image source={homeTheme.base} style={styles.activeBase} resizeMode="contain" />
                      <View style={styles.activeDigimonPosition}>
                        <CharacterAvatar characterId={char.id} size={72} />
                      </View>
                    </View>
                  </>
                );
              })()}
              <View style={styles.activeInfo}>
                <Text style={[styles.activeName, { color: colors.foreground }]}>{char.name}</Text>
                <View style={styles.activeBadges}>
                  <AttributeBadge attr={char.attribute} />
                  <View style={{ width: 6 }} />
                  <ElementBadge elem={char.element} />
                </View>
                <Text style={[styles.activeLevel, { color: colors.primary }]}>{t('common.level')} {selectedCharacter.level}</Text>
              </View>
            </View>

            {/* HP */}
            <View style={styles.hpRow}>
              <HPBar current={scaled.hp} max={scaled.hp} color={homeTheme.accent} />
            </View>

            {/* Stat grid */}
            <View style={styles.statGrid}>
              {[
                { k: 'ATK', v: scaled.atk, c: '#ef4444' },
                { k: 'DEF', v: scaled.def, c: '#3b82f6' },
                { k: 'SPT', v: scaled.spt, c: '#a855f7' },
                { k: 'SPD', v: scaled.spd, c: '#facc15' },
                { k: 'MP',  v: scaled.mp,  c: '#00d4ff' },
              ].map((s) => (
                <View key={s.k} style={[styles.miniStat, { backgroundColor: s.c + '11', borderColor: s.c + '44' }, pixelStyle]}>
                  <Text style={[styles.miniStatLabel, { color: colors.mutedForeground }]}>{s.k}</Text>
                  <Text style={[styles.miniStatValue, { color: s.c }]}>{s.v}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.themeFrame, styles.activeFrameFront]} pointerEvents="none">
              <Image source={homeTheme.active} style={styles.fullFrameImage} resizeMode="stretch" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/collection')}
            style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}
          >
            <Feather name="plus-circle" size={32} color={colors.primary} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t('home.tapToSelect')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Swap Modal ── */}
      <Modal
        visible={swapModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSwapModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border }, pixelStyle]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('home.chooseActive')}</Text>
              <TouchableOpacity onPress={() => setSwapModalVisible(false)}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={collection}
              keyExtractor={(item) => item.ownedId}
              contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
              renderItem={({ item }) => {
                const c = getCharacter(item.characterId) ?? CHARACTERS[item.characterId];
                if (!c) return null;
                const isActive = item.ownedId === selectedCharacter?.ownedId;
                const attr = ATTRIBUTES[c.attribute] ?? { color: '#6b7280' };
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => { setSelectedCharacter(item.ownedId); setSwapModalVisible(false); }}
                    style={[
                      styles.swapRow,
                      { borderBottomColor: colors.border },
                      isActive && { backgroundColor: colors.primary + '14' },
                    ]}
                  >
                    <View style={[styles.swapAvatarWrap, { borderColor: isActive ? colors.primary : attr.color + '66' }]}>
                      <CharacterAvatar characterId={c.id} size={44} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.swapName, { color: colors.foreground }]} numberOfLines={1}>{c.name}</Text>
                      <Text style={[styles.swapLevel, { color: colors.mutedForeground }]}>{t('common.level')} {item.level}</Text>
                    </View>
                    <AttributeBadge attr={c.attribute} />
                    {isActive && (
                      <View style={[styles.activePill, { backgroundColor: colors.primary }, pixelStyle]}>
                        <Text style={[styles.activePillText, { color: colors.primaryForeground }]}>{t('home.active')}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ── Admin: Tamer picker modal ── */}
      <Modal
        visible={tamerPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTamerPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>🎮 TROCAR TAMER (ADMIN)</Text>
              <TouchableOpacity onPress={() => setTamerPickerVisible(false)}>
                <Feather name="x" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={TAMERS}
              keyExtractor={(t) => t.id}
              renderItem={({ item: t }) => {
                const isCurrent = t.id === tamerId;
                return (
                  <TouchableOpacity
                    style={[
                      styles.swapRow,
                      { borderBottomColor: colors.border },
                      isCurrent && { backgroundColor: t.accentColor + '22' },
                    ]}
                    onPress={() => { setTamerId(t.id); setTamerPickerVisible(false); }}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.swapAvatarWrap, { borderColor: t.accentColor, width: 48, height: 60, overflow: 'hidden' }]}>
                      <Image source={t.image} style={{ width: 48, height: 60 }} resizeMode="contain" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.swapName, { color: isCurrent ? t.accentColor : colors.foreground }]}>
                        {t.fullName}
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.mutedForeground }}>{t.description}</Text>
                    </View>
                    {isCurrent && <Feather name="check-circle" size={18} color={t.accentColor} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topPanel: { marginHorizontal: 14, aspectRatio: 1080 / 660, minHeight: 190, overflow: 'hidden' },
  themeFrame: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  fullFrameImage: { width: '100%', height: '100%' },

  // Hero
  heroBanner: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 12, borderRadius: 10, backgroundColor: '#081625bb' },
  tamerPortrait: { width: 50, height: 100 },
  tamerPortraitImg: { width: '100%' as unknown as number, height: '100%' as unknown as number },
  heroText: { flex: 1 },
  heroGreeting: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.5 },
  heroName: { fontSize: Platform.select({ web: 13, default: 15 }), fontWeight: '900' as const, marginTop: 1 },
  heroTamer: { fontSize: 10, fontWeight: '500' as const, marginTop: 1 },
  heroEquipmentCompact:{flexDirection:'row',alignItems:'center',gap:7,marginTop:3},
  heroEquipmentCompactItem:{alignItems:'center',justifyContent:'center',width:34,height:34,borderRadius:4,backgroundColor:'#081625aa'},
  heroEquipmentCompactImage:{width:28,height:28,borderWidth:0,backgroundColor:'transparent'},
  heroEquipmentCompactLabel:{color:'#fff',fontSize:4,fontWeight:'900',marginTop:1},
  homeEquipmentBar:{marginHorizontal:16,marginTop:10,borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:8,flexDirection:'row',alignItems:'center'},
  homeEquipmentBarItem:{flex:1,minWidth:0,flexDirection:'row',alignItems:'center',gap:7},
  homeEquipmentBarImage:{width:36,height:36},
  homeEquipmentBarText:{flex:1,minWidth:0},
  homeEquipmentBarLabel:{fontSize:6,fontWeight:'900'},
  homeEquipmentBarValue:{fontSize:6,fontWeight:'800',marginTop:2},
  homeEquipmentBarDivider:{width:1,height:38,marginHorizontal:8},
  homeEquipmentOverlay:{position:'absolute',left:170,bottom:4,flexDirection:'row',alignItems:'flex-end',gap:8,zIndex:50,elevation:50},
  homeEquipmentSlot:{width:50,minHeight:54,alignItems:'center',justifyContent:'flex-end',backgroundColor:'#00000066',borderWidth:1,borderColor:'#ffffff33',borderRadius:8,padding:3},
  homeEquipmentImage:{width:38,height:38},
  homeEquipmentLabel:{color:'#fff',fontSize:5,fontWeight:'900',marginTop:1},
  heroEquipmentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5, minHeight: 32, maxWidth: 220 },
  heroEquipmentItem: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffffff33', backgroundColor: '#00000044', borderRadius: 7, padding: 3 },
  heroEquipmentImage: { width: 32, height: 32 },
  heroBadges: { alignItems: 'flex-end', gap: 6 },
  rankBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center', minWidth: 46 },
  rankBadgeLabel: { fontSize: 8, fontWeight: '700' as const, letterSpacing: 1 },
  rankBadgeNum: { fontSize: Platform.select({ web: 13, default: 15 }), fontWeight: '900' as const, lineHeight: Platform.select({ web: 15, default: 17 }) },
  userBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, maxWidth: 100 },
  userBadgeText: { fontSize: 10, fontWeight: '700' as const, flexShrink: 1 },
  langFlag: { width: 28, height: 20, borderRadius: 3, overflow: 'hidden' as const, borderWidth: 1, borderColor: '#ffffff22' },
  langFlagImg: { width: 28, height: 20 },

  // Stats strip
  statsStrip: { flexDirection: 'row', marginHorizontal: 20, marginTop: 18, marginBottom: 20, padding: 5 },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: 1, marginVertical: 4 },
  statIcon: { width: 22, height: 22 },
  statNum: { fontSize: Platform.select({ web: 12, default: 13 }), fontWeight: '800' as const },
  statLabel: { fontSize: 9 },

  body: { paddingHorizontal: 16 },

  // Quick actions
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', gap: 10, marginTop: 16, marginBottom: 22 },
  actionBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', gap: 6 },
  actionIcon: { width: 44, height: 44 },
  actionLabel: { fontSize: 12, fontWeight: '700' as const },

  sectionTitle: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' as const },

  // Active card
  activeCard: { overflow: 'hidden' as const, marginBottom: 20, minHeight: 225, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 17 },
  activeStrip: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 10, minHeight: 110, overflow: 'visible', backgroundColor: '#080d19', zIndex: 0 },
  activeStripShade: { ...StyleSheet.absoluteFillObject, backgroundColor: '#05091755' },
  activeDigimonStage: { width: 112, height: 110, alignItems: 'center', justifyContent: 'flex-end' },
  activeBase: { position: 'absolute', bottom: 6, width: 108, height: 46 },
  activeDigimonPosition: { position: 'absolute', bottom: 21, alignSelf: 'center', zIndex: 1 },
  activeBackgroundGeometry: { transform: [{ translateY: -5 }, { scale: 1.1 }] },
  activeStripGif: { opacity: 0.95, zIndex: 0 },
  activeFrameFront: { zIndex: 10 },
  activeStripGifNative: { opacity: 0.55 },
  activeAvatarRing: { borderRadius: 40, borderWidth: 2, padding: 2 },
  activeInfo: { flex: 1 },
  activeName: { fontSize: Platform.select({ web: 13, default: 15 }), fontWeight: '800' as const, marginBottom: 5 },
  activeBadges: { flexDirection: 'row', marginBottom: 5 },
  activeLevel: { fontSize: 13, fontWeight: '700' as const },
  hpRow: { paddingHorizontal: 0, paddingBottom: 8 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: 5, paddingHorizontal: 9, paddingTop: 0 },
  miniStat: { flex: 1, minWidth: '30%' as any, borderRadius: 4, borderWidth: 1, padding: 5, alignItems: 'center' },
  miniStatLabel: { fontSize: 10, fontWeight: '600' as const },
  miniStatValue: { fontSize: Platform.select({ web: 12, default: 13 }), fontWeight: '800' as const },

  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 40, alignItems: 'center', gap: 12, marginBottom: 20 },
  emptyText: { fontSize: 13, textAlign: 'center' as const },

  // Swap modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000088' },
  modalSheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1 },
  modalTitle: { fontSize: 13, fontWeight: '800' as const, letterSpacing: 0.5 },
  swapRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  swapAvatarWrap: { borderRadius: 26, borderWidth: 2, padding: 2, overflow: 'hidden' as const },
  swapName: { fontSize: 12, fontWeight: '700' as const },
  swapLevel: { fontSize: 12, marginTop: 2 },
  activePill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 6 },
  activePillText: { fontSize: 10, fontWeight: '800' as const },
});
