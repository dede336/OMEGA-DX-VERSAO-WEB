import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { getAscensionStars } from '@/utils/ascension';

interface Props {
  stars?: number;
  size?: 'small' | 'medium' | 'large';
}

const STAR_IMAGES = {
  1: require('../assets/images/1_star.gif'),
  2: require('../assets/images/2_star.gif'),
  3: require('../assets/images/3_star.gif'),
  4: require('../assets/images/4_star.gif'),
} as const;

export function AscensionStars({ stars = 0, size = 'medium' }: Props) {
  const count = getAscensionStars({ ascensionStars: stars });

  if (count === 0) return null;

  const normalSize =
    size === 'small' ? 16 :
    size === 'large' ? 38 :
    24;

  const fourStarSize =
    size === 'small' ? 27 :
    size === 'large' ? 62 :
    42;

  const imageSource = STAR_IMAGES[count as keyof typeof STAR_IMAGES];

  // 4 estrelas = uma única estrela multicolorida grande.
  if (count === 4) {
    return (
      <View
        accessibilityLabel="4 estrelas de ascensão"
        style={styles.row}
      >
        <Image
          source={imageSource}
          style={{
            width: fourStarSize,
            height: fourStarSize,
          }}
          resizeMode="contain"
        />
      </View>
    );
  }

  // 1 estrela = 1 imagem 1_star.gif
  // 2 estrelas = 2 imagens 2_star.gif
  // 3 estrelas = 3 imagens 3_star.gif
  return (
    <View
      accessibilityLabel={`${count} estrela${count === 1 ? '' : 's'} de ascensão`}
      style={styles.row}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Image
          key={`${count}_star_${index}`}
          source={imageSource}
          style={{
            width: normalSize,
            height: normalSize,
          }}
          resizeMode="contain"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 18,
  },
});
