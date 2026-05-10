/**
 * MedicineIcon — ícono visual según la forma farmacéutica del medicamento.
 * Usa emojis como fallback universal (sin dependencias de fuentes de íconos).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius } from '../theme';

interface MedicineIconProps {
  pharmaceuticalForm: string;
  size?: number;
}

function getIconData(form: string): { emoji: string; bg: string } {
  const f = form.toLowerCase();
  if (f.includes('comprimido') || f.includes('tableta') || f.includes('pastilla'))
    return { emoji: '💊', bg: '#E8F0FE' };
  if (f.includes('cápsula') || f.includes('capsula'))
    return { emoji: '💊', bg: '#F3E5F5' };
  if (f.includes('jarabe') || f.includes('solución') || f.includes('solucion') || f.includes('suspensión'))
    return { emoji: '🧴', bg: '#E1F5FE' };
  if (f.includes('inyectable') || f.includes('ampolla') || f.includes('vial'))
    return { emoji: '💉', bg: '#FCE4EC' };
  if (f.includes('crema') || f.includes('ungüento') || f.includes('gel') || f.includes('pomada'))
    return { emoji: '🧴', bg: '#F9FBE7' };
  if (f.includes('gotas') || f.includes('colirio'))
    return { emoji: '💧', bg: '#E0F7FA' };
  if (f.includes('parche') || f.includes('transdérmico'))
    return { emoji: '🩹', bg: '#FFF8E1' };
  if (f.includes('inhalador') || f.includes('aerosol'))
    return { emoji: '🫁', bg: '#E8F5E9' };
  if (f.includes('supositorio'))
    return { emoji: '💊', bg: '#FBE9E7' };
  return { emoji: '💊', bg: '#F5F5F5' };
}

export function MedicineIcon({ pharmaceuticalForm, size = 48 }: MedicineIconProps) {
  const { emoji, bg } = getIconData(pharmaceuticalForm);
  const fontSize = size * 0.5;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: Radius.md,
          backgroundColor: bg,
        },
      ]}
      accessibilityLabel={pharmaceuticalForm}
    >
      <Text style={{ fontSize }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MedicineIcon;
