import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { expToNextLevel } from '@/constants/gameData';
import { getCharacter, getCharacterImageSource } from '@/constants/extendedCharacters';

type Props = {
  visible: boolean;
  characterId: string;
  initialLevel: number;
  initialExp: number;
  gainedExp: number;
  color?: string;
  onClose: () => void;
};

type Segment = { level: number; from: number; to: number };

function calculateProgress(initialLevel: number, initialExp: number, gainedExp: number) {
  let level = initialLevel;
  let exp = initialExp;
  let remaining = gainedExp;
  const segments: Segment[] = [];
  while (remaining > 0 && level < 100) {
    const needed = expToNextLevel(level);
    const used = Math.min(remaining, Math.max(0, needed - exp));
    segments.push({ level, from: needed > 0 ? exp / needed : 0, to: needed > 0 ? (exp + used) / needed : 1 });
    exp += used;
    remaining -= used;
    if (exp >= needed) { level += 1; exp = 0; }
    else break;
  }
  return { segments, finalLevel: level, finalExp: exp };
}

export default function BatteryExpAnimation({ visible, characterId, initialLevel, initialExp, gainedExp, color = '#22c55e', onClose }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const calculated = useMemo(() => calculateProgress(initialLevel, initialExp, gainedExp), [gainedExp, initialExp, initialLevel]);
  const image = getCharacterImageSource(characterId);
  const character = getCharacter(characterId);
  const segment = calculated.segments[segmentIndex];
  const levelsGained = calculated.finalLevel - initialLevel;

  useEffect(() => {
    if (!visible) return;
    setSegmentIndex(0); setFinished(false);
  }, [visible, initialLevel, initialExp, gainedExp]);

  useEffect(() => {
    if (!visible) return;
    const current = calculated.segments[segmentIndex];
    if (!current) { setFinished(true); return; }
    progress.setValue(Math.max(0, Math.min(1, current.from)));
    const duration = Math.max(120, Math.min(650, 2600 / Math.max(1, calculated.segments.length)));
    const animation = Animated.timing(progress, { toValue: Math.max(0, Math.min(1, current.to)), duration, useNativeDriver: false });
    animation.start(({ finished: completed }) => {
      if (!completed) return;
      if (segmentIndex + 1 < calculated.segments.length) setTimeout(() => setSegmentIndex((index) => index + 1), 100);
      else setFinished(true);
    });
    return () => animation.stop();
  }, [calculated.segments, progress, segmentIndex, visible]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const displayedLevel = segment?.level ?? calculated.finalLevel;

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <View style={[styles.card, { borderColor: color }]}> 
        <Text style={[styles.title, { color }]}>BATERIA EXP</Text>
        {!!image && <Image source={image} style={styles.sprite} resizeMode="contain" />}
        <Text style={styles.name}>{character?.name ?? characterId}</Text>
        <Text style={styles.level}>LV {displayedLevel}</Text>
        <View style={styles.bar}><Animated.View style={[styles.fill, { width, backgroundColor: color }]} /></View>
        <Text style={styles.exp}>+{gainedExp.toLocaleString()} EXP</Text>
        {finished && <>
          <Text style={[styles.result, { color }]}>{levelsGained > 0 ? `SUBIU ${levelsGained} NÍVEL${levelsGained > 1 ? 'IS' : ''}!` : 'EXP ADICIONADA!'}</Text>
          <Text style={styles.finalLevel}>LV {initialLevel} → LV {calculated.finalLevel}</Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: color }]} onPress={onClose}><Text style={styles.buttonText}>CONTINUAR</Text></TouchableOpacity>
        </>}
        {!finished && <TouchableOpacity style={styles.skip} onPress={onClose}><Text style={styles.skipText}>PULAR</Text></TouchableOpacity>}
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  card: { width: '100%', maxWidth: 420, borderWidth: 2, borderRadius: 20, backgroundColor: '#111827', alignItems: 'center', padding: 22 },
  title: { fontSize: 18, fontWeight: '900' }, sprite: { width: 150, height: 150, marginTop: 8 },
  name: { color: '#fff', fontSize: 17, fontWeight: '900' }, level: { color: '#facc15', fontSize: 24, fontWeight: '900', marginTop: 12 },
  bar: { width: '100%', height: 22, borderRadius: 11, overflow: 'hidden', backgroundColor: '#374151', borderWidth: 2, borderColor: '#6b7280', marginTop: 12 },
  fill: { height: '100%', borderRadius: 9 }, exp: { color: '#d1d5db', fontSize: 13, fontWeight: '800', marginTop: 8 },
  result: { fontSize: 18, fontWeight: '900', marginTop: 16 }, finalLevel: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 6 },
  button: { width: '100%', borderRadius: 12, paddingVertical: 13, marginTop: 18 }, buttonText: { color: '#07110a', textAlign: 'center', fontWeight: '900' },
  skip: { marginTop: 18, padding: 8 }, skipText: { color: '#9ca3af', fontSize: 11, fontWeight: '800' },
});
