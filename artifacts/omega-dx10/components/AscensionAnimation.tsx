import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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

import {
  applyAscensionBonus,
} from '@/utils/ascension';

import {
  AscensionStars,
} from '@/components/AscensionStars';

type Props = {
  visible: boolean;
  characterId: string;
  previousStars: number;
  onClose: () => void;
};

const COLORS = [
  '#ffffff',
  '#ffffff',
  '#3b82f6',
  '#ef4444',
  '#facc15',
];

const FUSION_GIF =
  require('../assets/images/fusion_crimson.webp');

export default function AscensionAnimation({
  visible,
  characterId,
  previousStars,
  onClose,
}: Props) {

  const left =
    useRef(new Animated.Value(-150)).current;

  const right =
    useRef(new Animated.Value(150)).current;

  const silhouettes =
    useRef(new Animated.Value(1)).current;

  const flash =
    useRef(new Animated.Value(0)).current;

  const result =
    useRef(new Animated.Value(0)).current;

  const [showResult, setShowResult] =
    useState(false);

  const stars =
    Math.min(4, previousStars + 1);

  const color =
    COLORS[stars];

  const character =
    getCharacter(characterId);

  const image =
    getCharacterImageSource(characterId);

  const gains = useMemo(() => {

    if (!character) {
      return [];
    }

    const before =
      applyAscensionBonus(
        character.baseStats,
        previousStars
      );

    const after =
      applyAscensionBonus(
        character.baseStats,
        stars
      );

    return [
      ['HP', before.hp, after.hp],
      ['MP', before.mp, after.mp],
      ['ATQ', before.atk, after.atk],
      ['DEF', before.def, after.def],
      ['ESP', before.spt, after.spt],
      ['VEL', before.spd, after.spd],
    ] as [string, number, number][];

  }, [
    character,
    previousStars,
    stars,
  ]);

  useEffect(() => {

    if (!visible) return;

    left.setValue(-150);
    right.setValue(150);

    silhouettes.setValue(1);

    flash.setValue(0);

    result.setValue(0);

    setShowResult(false);

    Animated.sequence([

      Animated.delay(300),

      Animated.parallel([

        Animated.timing(left, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),

        Animated.timing(right, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),

      ]),

      Animated.parallel([

        Animated.timing(
          silhouettes,
          {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }
        ),

        Animated.sequence([

          Animated.timing(
            flash,
            {
              toValue: 1,
              duration: 160,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            flash,
            {
              toValue: 0,
              duration: 520,
              useNativeDriver: true,
            }
          ),

        ]),

      ]),

      Animated.timing(
        result,
        {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }
      ),

    ]).start(() => {

      setShowResult(true);

    });

  }, [
    flash,
    left,
    result,
    right,
    silhouettes,
    visible,
  ]);

  if (!image) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={() => {}}
    >

      <View style={styles.screen}>

        <ExpoImage
          source={FUSION_GIF}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />

        <View
          style={styles.backgroundDim}
        />

        <View style={styles.stage}>

          {/* PRIMEIRO DIGIMON */}

          <Animated.View
            style={[
              styles.silhouette,
              {
                opacity: silhouettes,
                transform: [
                  {
                    translateX: left,
                  },
                ],
              },
            ]}
          >

            <ExpoImage
              source={image}
              style={[
                styles.sprite,
                styles.whiteSilhouette,
              ]}
              contentFit="contain"
            />

          </Animated.View>

          {/* SEGUNDO DIGIMON */}

          <Animated.View
            style={[
              styles.silhouette,
              {
                opacity: silhouettes,
                transform: [
                  {
                    translateX: right,
                  },
                ],
              },
            ]}
          >

            <ExpoImage
              source={image}
              style={[
                styles.sprite,
                styles.whiteSilhouette,
              ]}
              contentFit="contain"
            />

          </Animated.View>

          {/* FLASH */}

          <Animated.View
            style={[
              styles.glow,
              {
                backgroundColor: color,
                opacity: flash,
                shadowColor: color,
              },
            ]}
          />

          {/* RESULTADO */}

          <Animated.View
            style={[
              styles.result,
              {
                opacity: result,
                shadowColor: color,
              },
            ]}
          >

            <Image
              source={image}
              style={styles.resultSprite}
              resizeMode="contain"
            />

            <AscensionStars
              stars={stars}
              size="large"
            />

          </Animated.View>

        </View>

        {/* RESULTADO FINAL */}

        {showResult && (

          <View
            style={[
              styles.summary,
              {
                borderColor: color,
                shadowColor: color,
              },
            ]}
          >

            <Text
              style={[
                styles.title,
                {
                  color,
                },
              ]}
            >
              ASCENSÃO CONCLUÍDA
            </Text>

            <Text
              style={styles.subtitle}
            >
              Poder elevado em 20%
            </Text>

            <View style={styles.grid}>

              {gains.map(
                ([
                  label,
                  before,
                  after,
                ]) => (

                  <View
                    key={label}
                    style={styles.stat}
                  >

                    <Text
                      style={styles.statLabel}
                    >
                      {label}
                    </Text>

                    <Text
                      style={styles.statValue}
                    >
                      {before} → {after}
                    </Text>

                    <Text
                      style={[
                        styles.statGain,
                        {
                          color,
                        },
                      ]}
                    >
                      +{after - before}
                    </Text>

                  </View>

                )
              )}

            </View>

            <TouchableOpacity
              style={[
                styles.continue,
                {
                  backgroundColor: color,
                },
              ]}
              onPress={onClose}
              activeOpacity={0.85}
            >

              <Text
                style={styles.continueText}
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

const styles =
  StyleSheet.create({

    screen: {
      flex: 1,
      backgroundColor: '#000',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },

    backgroundDim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        'rgba(0,0,0,0.28)',
    },

    stage: {
      width: '100%',
      height: 300,
      alignItems: 'center',
      justifyContent: 'center',
    },

    silhouette: {
      position: 'absolute',
    },

    sprite: {
      width: 150,
      height: 150,
    },

    whiteSilhouette: {
      tintColor: '#fff',
      backgroundColor:
        'transparent',
    },

    glow: {
      position: 'absolute',
      width: 210,
      height: 210,
      borderRadius: 105,
      shadowOpacity: 1,
      shadowRadius: 55,
      elevation: 30,
    },

    result: {
      position: 'absolute',
      alignItems: 'center',
      gap: 8,
      shadowOpacity: 1,
      shadowRadius: 30,
    },

    resultSprite: {
      width: 180,
      height: 180,
    },

    summary: {
      width: '100%',
      maxWidth: 480,
      borderWidth: 2,
      borderRadius: 18,
      padding: 16,
      backgroundColor: '#09090b',
      shadowOpacity: 0.8,
      shadowRadius: 18,
    },

    title: {
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '900',
    },

    subtitle: {
      color: '#86efac',
      textAlign: 'center',
      fontSize: 13,
      fontWeight: '800',
      marginTop: 4,
      marginBottom: 12,
    },

    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    stat: {
      width: '48%',
      backgroundColor: '#18181b',
      borderRadius: 10,
      padding: 8,
    },

    statLabel: {
      color: '#94a3b8',
      fontSize: 10,
      fontWeight: '900',
    },

    statValue: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '800',
      marginTop: 2,
    },

    statGain: {
      fontSize: 11,
      fontWeight: '900',
      marginTop: 2,
    },

    continue: {
      marginTop: 14,
      borderRadius: 10,
      paddingVertical: 12,
    },

    continueText: {
      color: '#000',
      textAlign: 'center',
      fontWeight: '900',
    },

  });
