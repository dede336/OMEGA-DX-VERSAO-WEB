import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import {
  getCharacter,
  getCharacterImageSource,
} from '@/constants/extendedCharacters';

type Props = {
  visible: boolean;
  fromCharacterId: string;
  toCharacterId: string;
  onClose: () => void;
};

type Phase = 'initial' | 'animation' | 'evolved' | 'done';

const DIGIVOLUTION_GIF = require('../assets/images/digivolution.gif');

export default function EvolutionAnimation({
  visible,
  fromCharacterId,
  toCharacterId,
  onClose,
}: Props) {
  const [phase, setPhase] = useState<Phase>('initial');

  const originalOpacity = useRef(new Animated.Value(1)).current;
  const evolvedOpacity = useRef(new Animated.Value(0)).current;

  const fromImage = getCharacterImageSource(fromCharacterId);
  const toImage = getCharacterImageSource(toCharacterId);
  const toCharacter = getCharacter(toCharacterId);

  useEffect(() => {
    if (!visible) return;

    setPhase('initial');

    originalOpacity.setValue(1);
    evolvedOpacity.setValue(0);

    let animationStartTimer: ReturnType<typeof setTimeout> | undefined;
    let evolutionTimer: ReturnType<typeof setTimeout> | undefined;
    let finishTimer: ReturnType<typeof setTimeout> | undefined;

    // 1) Digimon original aparece sozinho por 1,5 segundo.
    animationStartTimer = setTimeout(() => {
      setPhase('animation');

      // 2) A GIF começa.
      //
      // A animação enviada possui 12 frames.
      // Cada frame dura aproximadamente 300 ms.
      //
      // O frame 5 começa aproximadamente 1,2 segundo
      // depois do início da GIF.
      evolutionTimer = setTimeout(() => {
        // Troca imediatamente o Digimon original
        // pelo Digimon evoluído.
        originalOpacity.setValue(0);
        evolvedOpacity.setValue(1);

        setPhase('evolved');
      }, 1200);

      // 3) 12 frames x 300 ms = aproximadamente 3,6 segundos.
      //
      // Quando a GIF termina, ela desaparece.
      // O Digimon evoluído permanece na tela.
      finishTimer = setTimeout(() => {
        setPhase('done');
      }, 3600);
    }, 1500);

    return () => {
      if (animationStartTimer) {
        clearTimeout(animationStartTimer);
      }

      if (evolutionTimer) {
        clearTimeout(evolutionTimer);
      }

      if (finishTimer) {
        clearTimeout(finishTimer);
      }
    };
  }, [
    visible,
    fromCharacterId,
    toCharacterId,
    originalOpacity,
    evolvedOpacity,
  ]);

  if (!fromImage || !toImage) {
    return null;
  }

  const showGif =
    phase === 'animation' ||
    phase === 'evolved';

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.screen}>

        {/* DIGIMON ORIGINAL */}
        <Animated.View
          style={[
            styles.digimonContainer,
            {
              opacity: originalOpacity,
            },
          ]}
        >
          <ExpoImage
            source={fromImage}
            style={styles.digimon}
            contentFit="contain"
          />
        </Animated.View>

        {/* DIGIMON EVOLUÍDO */}
        <Animated.View
          style={[
            styles.digimonContainer,
            {
              opacity: evolvedOpacity,
            },
          ]}
        >
          <Image
            source={toImage}
            style={styles.digimon}
            resizeMode="contain"
          />
        </Animated.View>

        {/* GIF DE DIGIEVOLUÇÃO NA FRENTE DO DIGIMON */}
        {showGif && (
          <View
            pointerEvents="none"
            style={styles.animationLayer}
          >
            <ExpoImage
              source={DIGIVOLUTION_GIF}
              style={styles.digivolutionAnimation}
              contentFit="contain"
              autoplay
            />
          </View>
        )}

        {/* FINAL DA DIGIEVOLUÇÃO */}
        {phase === 'done' && (
          <View style={styles.result}>
            <Text style={styles.title}>
              DIGIEVOLUÇÃO CONCLUÍDA
            </Text>

            <Text style={styles.name}>
              {toCharacter?.name ?? toCharacterId}
            </Text>

            <TouchableOpacity
              style={styles.okButton}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.okButtonText}>
                OK
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  digimonContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  digimon: {
    width: 220,
    height: 220,
  },

  animationLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  digivolutionAnimation: {
    width: 320,
    height: 320,
  },

  result: {
    position: 'absolute',
    bottom: 55,
    alignItems: 'center',
    zIndex: 20,
  },

  title: {
    color: '#facc15',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowRadius: 8,
  },

  name: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowRadius: 8,
  },

  okButton: {
    marginTop: 22,
    minWidth: 160,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 32,
  },

  okButtonText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
  },
});
