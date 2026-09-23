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

// GIF de Digievolução:
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

    /*
     * Sempre reinicia a sequência quando
     * a tela de Digievolução é aberta.
     */
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
     * =========================================
     * ETAPA 1
     * =========================================
     *
     * O Digimon original aparece sozinho
     * durante 1,5 segundo.
     */
    animationStartTimer = setTimeout(() => {
      /*
       * =========================================
       * ETAPA 2
       * =========================================
       *
       * Inicia a GIF de Digievolução.
       */
      setPhase('animation');

      /*
       * =========================================
       * ETAPA 3
       * =========================================
       *
       * A GIF possui aproximadamente:
       *
       * 12 frames
       * 300 ms por frame
       *
       * O frame 5 começa aproximadamente
       * 1,2 segundo depois do início da GIF.
       *
       * Nesse momento o Digimon original
       * desaparece e o evoluído aparece.
       */
      evolutionTimer = setTimeout(() => {
        originalOpacity.setValue(0);
        evolvedOpacity.setValue(1);

        setPhase('evolved');
      }, 1200);

      /*
       * =========================================
       * ETAPA 4
       * =========================================
       *
       * A GIF completa dura aproximadamente
       * 3,6 segundos.
       *
       * Quando termina:
       *
       * - a GIF desaparece;
       * - o Digimon evoluído permanece;
       * - aparece DIGIEVOLUÇÃO CONCLUÍDA;
       * - aparece o botão OK.
       */
      finishTimer = setTimeout(() => {
        setPhase('done');
      }, 3600);

    }, 1500);

    /*
     * Limpa todos os timers caso o componente
     * seja desmontado ou fechado.
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
   * Se a imagem do Digimon original ou
   * evoluído não existir, não abre a animação.
   */
  if (!fromImage || !toImage) {
    return null;
  }

  /*
   * A GIF aparece somente durante
   * a sequência de Digievolução.
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

            Ele fica preparado na mesma posição
            do Digimon original, mas começa
            invisível.
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

            A GIF fica NA FRENTE do Digimon.
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
   * Área central utilizada pelas imagens
   * do Digimon original e evoluído.
   */
  digimonContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },


  /*
   * =========================================
   * TAMANHO DO DIGIMON
   * =========================================
   *
   * Tamanho anterior:
   *
   * 154 x 154
   *
   * Redução adicional solicitada:
   *
   * 30%
   *
   * 154 × 0,70 = 107,8
   *
   * Arredondado:
   *
   * 108 x 108
   */
  digimon: {
    width: 108,
    height: 108,
  },


  /*
   * =========================================
   * CAMADA DA GIF
   * =========================================
   *
   * zIndex 10 mantém a animação
   * na frente do Digimon.
   */
  animationLayer: {
    ...StyleSheet.absoluteFillObject,

    zIndex: 10,

    alignItems: 'center',
    justifyContent: 'center',
  },


  /*
   * A GIF NÃO foi reduzida.
   *
   * Digimon:
   * 108 x 108
   *
   * GIF:
   * 320 x 320
   *
   * Assim o efeito continua envolvendo
   * o Digimon corretamente.
   */
  digivolutionAnimation: {
    width: 320,
    height: 320,
  },


  /*
   * =========================================
   * RESULTADO FINAL
   * =========================================
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
   * Botão OK.
   *
   * Ao tocar nele, onClose retorna
   * o jogador ao DigiBank.
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
