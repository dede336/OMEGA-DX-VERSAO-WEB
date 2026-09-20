import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Props {
  value: number;
  max: number;
  onChange: (value: number) => void;
  color: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  availableLabel: string;
}

export default function BatteryQuantityPicker({
  value, max, onChange, color, borderColor, textColor, mutedColor, availableLabel,
}: Props) {
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const repeatedRef = useRef(false);

  const change = useCallback((amount: number) => {
    const upper = Math.max(1, max);
    onChange(Math.max(1, Math.min(upper, value + amount)));
  }, [max, onChange, value]);

  const stopHold = useCallback(() => {
    if (delayRef.current) clearTimeout(delayRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    delayRef.current = null;
    intervalRef.current = null;
  }, []);

  const startHold = (amount: number) => {
    stopHold();
    repeatedRef.current = false;
    delayRef.current = setTimeout(() => {
      repeatedRef.current = true;
      change(amount);
      intervalRef.current = setInterval(() => change(amount), 90);
    }, 350);
  };

  const tap = (amount: number) => {
    if (repeatedRef.current) {
      repeatedRef.current = false;
      return;
    }
    change(amount);
  };

  useEffect(() => stopHold, [stopHold]);

  const disabled = max <= 0;

  return (
    <>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.textButton, { borderColor }]}
          disabled={disabled}
          onPress={() => change(-10)}
        >
          <Text style={[styles.buttonText, { color: textColor }]}>−10</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, { borderColor }]}
          disabled={disabled}
          onPress={() => tap(-1)}
          onPressIn={() => startHold(-1)}
          onPressOut={stopHold}
        >
          <Feather name="minus" size={18} color={textColor} />
        </TouchableOpacity>

        <Text style={[styles.quantity, { color: textColor }]}>{value}</Text>

        <TouchableOpacity
          style={[styles.iconButton, { borderColor }]}
          disabled={disabled}
          onPress={() => tap(1)}
          onPressIn={() => startHold(1)}
          onPressOut={stopHold}
        >
          <Feather name="plus" size={18} color={textColor} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.textButton, { borderColor }]}
          disabled={disabled}
          onPress={() => change(10)}
        >
          <Text style={[styles.buttonText, { color: textColor }]}>+10</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.maxButton, { backgroundColor: color }]}
          disabled={disabled}
          onPress={() => onChange(Math.max(1, max))}
        >
          <Text style={styles.maxText}>MÁX.</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.available, { color: mutedColor }]}>{availableLabel}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center',
    justifyContent: 'center', gap: 7, marginBottom: 6,
  },
  iconButton: {
    width: 40, height: 40, borderRadius: 10, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  textButton: {
    minWidth: 45, height: 40, paddingHorizontal: 7, borderRadius: 10,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  buttonText: { fontSize: 11, fontWeight: '900' },
  quantity: {
    minWidth: 42, fontSize: 18, fontWeight: '900', textAlign: 'center',
  },
  maxButton: {
    minWidth: 52, height: 40, paddingHorizontal: 8, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  maxText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  available: { fontSize: 10, textAlign: 'center', marginBottom: 8 },
});
