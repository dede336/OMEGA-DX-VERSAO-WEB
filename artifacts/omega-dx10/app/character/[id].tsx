import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Modal, Pressable, Animated, Image, Easing,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';

const BATTERY_IMG_GREEN  = require('../../assets/images/battery_green.webp');
const BATTERY_IMG_BLUE   = require('../../assets/images/battery_blue.webp');
const BATTERY_IMG_PURPLE = require('../../assets/images/battery_purple.webp');
const BATTERY_IMG_GOLD   = require('../../assets/images/battery_gold.webp');

const XP_BATTERIES = [
  { id: 'piece_battery_green',  colorKey: 'battery.verde',   xp: 200,  color: '#22c55e', img: BATTERY_IMG_GREEN  },
  { id: 'piece_battery_blue',   colorKey: 'battery.azul',    xp: 400,  color: '#3b82f6', img: BATTERY_IMG_BLUE   },
  { id: 'piece_battery_purple', colorKey: 'battery.roxa',    xp: 800,  color: '#a855f7', img: BATTERY_IMG_PURPLE },
  { id: 'piece_battery_gold',   colorKey: 'battery.dourada', xp: 1600, color: '#f59e0b', img: BATTERY_IMG_GOLD   },
];
import {
  CHARACTERS, ATTRIBUTES, ELEMENTS,
  RARITY_COLORS,
  getScaledStats, expToNextLevel,
  FUSIONS, ITEM_NAMES,
} from '@/constants/gameData';
import { getCharacter, getCharacterImageSource, hasDivineGiftPassive } from '@/constants/extendedCharacters';
import { AttributeBadge, ElementBadge, StatBar, CharacterAvatar } from '@/components/GameComponents';
import { pixelStyle } from '@/constants/pixelStyle';
import BatteryQuantityPicker from '@/components/BatteryQuantityPicker';
import { AscensionStars } from '@/components/AscensionStars';
import { applyAscensionBonus, getAscensionStars } from '@/utils/ascension';

const DIGIVO_GIF             = require('../../assets/images/digivolution.webp');
const FUSION_GIF             = require('../../assets/images/fusion_crimson.webp');
const FUSION_RAINBOW_CORE    = require('../../assets/images/fusion_rainbow_core.png');
const OMEGAMON_GIF              = require('../../assets/images/omegamon_digivolve.webp');
const OMEGAMON_FUSION_INTRO     = require('../../assets/images/omegamon_fusion_intro.webp');
const SHINEGREYMON_BM_GIF       = require('../../assets/images/digimons/shinegreymonbm.gif');
const ROSEMON_BM_GIF            = require('../../assets/images/digimons/Rosemon_BM.gif');
const IMPERIALDRAMON_PM_GIF     = require('../../assets/images/digimons/imperialDramonPM.gif');
const LIGHT_STATUS_GIF          = require('../../assets/images/light_status.webp');
const DARK_STATUS_GIF           = require('../../assets/images/dark_status.webp');
const FIRE_STATUS_GIF           = require('../../assets/images/fire_status.webp');
const PLANT_STATUS_GIF          = require('../../assets/images/plant_status.webp');
const WIND_STATUS_GIF           = require('../../assets/images/wind_status.webp');
const WATER_STATUS_GIF          = require('../../assets/images/water_status.webp');
const ICE_STATUS_GIF            = require('../../assets/images/ice_status.webp');

const ELEMENT_STATUS_GIFS: Record<string, any> = {
  LIGHT:     LIGHT_STATUS_GIF,
  DARK:      DARK_STATUS_GIF,
  FIRE:      FIRE_STATUS_GIF,
  PLANT:     PLANT_STATUS_GIF,
  WIND:      WIND_STATUS_GIF,
  WATER:     WATER_STATUS_GIF,
  ICE:       ICE_STATUS_GIF,
  LIGHTNING: require('../../assets/images/thunder_status.webp'),
};

type FusePhase = 'playing' | 'color' | 'reveal' | 'done';

interface DadivaInfo {
  descKey: string;
  condKey?: string;
}

function getDadivaDivinaInfo(charId: string, charName: string): DadivaInfo | null {
  const n = charName.toLowerCase();
  if (n === 'magnamon' || n === 'craniummon' || n === 'gallantmon')
    return { descKey: 'dadiva.def_team' };
  if (n === 'ulforceveedramon')
    return { descKey: 'dadiva.spd_team' };
  if (n === 'examon' || n === 'omegamon' || n === 'leopardmon' || n === 'duftmon' || n === 'dynasmon')
    return { descKey: 'dadiva.atk_team' };
  if (n === 'jesmon' || n === 'gankoomon')
    return { descKey: 'dadiva.atk_def_team' };
  if (n === 'alphamon')
    return { descKey: 'dadiva.heal_ally' };
  if (n === 'crusadermon')
    return { descKey: 'dadiva.atk_15', condKey: 'dadiva.atk_15_cond' };
  if (n === 'imperialdramonpm' || n === 'imperialdramon pm')
    return { descKey: 'dadiva.atk_10_spd_5', condKey: 'dadiva.atk_10_spd_5_cond' };
  if (n === 'lucemonsatanmode' || n === 'lucemon satan mode' || n === 'armageddemon' || n === 'apocalymon')
    return { descKey: 'dadiva.dot' };
  if (hasDivineGiftPassive(charId))
    return { descKey: 'dadiva.heal_team' };
  return null;
}

