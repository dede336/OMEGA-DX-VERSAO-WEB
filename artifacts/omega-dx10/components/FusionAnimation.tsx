import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { getCharacter, getCharacterImageSource } from '@/constants/extendedCharacters';

const FUSION_GIF = require('../assets/images/fusion_crimson.webp');

type Props = {
  visible: boolean;
  baseCharacterId: string;
  partnerCharacterId: string;
  resultCharacterId: string;
  onClose: () => void;
};

export default function FusionAnimation({ visible, baseCharacterId, partnerCharacterId, resultCharacterId, onClose }: Props) {
  const left = useRef(new Animated.Value(-160)).current;
  const right = useRef(new Animated.Value(160)).current;
  const sourcesOpacity = useRef(new Animated.Value(1)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0.7)).current;
  const [finished, setFinished] = useState(false);
  const baseImage = getCharacterImageSource(baseCharacterId);
  const partnerImage = getCharacterImageSource(partnerCharacterId);
  const resultImage = getCharacterImageSource(resultCharacterId);
  const resultCharacter = getCharacter(resultCharacterId);

  useEffect(() => {
    if (!visible) return;
    left.setValue(-160); right.setValue(160); sourcesOpacity.setValue(1);
    flashOpacity.setValue(0); resultOpacity.setValue(0); resultScale.setValue(0.7); setFinished(false);
    Animated.sequence([
      Animated.delay(350),
      Animated.parallel([
        Animated.timing(left, { toValue: 0, duration: 1600, useNativeDriver: true }),
        Animated.timing(right, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(sourcesOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(flashOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.timing(flashOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]),
      Animated.parallel([
        Animated.timing(resultOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(resultScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]),
    ]).start(() => setFinished(true));
  }, [flashOpacity, left, resultOpacity, resultScale, right, sourcesOpacity, visible]);

  return <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={() => { if (finished) onClose(); }}>
    <View style={styles.screen}>
      <ExpoImage source={FUSION_GIF} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.dim} />
      <TouchableOpacity style={styles.skip} onPress={onClose}><Text style={styles.skipText}>PULAR</Text></TouchableOpacity>
      <View style={styles.stage}>
        {!!baseImage && <Animated.View style={[styles.source, { opacity: sourcesOpacity, transform: [{ translateX: left }] }]}><ExpoImage source={baseImage} style={[styles.sourceSprite, styles.whiteSilhouette]} contentFit="contain" /></Animated.View>}
        {!!partnerImage && <Animated.View style={[styles.source, { opacity: sourcesOpacity, transform: [{ translateX: right }] }]}><ExpoImage source={partnerImage} style={[styles.sourceSprite, styles.whiteSilhouette]} contentFit="contain" /></Animated.View>}
        <Animated.View style={[styles.flash, { opacity: flashOpacity }]} />
        {!!resultImage && <Animated.View style={[styles.result, { opacity: resultOpacity, transform: [{ scale: resultScale }] }]}><Image source={resultImage} style={styles.resultSprite} resizeMode="contain" /><Text style={styles.title}>FUSÃO CONCLUÍDA</Text><Text style={styles.name}>{resultCharacter?.name ?? resultCharacterId}</Text>{finished && <Text style={styles.continueText}>TOQUE PARA CONTINUAR</Text>}</Animated.View>}
      </View>
      {finished && <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />}
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.22)' },
  skip: { position: 'absolute', top: 24, right: 20, zIndex: 20, padding: 12 },
  skipText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  stage: { width: '100%', height: 440, alignItems: 'center', justifyContent: 'center' },
  source: { position: 'absolute' }, sourceSprite: { width: 150, height: 150 }, whiteSilhouette: { tintColor: '#fff', backgroundColor: 'transparent' },
  flash: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#fff', shadowColor: '#ff3c6e', shadowOpacity: 1, shadowRadius: 70, elevation: 40 },
  result: { alignItems: 'center', zIndex: 5 }, resultSprite: { width: 200, height: 200 },
  title: { color: '#ff3c6e', fontSize: 18, fontWeight: '900', marginTop: 12 },
  name: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 6 },
  continueText: { color: '#e5e7eb', fontSize: 11, fontWeight: '800', marginTop: 18 },
});
