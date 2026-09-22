import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { AttributeBadge, ElementBadge } from '@/components/GameComponents';
import { getCharacter, getCharacterImageSource } from '@/constants/extendedCharacters';

type Phase = 'digimon' | 'egg' | 'whiteEgg' | 'reveal' | 'done';
type Props = { visible: boolean; fromCharacterId: string; toCharacterId: string; onClose: () => void };
const EVOLUTION_BACKGROUND = require('../assets/images/digivolution.webp');
const DIGIVOLUTION_EGG = require('../assets/images/digivolution_egg.png');

export default function EvolutionAnimation({ visible, fromCharacterId, toCharacterId, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('digimon');
  const sourceOpacity = useRef(new Animated.Value(1)).current;
  const sourceScale = useRef(new Animated.Value(0.82)).current;
  const eggOpacity = useRef(new Animated.Value(0)).current;
  const eggScale = useRef(new Animated.Value(0.45)).current;
  const whiteEggOpacity = useRef(new Animated.Value(0)).current;
  const eggRotation = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0.65)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const fromImage = getCharacterImageSource(fromCharacterId);
  const toImage = getCharacterImageSource(toCharacterId);
  const toCharacter = getCharacter(toCharacterId);

  useEffect(() => {
    if (!visible) return;
    setPhase('digimon');
    sourceOpacity.setValue(1); sourceScale.setValue(0.82);
    eggOpacity.setValue(0); eggScale.setValue(0.45); whiteEggOpacity.setValue(0); eggRotation.setValue(0);
    resultOpacity.setValue(0); resultScale.setValue(0.65); flashOpacity.setValue(0);
    let rainbowTimer: ReturnType<typeof setTimeout> | undefined;
    Animated.sequence([
      Animated.timing(sourceScale, { toValue: 1.06, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(450),
      Animated.parallel([
        Animated.timing(sourceOpacity, { toValue: 0, duration: 420, useNativeDriver: true }),
        Animated.timing(eggOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.spring(eggScale, { toValue: 1, friction: 5, tension: 55, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setPhase('egg');
      rainbowTimer = setTimeout(() => {
        const rockOnce = () => Animated.sequence([
          Animated.timing(eggRotation, { toValue: -1, duration: 125, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(eggRotation, { toValue: 1, duration: 250, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(eggRotation, { toValue: 0, duration: 125, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]);
        Animated.sequence([
          Animated.sequence([rockOnce(), rockOnce(), rockOnce(), rockOnce()]),
          Animated.timing(whiteEggOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.delay(260),
          Animated.parallel([
            Animated.timing(eggOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.timing(whiteEggOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(flashOpacity, { toValue: 1, duration: 130, useNativeDriver: true }),
              Animated.timing(flashOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
            ]),
          ]),
        ]).start(() => {
          setPhase('reveal');
          Animated.parallel([
            Animated.timing(resultOpacity, { toValue: 1, duration: 650, useNativeDriver: true }),
            Animated.spring(resultScale, { toValue: 1, friction: 6, tension: 45, useNativeDriver: true }),
          ]).start(() => setPhase('done'));
        });
      }, 550);
    });
    return () => { if (rainbowTimer) clearTimeout(rainbowTimer); };
  }, [visible, fromCharacterId, toCharacterId, eggOpacity, eggRotation, eggScale, flashOpacity, resultOpacity, resultScale, sourceOpacity, sourceScale, whiteEggOpacity]);

  if (!fromImage || !toImage) return null;
  const eggRotate = eggRotation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-7deg', '0deg', '7deg'],
  });
  return (
    <Modal visible={visible} transparent={false} animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={styles.screen}>
        <ExpoImage source={EVOLUTION_BACKGROUND} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.dim} />
        <TouchableOpacity style={styles.skip} onPress={onClose}><Text style={styles.skipText}>PULAR</Text></TouchableOpacity>
        <View style={styles.stage}>
          <Animated.View style={[styles.centered, { opacity: sourceOpacity, transform: [{ scale: sourceScale }] }]}>
            <ExpoImage source={fromImage} style={[styles.digimon, styles.whiteSilhouette]} contentFit="contain" />
          </Animated.View>
          <Animated.View style={[styles.centered, { opacity: eggOpacity, transform: [{ scale: eggScale }, { rotate: eggRotate }] }]}>
            <ExpoImage source={DIGIVOLUTION_EGG} style={styles.eggImage} contentFit="contain" />
          </Animated.View>
          <Animated.View style={[styles.centered, { opacity: whiteEggOpacity, transform: [{ scale: eggScale }, { rotate: eggRotate }] }]}>
            <ExpoImage source={DIGIVOLUTION_EGG} style={[styles.eggImage, styles.whiteSilhouette]} contentFit="contain" />
          </Animated.View>
          <Animated.View style={[styles.flash, { opacity: flashOpacity }]} />
          <Animated.View style={[styles.result, { opacity: resultOpacity, transform: [{ scale: resultScale }] }]}>
            <Image source={toImage} style={styles.resultDigimon} resizeMode="contain" />
            <Text style={styles.title}>DIGIEVOLUÇÃO CONCLUÍDA!</Text>
            <Text style={styles.name}>{toCharacter?.name ?? toCharacterId}</Text>
            {toCharacter && <View style={styles.badges}><AttributeBadge attr={toCharacter.attribute} /><ElementBadge elem={toCharacter.element} /></View>}
            {phase === 'done' && <Text style={styles.continueText}>Toque em continuar</Text>}
          </Animated.View>
        </View>
        {phase === 'done' && <TouchableOpacity style={styles.continueButton} onPress={onClose}><Text style={styles.continueButtonText}>CONTINUAR</Text></TouchableOpacity>}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 20 },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  skip: { position: 'absolute', top: 28, right: 20, zIndex: 20, padding: 12 },
  skipText: { color: '#ffffffaa', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  stage: { width: '100%', height: 430, alignItems: 'center', justifyContent: 'center' },
  centered: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  digimon: { width: 190, height: 190 },
  whiteSilhouette: { tintColor: '#fff', backgroundColor: 'transparent' },
  eggImage: { width: 170, height: 210, backgroundColor: 'transparent' },
  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: '#fff' },
  result: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  resultDigimon: { width: 210, height: 210 },
  title: { color: '#facc15', fontSize: 17, fontWeight: '900', letterSpacing: 1.3, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 8 },
  name: { color: '#fff', fontSize: 19, fontWeight: '900', marginTop: 8, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 8 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 10 },
  continueText: { color: '#ffffffaa', fontSize: 12, fontWeight: '700', marginTop: 16 },
  continueButton: { position: 'absolute', bottom: 42, minWidth: 210, backgroundColor: '#f59e0b', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28 },
  continueButtonText: { color: '#111', fontWeight: '900', textAlign: 'center', letterSpacing: 1 },
});