export default function CharacterDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { collection, inventory, selectedCharacter, setSelectedCharacter, fuseDigimon, pieces, useXpItem } = useGame();

  const [confirmFuseVisible, setConfirmFuseVisible] = useState(false);
  const [fuseSacrificeId, setFuseSacrificeId] = useState<string | null>(null);
  const [selectedFusionResultId, setSelectedFusionResultId] = useState<string | null>(null);
  const [partnerPickerVisible, setPartnerPickerVisible] = useState(false);
  const [fusionItemPickerVisible, setFusionItemPickerVisible] = useState(false);
  const [selectedFusionItemId, setSelectedFusionItemId] = useState<string | null>(null);

  const [xpModalVisible, setXpModalVisible] = useState(false);
  const [selectedBattery, setSelectedBattery] = useState<string>('piece_battery_green');
  const [batteryQty, setBatteryQty] = useState(1);

  // ── Fusion animation ────────────────────────────────────────────────────────
  const [fuseAnim, setFuseAnim] = useState<{ fromCharId: string; partnerCharId: string; toCharId: string } | null>(null);
  const [fusePhase, setFusePhase] = useState<FusePhase>('playing');
  const fusionCoreOpacity = useRef(new Animated.Value(0)).current;
  const fusionCoreScale = useRef(new Animated.Value(0.72)).current;
  const fusionCoreRotation = useRef(new Animated.Value(0)).current;
  const leftPosition = useRef(new Animated.Value(-170)).current;
  const rightPosition = useRef(new Animated.Value(170)).current;
  const fusionPairOpacity = useRef(new Animated.Value(1)).current;
  const newFormOpacity = useRef(new Animated.Value(0)).current;
  const titleScale    = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (!fuseAnim) return;
    if (fusePhase === 'playing') {
      // Os dois Digimons brancos vêm das laterais e se unem no centro.
      Animated.sequence([
        Animated.delay(450),
        Animated.parallel([
          Animated.timing(leftPosition, { toValue: 0, duration: 2200, useNativeDriver: true }),
          Animated.timing(rightPosition, { toValue: 0, duration: 2200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(fusionPairOpacity, { toValue: 0, duration: 420, useNativeDriver: true }),
          Animated.timing(fusionCoreOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.spring(fusionCoreScale, { toValue: 1, friction: 6, tension: 42, useNativeDriver: true }),
        ]),
      ]).start(() => setFusePhase('color'));
    }
    if (fusePhase === 'color') {
      // O núcleo da fusão gira e pulsa devagar; ao desaparecer, revela o resultado.
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fusionCoreRotation, {
            toValue: 1,
            duration: 2400,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(fusionCoreScale, { toValue: 1.08, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(fusionCoreScale, { toValue: 0.94, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(fusionCoreScale, { toValue: 1.08, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(fusionCoreScale, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ]),
        ]),
        Animated.timing(fusionCoreOpacity, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]).start(() => setFusePhase('reveal'));
    }
    if (fusePhase === 'reveal') {
      Animated.parallel([
        Animated.timing(newFormOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(titleScale,     { toValue: 1, useNativeDriver: true, friction: 5 }),
      ]).start(() => setFusePhase('done'));
    }
  }, [fuseAnim, fusePhase, fusionCoreOpacity, fusionCoreScale, fusionCoreRotation, leftPosition, rightPosition, fusionPairOpacity, newFormOpacity, titleScale]);

  const owned = collection.find((c) => c.ownedId === id);
  const char  = owned ? (getCharacter(owned.characterId) ?? null) : null;

  if (!owned || !char) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>{t('char.notFound')}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, textAlign: 'center' }}>{t('char.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scaled   = getScaledStats(applyAscensionBonus(char.baseStats, owned.ascensionStars ?? 0), owned.level);
  const isMaxLevel = owned.level >= 100;
  const expNeeded = isMaxLevel ? 1 : expToNextLevel(owned.level);
  const expPct   = isMaxLevel ? 1 : Math.min(1, owned.exp / expNeeded);
  const rarityColor = RARITY_COLORS[char.rarity];
  const attrData = ATTRIBUTES[char.attribute];
  const elemData = ELEMENTS[char.element];
  const isSelected = selectedCharacter?.ownedId === owned.ownedId;

  const topPad = insets.top;

  // ── Dádiva Divina info ───────────────────────────────────────────────────────
  const dadivaInfo = getDadivaDivinaInfo(char.id, char.name);

  // ── Fusion info ─────────────────────────────────────────────────────────────
  const fusionRecipes = FUSIONS[owned.characterId] ?? [];
  const fusionRecipe =
    fusionRecipes.find((recipe) => recipe.resultId === selectedFusionResultId) ??
    fusionRecipes.find((recipe) => {
      const required = recipe.partners ?? (recipe.partner ? [recipe.partner] : []);
      return required.every((partnerId) =>
        collection.some((copy) => copy.ownedId !== owned.ownedId && copy.characterId === partnerId)
      );
    }) ??
    fusionRecipes[0] ??
    null;

  const requiredPartnerIds = fusionRecipe
    ? (fusionRecipe.partners ?? (fusionRecipe.partner ? [fusionRecipe.partner] : []))
    : [];
  const selectedFusionSacrifice = fuseSacrificeId
    ? collection.find((copy) => copy.ownedId === fuseSacrificeId) ?? null
    : null;
  const allPartnerCopies = fusionRecipe?.partner
    ? collection.filter((copy) => copy.ownedId !== owned.ownedId && copy.characterId === fusionRecipe.partner)
    : [];
  const selectedMultiSacrifices = fusionRecipe?.partners
    ? fusionRecipe.partners.map((partnerId) =>
        collection.find((copy) => copy.ownedId !== owned.ownedId && copy.characterId === partnerId)
      ).filter(Boolean) as typeof collection
    : [];
  const resultChar = fusionRecipe ? (getCharacter(fusionRecipe.resultId) ?? null) : null;
  const partnerChar = fusionRecipe?.partner ? (getCharacter(fusionRecipe.partner) ?? null) : null;
  const partnerOwned = selectedFusionSacrifice ?? allPartnerCopies[0] ?? null;
  const meetsLevel = !!(fusionRecipe && owned.level >= fusionRecipe.requiredLevel);
  const hasAllPartners = !!fusionRecipe && (
    fusionRecipe.partners
      ? selectedMultiSacrifices.length === fusionRecipe.partners.length
      : !!partnerOwned
  );
  const hasFusionRequiredItem = !!fusionRecipe && (!fusionRecipe.requiredItem || inventory.includes(fusionRecipe.requiredItem));
  const canFuse = !!(fusionRecipe && meetsLevel && hasAllPartners && hasFusionRequiredItem);

  function startFusionAnimation(recipe: NonNullable<typeof fusionRecipe>) {
    newFormOpacity.setValue(0);
    titleScale.setValue(0.7);
    fusionCoreOpacity.setValue(0);
    fusionCoreScale.setValue(0.72);
    fusionCoreRotation.setValue(0);
    leftPosition.setValue(-170);
    rightPosition.setValue(170);
    fusionPairOpacity.setValue(1);
    setFusePhase('playing');
    const animationPartner = recipe.partner ?? recipe.partners?.[0] ?? owned.characterId;
    setFuseAnim({ fromCharId: owned.characterId, partnerCharId: animationPartner, toCharId: recipe.resultId });
  }

  function handleFusePress() {
    if (!fusionRecipe || !canFuse) return;
    setSelectedFusionResultId(fusionRecipe.resultId);

    if (fusionRecipe.partners?.length) {
      if (fusionRecipe.requiredItem) {
        setFusionItemPickerVisible(true);
      } else {
        setConfirmFuseVisible(true);
      }
      return;
    }
    if (allPartnerCopies.length === 1) {
      setFuseSacrificeId(allPartnerCopies[0].ownedId);
      if (fusionRecipe.requiredItem) setFusionItemPickerVisible(true);
      else setConfirmFuseVisible(true);
    } else if (allPartnerCopies.length > 1) {
      setPartnerPickerVisible(true);
    }
  }

  function handleFuseConfirm() {
    if (!fusionRecipe || !owned) return;

    const sacrificeIds = fusionRecipe.partners?.length
      ? selectedMultiSacrifices.map((copy) => copy.ownedId)
      : (fuseSacrificeId ? [fuseSacrificeId] : []);

    if (sacrificeIds.length !== requiredPartnerIds.length) return;
    setConfirmFuseVisible(false);
    if (fusionRecipe.requiredItem && selectedFusionItemId !== fusionRecipe.requiredItem) return;
    const fused = fuseDigimon(owned.ownedId, sacrificeIds, fusionRecipe.resultId, selectedFusionItemId ?? undefined);
    if (!fused) return;
    startFusionAnimation(fusionRecipe);
  }

  // ── Element background pulse ────────────────────────────────────────────────
  const elemPulse = useRef(new Animated.Value(0.08)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(elemPulse, { toValue: 0.22, duration: 2200, useNativeDriver: true }),
        Animated.timing(elemPulse, { toValue: 0.08, duration: 2200, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [elemPulse]);

  // GIF to show: intro during 'playing', reveal GIF during 'reveal'/'done'
  const animGif =
    fusePhase === 'playing' || fusePhase === 'color'
      ? (fuseAnim?.toCharId === 'omegamon' ? OMEGAMON_FUSION_INTRO : FUSION_GIF)
      : (fuseAnim?.toCharId === 'omegamon' ? OMEGAMON_GIF           : FUSION_GIF);
  const fuseToChar   = fuseAnim ? (getCharacter(fuseAnim.toCharId) ?? null) : null;
  const fuseFromChar = fuseAnim ? (getCharacter(fuseAnim.fromCharId) ?? null) : null;
  const fuseFromImage = fuseAnim ? getCharacterImageSource(fuseAnim.fromCharId) : null;
  const fusePartnerImage = fuseAnim ? getCharacterImageSource(fuseAnim.partnerCharId) : null;
  const fusionCoreRotate = fusionCoreRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const isOmegamon           = char.id === 'omegamon';
  const isShineGreymonBM     = char.id === 'shineGreymonBurstMode';
  const isRoseMonBM          = char.id === 'rosemonBurstMode';
  const isImperialDramonPM   = char.id === 'imperialDramonPM';
  const specialGif           = isOmegamon ? OMEGAMON_GIF
    : isShineGreymonBM   ? SHINEGREYMON_BM_GIF
    : isRoseMonBM        ? ROSEMON_BM_GIF
    : isImperialDramonPM ? IMPERIALDRAMON_PM_GIF
    : null;
  const elementGif = ELEMENT_STATUS_GIFS[char.element] ?? null;
  const bgGif      = specialGif ?? elementGif;

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {bgGif ? (
          <ExpoImage
            source={bgGif}
            style={styles.omegamonBgGif}
            contentFit="cover"
          />
        ) : (
          <>
            <Animated.View style={[styles.elemBgOverlay, { backgroundColor: elemData.color, opacity: elemPulse }]} />
            <Text style={[styles.elemBgLabel, { color: elemData.color }]}>{elemData.label.toUpperCase()}</Text>
          </>
        )}
      <ScrollView
        style={[styles.scrollView, styles.scrollTransparent]}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)' as never);
          }}
          style={[styles.backBtn, pixelStyle]}
        >
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </TouchableOpacity>

        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: elemData.color + '66' }, pixelStyle]}>
          <View style={[styles.heroStrip, { backgroundColor: elemData.color + '18' }]}>
            {bgGif ? (
              <ExpoImage
                source={bgGif}
                style={styles.heroStripGif}
                contentFit="cover"
              />
            ) : (
              <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: elemData.color, opacity: elemPulse }]} />
            )}
            <CharacterAvatar characterId={char.id} size={90} ascensionStars={owned.ascensionStars} />
          </View>
          <View style={styles.heroInfo}>
            <Text style={[styles.heroName, { color: colors.foreground }]}>{char.name}</Text>
            <AscensionStars stars={owned.ascensionStars} size="large" />
            {!!owned.ascensionStars && (
              <Text style={{ color: '#86efac', fontSize: 11, fontWeight: '800' }}>
                +{owned.ascensionStars * 20}% nos status base
              </Text>
            )}
            <Text style={[styles.heroRarity, { color: rarityColor }]}>{t(`rarity.${char.rarity}`)}</Text>
            <View style={styles.heroBadges}>
              <AttributeBadge attr={char.attribute} />
              <View style={{ width: 8 }} />
              <ElementBadge elem={char.element} />
            </View>
            <Text style={[styles.heroDesc, { color: colors.mutedForeground }]}>{char.description}</Text>

            {/* Dádiva Divina inline */}
            {dadivaInfo && (
              <View style={[styles.dadivaBadge, { backgroundColor: '#f59e0b15', borderColor: '#f59e0b55' }]}>
                <Text style={styles.dadivaBadgeTitle}>{t('char.dadiva')}</Text>
                <Text style={[styles.dadivaBadgeDesc, { color: colors.foreground }]}>{t(dadivaInfo.descKey)}</Text>
                {dadivaInfo.condKey && (
                  <Text style={[styles.dadivaBadgeCond, { color: '#f59e0b' }]}>ℹ️ {t(dadivaInfo.condKey)}</Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Level & EXP */}
        <View style={[styles.levelCard, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
          <View style={styles.levelRow}>
            <Text style={[styles.levelLabel, { color: colors.mutedForeground }]}>{t('char.level')}</Text>
            <Text style={[styles.levelNum, { color: colors.primary }]}>{owned.level}</Text>
          </View>
          <View style={styles.expBlock}>
            <View style={styles.expHeader}>
              <Text style={[styles.expLabel, { color: colors.mutedForeground }]}>EXP</Text>
              {isMaxLevel
                ? <Text style={[styles.expValue, { color: colors.primary, fontWeight: 'bold' }]}>MAX</Text>
                : <Text style={[styles.expValue, { color: colors.foreground }]}>{owned.exp} / {expNeeded}</Text>
              }
            </View>
            <View style={[styles.expTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.expFill, { width: `${expPct * 100}%` as any, backgroundColor: isMaxLevel ? '#f59e0b' : colors.primary }]} />
            </View>
            {!isMaxLevel && (
              <Text style={[styles.expNext, { color: colors.mutedForeground }]}>
                {expNeeded - owned.exp} EXP — {t('char.expNextLevel')} {owned.level + 1}
              </Text>
            )}
          </View>
          {!isMaxLevel && (
            <TouchableOpacity
              style={[styles.xpItemBtn, { backgroundColor: '#22c55e22', borderColor: '#22c55e66' }, pixelStyle]}
              activeOpacity={0.8}
              onPress={() => { setSelectedBattery('piece_battery_green'); setBatteryQty(1); setXpModalVisible(true); }}
            >
              <Image source={BATTERY_IMG_GREEN} style={{ width: 18, height: 18 }} resizeMode="contain" />
              <Text style={[styles.xpItemBtnText, { color: '#22c55e' }]}>{t('char.useXpItem')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('char.stats')}</Text>
          <StatBar label="HP"  value={scaled.hp}  max={400} color="#22c55e" />
          <StatBar label="MP"  value={scaled.mp}  max={400} color="#00d4ff" />
          <StatBar label="ATK" value={scaled.atk} max={250} color="#ef4444" />
          <StatBar label="DEF" value={scaled.def} max={250} color="#3b82f6" />
          <StatBar label="SPT" value={scaled.spt} max={250} color="#a855f7" />
          <StatBar label="SPD" value={scaled.spd} max={250} color="#facc15" />
        </View>

        {fusionRecipe && resultChar && (
          <View style={[styles.fusionCard, {
            backgroundColor: colors.card,
            borderColor: canFuse ? '#ff3c6e88' : colors.border,
          }, pixelStyle]}>
            <View style={styles.fusionHeader}>
              <Feather name="git-merge" size={16} color={canFuse ? '#ff3c6e' : colors.mutedForeground} />
              <Text style={[styles.fusionTitle, { color: canFuse ? '#ff3c6e' : colors.foreground }]}>
                {t('char.fusion')} {resultChar.name}
              </Text>
            </View>

            <View style={{ gap: 8, marginVertical: 12 }}>
              <Text style={[styles.fusionName, { color: colors.foreground }]}>
                {char.name} + {requiredPartnerIds.map((partnerId) => (getCharacter(partnerId) ?? CHARACTERS[partnerId])?.name ?? partnerId).join(' + ')}
              </Text>
              <Text style={[styles.fusionSub, { color: canFuse ? '#ff3c6e' : colors.mutedForeground }]}>
                → {resultChar.name} · Lv {fusionRecipe.requiredLevel}
              </Text>
            </View>

            {canFuse ? (
              <TouchableOpacity
                style={[styles.fuseBtn, { backgroundColor: '#ff3c6e' }, pixelStyle]}
                activeOpacity={0.85}
                onPress={handleFusePress}
              >
                <Feather name="git-merge" size={18} color="#fff" />
                <Text style={styles.fuseBtnText}>{t('char.fuseBtn')} {resultChar.name}</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.fuseLocked, { backgroundColor: colors.background, borderColor: colors.border }, pixelStyle]}>
                <Feather name="lock" size={14} color={colors.mutedForeground} />
                <Text style={[styles.fuseLockedText, { color: colors.mutedForeground }]}>
                  {!meetsLevel
                    ? `Lv ${fusionRecipe.requiredLevel} necessário`
                    : `Necessário: ${requiredPartnerIds.map((partnerId) => (getCharacter(partnerId) ?? CHARACTERS[partnerId])?.name ?? partnerId).join(', ')}`}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Attribute advantages */}
        <View style={[styles.advCard, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('char.attrAdv')}</Text>
          <View style={styles.advRow}>
            <View style={[styles.advTag, { backgroundColor: '#22c55e22', borderColor: '#22c55e' }]}>
              <Feather name="chevrons-up" size={14} color="#22c55e" />
              <Text style={[styles.advText, { color: '#22c55e' }]}>
                {attrData.beats ? `${t('char.effectiveVs')} ${t(`attr.${attrData.beats}`) || ATTRIBUTES[attrData.beats].label} (${attrData.beats})` : t('char.noAdvantage')}
              </Text>
            </View>
            <View style={[styles.advTag, { backgroundColor: '#ef444422', borderColor: '#ef4444' }]}>
              <Feather name="chevrons-down" size={14} color="#ef4444" />
              <Text style={[styles.advText, { color: '#ef4444' }]}>
                {attrData.weakTo ? `${t('char.weakVs')} ${t(`attr.${attrData.weakTo}`) || ATTRIBUTES[attrData.weakTo].label} (${attrData.weakTo})` : t('char.noWeakness')}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 16 }]}>{t('char.elemAdv')}</Text>
          <View style={styles.advRow}>
            <View style={[styles.advTag, { backgroundColor: elemData.color + '22', borderColor: elemData.color }]}>
              <Feather name="chevrons-up" size={14} color={elemData.color} />
              <Text style={[styles.advText, { color: elemData.color }]}>
                {elemData.beats ? `${t('char.effectiveVs')} ${t(`elem.${elemData.beats}`) || ELEMENTS[elemData.beats].label}` : t('char.noAdvantage')}
              </Text>
            </View>
            <View style={[styles.advTag, { backgroundColor: '#ef444422', borderColor: '#ef4444' }]}>
              <Feather name="chevrons-down" size={14} color="#ef4444" />
              <Text style={[styles.advText, { color: '#ef4444' }]}>
                {elemData.weakTo ? `${t('char.weakVs')} ${t(`elem.${elemData.weakTo}`) || ELEMENTS[elemData.weakTo].label}` : t('char.noWeakness')}
              </Text>
            </View>
          </View>
        </View>

        {/* Select button */}
        <TouchableOpacity
          onPress={() => { setSelectedCharacter(owned.ownedId); router.back(); }}
          activeOpacity={0.8}
          style={[
            styles.selectBtn,
            {
              backgroundColor: isSelected ? '#22c55e22' : colors.primary,
              borderColor: isSelected ? '#22c55e' : 'transparent',
              borderWidth: isSelected ? 1.5 : 0,
            },
            pixelStyle,
          ]}
        >
          <Feather name={isSelected ? 'check-circle' : 'zap'} size={18} color={isSelected ? '#22c55e' : colors.primaryForeground} />
          <Text style={[styles.selectBtnText, { color: isSelected ? '#22c55e' : colors.primaryForeground }]}>
            {isSelected ? t('char.isActive') : t('char.selectForBattle')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </View>

      {/* ── Partner Picker Modal (fusion) ────────────────────────────────── */}
      <Modal
        visible={partnerPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPartnerPickerVisible(false)}
      >
        <Pressable style={styles.confirmOverlay} onPress={() => setPartnerPickerVisible(false)}>
          <Pressable
            style={[styles.confirmBox, { backgroundColor: colors.card, borderColor: '#f59e0b44', maxWidth: 380 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>
              ⚔️ {t('char.pickFusionPartner')}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign: 'center', marginBottom: 12 }}>
              {t('char.pickFusionPartnerSub')} {partnerChar?.name}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320, width: '100%' }}>
              {allPartnerCopies.map((copy) => {
                const copyChar = getCharacter(copy.characterId) ?? null;
                const rc = RARITY_COLORS[copyChar?.rarity as keyof typeof RARITY_COLORS] ?? colors.primary;
                return (
                  <View
                    key={copy.ownedId}
                    style={[styles.pickerCard, { backgroundColor: colors.background, borderColor: '#f59e0b44' }, pixelStyle]}
                  >
                    <CharacterAvatar characterId={copy.characterId} size={52} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 14 }}>
                        {copyChar?.name ?? copy.characterId}
                      </Text>
                      <Text style={{ color: rc, fontSize: 12, marginTop: 2 }}>Lv {copy.level}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.pickerSelectBtn, { backgroundColor: '#f59e0b' }, pixelStyle]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setFuseSacrificeId(copy.ownedId);
                        setPartnerPickerVisible(false);
                        if (fusionRecipe?.requiredItem) setFusionItemPickerVisible(true);
                        else setConfirmFuseVisible(true);
                      }}
                    >
                      <Text style={styles.pickerSelectBtnText}>{t('char.select')}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={[styles.confirmCancel, { borderColor: colors.border, marginTop: 8 }]}
              onPress={() => setPartnerPickerVisible(false)}
            >
              <Text style={[styles.confirmCancelText, { color: colors.mutedForeground }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Required item picker for fusion ─────────────────────────────── */}
      <Modal
        visible={fusionItemPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFusionItemPickerVisible(false)}
      >
        <Pressable style={styles.confirmOverlay} onPress={() => setFusionItemPickerVisible(false)}>
          <Pressable
            style={[styles.confirmBox, { backgroundColor: colors.card, borderColor: '#a855f788', maxWidth: 340 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>SELECIONE O ITEM</Text>
            {fusionRecipe?.requiredItem && (() => {
              const itemId = fusionRecipe.requiredItem;
              const qty = inventory.filter((ownedItemId) => ownedItemId === itemId).length;
              return (
                <TouchableOpacity
                  style={[styles.pickerCard, { backgroundColor: colors.background, borderColor: '#a855f788', opacity: qty > 0 ? 1 : 0.45 }, pixelStyle]}
                  disabled={qty <= 0}
                  onPress={() => {
                    setSelectedFusionItemId(itemId);
                    setFusionItemPickerVisible(false);
                    setConfirmFuseVisible(true);
                  }}
                >
                  <Feather name="package" size={22} color="#a855f7" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: colors.foreground, fontWeight: '700' }}>{ITEM_NAMES[itemId] ?? itemId}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Disponível: x{qty}</Text>
                  </View>
                  <Text style={{ color: '#a855f7', fontWeight: '800' }}>USAR</Text>
                </TouchableOpacity>
              );
            })()}
            <TouchableOpacity
              style={[styles.confirmCancel, { borderColor: colors.border, marginTop: 8 }]}
              onPress={() => setFusionItemPickerVisible(false)}
            >
              <Text style={[styles.confirmCancelText, { color: colors.mutedForeground }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── XP Item modal ────────────────────────────────────────────────── */}
      <Modal
        visible={xpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setXpModalVisible(false)}
      >
        <Pressable style={styles.confirmOverlay} onPress={() => setXpModalVisible(false)}>
          <Pressable
            style={[styles.confirmBox, { backgroundColor: colors.card, borderColor: '#22c55e44', maxWidth: 340 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>{t('char.useXpItem')}</Text>
            <Text style={[{ color: colors.mutedForeground, fontSize: 12, textAlign: 'center', marginBottom: 12 }]}>
              {t('char.xpItemSub')}
            </Text>

            {/* Battery selector */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              {XP_BATTERIES.map((b) => {
                const qty = pieces?.[b.id] ?? 0;
                const sel = selectedBattery === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => { setSelectedBattery(b.id); setBatteryQty(1); }}
                    style={[styles.batteryOption, {
                      borderColor: sel ? b.color : colors.border,
                      backgroundColor: sel ? b.color + '22' : colors.background,
                      opacity: qty === 0 ? 0.4 : 1,
                    }]}
                  >
                    <Image source={b.img} style={{ width: 36, height: 36 }} resizeMode="contain" />
                    <Text style={{ color: sel ? b.color : colors.foreground, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                      {t(b.colorKey)}
                    </Text>
                    <Text style={{ color: b.color, fontSize: 10, fontWeight: '700' }}>+{b.xp} XP</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>x{qty}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quantity picker */}
            {(() => {
              const bat = XP_BATTERIES.find((b) => b.id === selectedBattery)!;
              const maxQty = pieces?.[selectedBattery] ?? 0;
              const totalXp = bat.xp * batteryQty;
              return (
                <>
                  <BatteryQuantityPicker
                    value={batteryQty}
                    max={maxQty}
                    onChange={setBatteryQty}
                    color={bat.color}
                    borderColor={colors.border}
                    textColor={colors.foreground}
                    mutedColor={colors.mutedForeground}
                    availableLabel={`${t('char.available')} ${maxQty}`}
                  />
                  <Text style={{ color: bat.color, fontWeight: '700', textAlign: 'center', marginBottom: 4 }}>
                    +{totalXp.toLocaleString()} {t('char.xpTotal')}
                  </Text>

                  <View style={styles.confirmBtnRow}>
                    <TouchableOpacity
                      style={[styles.confirmCancel, { borderColor: colors.border }]}
                      onPress={() => setXpModalVisible(false)}
                    >
                      <Text style={[styles.confirmCancelText, { color: colors.mutedForeground }]}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.confirmFuse, { backgroundColor: maxQty === 0 ? '#666' : '#22c55e', opacity: maxQty === 0 ? 0.5 : 1 }]}
                      onPress={() => {
                        if (maxQty === 0) return;
                        useXpItem(owned.ownedId, selectedBattery, batteryQty);
                        setXpModalVisible(false);
                      }}
                      disabled={maxQty === 0}
                    >
                      <Image source={bat.img} style={{ width: 16, height: 16 }} resizeMode="contain" />
                      <Text style={styles.confirmFuseText}>{t('char.useQty')} {batteryQty}×</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Fusion confirmation modal ────────────────────────────────────── */}
      <Modal
        visible={confirmFuseVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmFuseVisible(false)}
      >
        <Pressable style={styles.confirmOverlay} onPress={() => setConfirmFuseVisible(false)}>
          <Pressable
            style={[styles.confirmBox, { backgroundColor: colors.card, borderColor: '#ff3c6e88' }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Feather name="alert-triangle" size={28} color="#ff3c6e" style={{ alignSelf: 'center' }} />
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>{t('char.fuseConfirmTitle')}</Text>
            <Text style={[styles.confirmBody, { color: colors.mutedForeground }]}>
              {requiredPartnerIds.map((partnerId) => (getCharacter(partnerId) ?? CHARACTERS[partnerId])?.name ?? partnerId).join(', ')}{' '}
              <Text style={{ color: '#ff3c6e', fontWeight: '700' }}>{t('char.fuseConfirmPermanent')}</Text>
              {' '}<Text style={{ color: '#ff3c6e', fontWeight: '700' }}>{resultChar?.name}</Text>.
              {'\n\n'}{t('char.fuseConfirmUndo')}
            </Text>
            <Text style={{ color: '#facc15', fontSize: 12, lineHeight: 17, textAlign: 'center', marginBottom: 12 }}>
              Na fusão, prevalece a menor quantidade de estrelas.
              {(() => {
                const sacrifices = fusionRecipe?.partners?.length ? selectedMultiSacrifices : (selectedFusionSacrifice ? [selectedFusionSacrifice] : []);
                if (sacrifices.length === 0) return '';
                const stars = [getAscensionStars(owned), ...sacrifices.map(getAscensionStars)];
                return `\n${stars.map((star) => `${star}★`).join(' + ')} → ${Math.min(...stars)}★`;
              })()}
            </Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={[styles.confirmCancel, { borderColor: colors.border }]}
                onPress={() => setConfirmFuseVisible(false)}
              >
                <Text style={[styles.confirmCancelText, { color: colors.mutedForeground }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmFuse} onPress={handleFuseConfirm}>
                <Feather name="git-merge" size={16} color="#fff" />
                <Text style={styles.confirmFuseText}>{t('char.fuseGo')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Fusion animation overlay ─────────────────────────────────────── */}
      <Modal
        visible={fuseAnim !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => { if (fusePhase === 'done') { setFuseAnim(null); router.back(); } }}
      >
        <Pressable
          style={styles.evoOverlay}
          onPress={() => { if (fusePhase === 'done') { setFuseAnim(null); router.back(); } }}
        >
          <ExpoImage source={animGif} style={styles.evoGifBg} contentFit="cover" />
          <View style={styles.evoOverlayDim} />

          {fuseAnim && fuseFromImage && fusePartnerImage && (fusePhase === 'playing' || fusePhase === 'color') && (
            <Animated.View style={[styles.fusionPair, { opacity: fusionPairOpacity }]} pointerEvents="none">
              <Animated.View style={[styles.fusionSideSprite, { transform: [{ translateX: leftPosition }] }]}>
                <ExpoImage source={fuseFromImage} style={[styles.fusionWhiteSprite, styles.fusionWhiteSilhouette]} contentFit="contain" />
              </Animated.View>
              <Animated.View style={[styles.fusionSideSprite, { transform: [{ translateX: rightPosition }] }]}>
                <ExpoImage source={fusePartnerImage} style={[styles.fusionWhiteSprite, styles.fusionWhiteSilhouette]} contentFit="contain" />
              </Animated.View>
            </Animated.View>
          )}

          <Animated.View
            style={[
              styles.fusionCoreWrap,
              {
                opacity: fusionCoreOpacity,
                transform: [{ rotate: fusionCoreRotate }, { scale: fusionCoreScale }],
              },
            ]}
            pointerEvents="none"
          >
            <Image source={FUSION_RAINBOW_CORE} style={styles.fusionCoreImage} resizeMode="contain" />
          </Animated.View>

          <View style={styles.evoContent} pointerEvents="none">
            {(fusePhase === 'reveal' || fusePhase === 'done') && fuseAnim && (
              <>
                <Animated.Text style={[styles.evoTopLabel, styles.evoTopLabelFusion, { transform: [{ scale: titleScale }] }]}>
                </Animated.Text>
                <Animated.View style={[styles.evoAvatarWrap, { opacity: newFormOpacity }]}>
                  <CharacterAvatar characterId={fuseAnim.toCharId} size={140} />
                </Animated.View>
                <Animated.Text style={[styles.evoToName, { opacity: newFormOpacity }]}>
                  {fuseToChar?.name ?? ''}
                </Animated.Text>
                {fuseToChar && (
                  <Animated.View style={[styles.evoBadgesRowBig, { opacity: newFormOpacity }]}>
                    <AttributeBadge attr={fuseToChar.attribute} />
                    <ElementBadge   elem={fuseToChar.element}   />
                  </Animated.View>
                )}
                {fusePhase === 'done' && (
                  <Text style={styles.evoDismiss}>{t('char.tapToContinue')}</Text>
                )}
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  elemBgOverlay: {
    ...StyleSheet.absoluteFillObject as any,
    zIndex: 0,
  },
  elemBgLabel: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    fontSize: 48,
    fontWeight: '900' as const,
    opacity: 0.07,
    letterSpacing: 8,
    zIndex: 0,
    pointerEvents: 'none' as any,
  },
  omegamonBgGif: {
    ...StyleSheet.absoluteFillObject as any,
    width: '100%', height: '100%',
    opacity: 0.18,
    zIndex: 0,
  },
  scrollView: { flex: 1 },
  scrollTransparent: { backgroundColor: 'transparent' },
  content: { paddingHorizontal: 20 },
  backBtn: { marginBottom: 16, alignSelf: 'flex-start', padding: 4 },
  errorText: { textAlign: 'center', fontSize: 14, margin: 40 },
  heroCard: { borderRadius: 20, borderWidth: 1.5, overflow: 'hidden', marginBottom: 16 },
  heroStrip: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  heroStripGif: {
    ...StyleSheet.absoluteFillObject as any,
    width: '100%', height: '100%',
    opacity: 0.35,
  },
  heroInfo: { padding: 14, gap: 6 },
  heroName: { fontSize: 15, fontWeight: '800' as const },
  heroRarity: { fontSize: 11, fontWeight: '700' as const },
  heroBadges: { flexDirection: 'row' },
  heroDesc: { fontSize: 11, lineHeight: 16 },
  levelCard: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 12 },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  levelLabel: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1 },
  levelNum: { fontSize: 17, fontWeight: '900' as const },
  expBlock: { gap: 6 },
  expHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  expLabel: { fontSize: 11, fontWeight: '600' as const },
  expValue: { fontSize: 11 },
  expTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  expFill: { height: '100%', borderRadius: 4 },
  expNext: { fontSize: 11, textAlign: 'right' },
  statsCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },

  // ── Dádiva Divina inline badge ────────────────────────────────────────────────
  dadivaBadge: {
    borderRadius: 10, borderWidth: 1, padding: 10, gap: 4, marginTop: 4,
  },
  dadivaBadgeTitle: { fontSize: 10, fontWeight: '800' as const, color: '#f59e0b', letterSpacing: 0.5, textTransform: 'uppercase' as const },
  dadivaBadgeDesc: { fontSize: 12, fontWeight: '600' as const, lineHeight: 18 },
  dadivaBadgeCond: { fontSize: 10, fontWeight: '500' as const, lineHeight: 14, marginTop: 2 },

  // ── Fusion ──────────────────────────────────────────────────────────────────
  fusionCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 16, gap: 14 },
  fusionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fusionTitle: { fontSize: 12, fontWeight: '800' as const, flex: 1 },
  ultraPill: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  ultraPillText: { fontSize: 10, fontWeight: '800' as const, color: '#ff3c6e' },
  fusionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fusionSide: { alignItems: 'center', gap: 4, flex: 1 },
  fusionName: { fontSize: 11, fontWeight: '700' as const, textAlign: 'center' },
  fusionSub: { fontSize: 10, fontWeight: '600' as const },
  fusionCenter: { alignItems: 'center', gap: 2 },
  fusionArrow: { fontSize: 14, fontWeight: '900' as const },
  fuseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 14,
  },
  fuseBtnText: { fontSize: 13, fontWeight: '800' as const, color: '#fff' },
  fuseLocked: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  fuseLockedText: { fontSize: 12, flex: 1 },

  advCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 },
  advRow: { gap: 8 },
  advTag: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  advText: { fontSize: 13, fontWeight: '600' as const },
  selectBtn: { borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  selectBtnText: { fontSize: 14, fontWeight: '700' as const },

  // ── XP item button ───────────────────────────────────────────────────────────
  xpItemBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderRadius: 12, paddingVertical: 10, marginTop: 12,
  },
  xpItemBtnText: { fontSize: 12, fontWeight: '700' as const },

  // ── Battery selector ─────────────────────────────────────────────────────────
  batteryOption: {
    alignItems: 'center', borderWidth: 2, borderRadius: 12,
    padding: 10, minWidth: 72,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 8 },
  qtyBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontSize: 14, fontWeight: '800' as const, minWidth: 40, textAlign: 'center' },

  // ── Confirm modal ────────────────────────────────────────────────────────────
  confirmOverlay: {
    flex: 1, backgroundColor: '#00000088',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  confirmBox: { borderRadius: 20, borderWidth: 1.5, padding: 24, gap: 14, width: '100%' },
  confirmTitle: { fontSize: 15, fontWeight: '800' as const, textAlign: 'center' },
  confirmBody: { fontSize: 12, lineHeight: 22, textAlign: 'center' },
  confirmBtnRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  confirmCancel: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 13, alignItems: 'center' },
  confirmCancelText: { fontSize: 12, fontWeight: '700' as const },
  confirmFuse: {
    flex: 1, borderRadius: 12, backgroundColor: '#ff3c6e',
    paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  confirmFuseText: { fontSize: 12, fontWeight: '800' as const, color: '#fff' },

  // ── Partner picker card ───────────────────────────────────────────────────────
  pickerCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    width: '100%' as any,
  },
  pickerSelectBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  pickerSelectBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800' as const,
  },

  // ── Fusion animation ─────────────────────────────────────────────────────────
  evoOverlay: {
    flex: 1, backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center',
  },
  evoGifBg: {
    ...StyleSheet.absoluteFillObject as any,
    width: '100%', height: '100%', opacity: 0.65,
  },
  evoOverlayDim: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: '#00000055',
  },
  fusionPair: {
    position: 'absolute', width: '100%', height: 240,
    alignItems: 'center', justifyContent: 'center', zIndex: 3,
  },
  fusionSideSprite: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
  },
  fusionWhiteSprite: { width: 155, height: 155 },
  fusionWhiteSilhouette: { tintColor: '#fff', backgroundColor: 'transparent' },
  fusionCoreWrap: {
    position: 'absolute', width: 230, height: 230,
    alignItems: 'center', justifyContent: 'center', zIndex: 4,
  },
  fusionCoreImage: { width: '100%', height: '100%' },
  evoContent: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 16,
  },
  evoTopLabel: {
    fontSize: 17, fontWeight: '900' as const,
    color: '#facc15',
    textShadowColor: '#000', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
    letterSpacing: 2, textAlign: 'center',
  },
  evoTopLabelFusion: { color: '#ff3c6e' },
  evoAvatarWrap: { position: 'relative' as const, width: 140, height: 140 },
  evoSilhouette: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: '#000', borderRadius: 70,
  },
  evoFromName: {
    fontSize: 14, fontWeight: '700' as const, color: '#fff',
    textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  evoToName: {
    fontSize: 14, fontWeight: '900' as const, color: '#fff',
    textShadowColor: '#000', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
  },
  evoBadgesRowBig: { flexDirection: 'row', gap: 10 },
  evoDismiss: {
    fontSize: 13, color: 'rgba(255,255,255,0.6)',
    marginTop: 8, textAlign: 'center',
  },
});