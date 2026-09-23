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

type Phase =
  | 'initial'
  | 'animation'
  | 'evolved'
  | 'done';

// GIF que você colocou em:
// artifacts/omega-dx10/assets/images/digivolution.gif
const DIGIVOLUTION_GIF =
  require('../assets/images/digivolution.gif');

export default function EvolutionAnimation({
  visible,
  fromCharacterId,
  toCharacterId,
  onClose,
}: Props) {
  const [phase, setPhase] =
    useState<Phase>('initial');

  const originalOpacity =
    useRef(new Animated.Value(1)).current;

  const evolvedOpacity =
    useRef(new Animated.Value(0)).current;

  const fromImage =
    getCharacterImageSource(fromCharacterId);

  const toImage =
    getCharacterImageSource(toCharacterId);

  const toCharacter =
    getCharacter(toCharacterId);

  useEffect(() => {
    if (!visible) {
      return;
    }

    // Sempre reinicia a animação do começo
    // quando o modal é aberto.
    setPhase('initial');

    originalOpacity.setValue(1);
    evolvedOpacity.setValue(0);

    let animationStartTimer:
      | ReturnType<typeof setTimeout>
      | undefined;

    let evolutionTimer:
      | ReturnType<typeof setTimeout>
      | undefined;

    let finishTimer:
      | ReturnType<typeof setTimeout>
      | undefined;

    /*
     * ETAPA 1
     *
     * O Digimon original aparece sozinho
     * durante 1,5 segundo.
     */
    animationStartTimer = setTimeout(() => {
      /*
       * ETAPA 2
       *
       * Começa a GIF de Digievolução.
       */
      setPhase('animation');

      /*
       * ETAPA 3
       *
       * A GIF possui aproximadamente:
       *
       * 12 frames
       * 300 ms por frame
       *
       * O frame 5 começa aproximadamente
       * 1,2 segundo depois do início.
       *
       * Nesse momento trocamos o Digimon
       * original pelo Digimon evoluído.
       */
      evolutionTimer = setTimeout(() => {
        originalOpacity.setValue(0);
        evolvedOpacity.setValue(1);

        setPhase('evolved');
      }, 1200);

      /*
       * ETAPA 4
       *
       * A GIF inteira dura aproximadamente
       * 3,6 segundos.
       *
       * Quando termina, removemos o efeito
       * e deixamos apenas o Digimon evoluído.
       */
      finishTimer = setTimeout(() => {
        setPhase('done');
      }, 3600);

    }, 1500);

    /*
     * Limpeza dos timers caso o componente
     * seja fechado antes da animação terminar.
     */
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

  /*
   * Se alguma imagem não existir,
   * não tenta abrir a animação.
   */
  if (!fromImage || !toImage) {
    return null;
  }

  /*
   * A GIF aparece somente durante
   * a animação.
   */
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

        {/* =====================================
            DIGIMON ORIGINAL
            ===================================== */}

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


        {/* =====================================
            DIGIMON EVOLUÍDO

            Ele já fica preparado atrás da GIF,
            mas começa invisível.
            ===================================== */}

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


        {/* =====================================
            GIF DE DIGIEVOLUÇÃO

            Fica NA FRENTE do Digimon.
            ===================================== */}

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


        {/* =====================================
            FINAL DA DIGIEVOLUÇÃO
            ===================================== */}

        {phase === 'done' && (
          <View style={styles.result}>

            <Text style={styles.title}>
              DIGIEVOLUÇÃO CONCLUÍDA
            </Text>

            <Text style={styles.name}>
              {toCharacter?.name ??
                toCharacterId}
            </Text>

            <TouchableOpacity
              style={styles.okButton}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text
                style={styles.okButtonText}
              >
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


  /*
   * Área onde fica o Digimon.
   */
  digimonContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },


  /*
   * DIGIMON 30% MENOR
   *
   * Antes:
   * 220 x 220
   *
   * Agora:
   * 154 x 154
   *
   * 220 × 0,70 = 154
   */
  digimon: {
    width: 154,
    height: 154,
  },


  /*
   * Camada da GIF.
   *
   * zIndex 10 faz a animação ficar
   * na frente do Digimon.
   */
  animationLayer: {
    ...StyleSheet.absoluteFillObject,

    zIndex: 10,

    alignItems: 'center',
    justifyContent: 'center',
  },


  /*
   * A GIF continua no tamanho original.
   *
   * Portanto:
   *
   * Digimon = 154 x 154
   * GIF      = 320 x 320
   *
   * O efeito fica claramente maior
   * que o Digimon.
   */
  digivolutionAnimation: {
    width: 320,
    height: 320,
  },


  /*
   * Resultado final.
   */
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
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 8,
  },


  name: {
    color: '#fff',

    fontSize: 20,
    fontWeight: '900',

    marginTop: 8,

    textAlign: 'center',

    textShadowColor: '#000',
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 8,
  },


  /*
   * Botão que retorna ao DigiBank.
   */
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
