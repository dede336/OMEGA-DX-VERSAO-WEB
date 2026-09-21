import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getAscensionStars } from '@/utils/ascension';

interface Props {
  stars?: number;
  size?: 'small' | 'medium' | 'large';
}

const GLOW_COLORS = ['transparent', '#ffffff', '#38bdf8', '#ef4444', '#facc15'] as const;

export function AscensionStars({ stars = 0, size = 'medium' }: Props) {
  const count = getAscensionStars({ ascensionStars: stars });
  if (count === 0) return null;

  const fontSize = size === 'small' ? 12 : size === 'large' ? 30 : 18;
  const glow = GLOW_COLORS[count];
  const isGolden = count === 4;

  return (
    <View
      accessibilityLabel={`${count} estrela${count === 1 ? '' : 's'} de ascensão`}
      style={[styles.row, isGolden && styles.goldenRow]}
    >
      {Array.from({ length: isGolden ? 1 : count }).map((_, index) => (
        <Text
          key={index}
          style={[
            styles.star,
            {
              color: isGolden ? '#ffd700' : '#facc15',
              fontSize: isGolden ? fontSize * 1.55 : fontSize,
              textShadowColor: glow,
              textShadowRadius: isGolden ? 14 : 8,
            },
          ]}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 18 },
  goldenRow: { minHeight: 32 },
  star: { fontWeight: '900', textShadowOffset: { width: 0, height: 0 } },
});
