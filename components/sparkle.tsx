import React from 'react';
import { Text, TextStyle } from 'react-native';
import { Colors } from '@/constants/theme';

type Props = { size?: number; color?: string; style?: TextStyle };

export function Sparkle({ size = 16, color = Colors.accent, style }: Props) {
  return (
    <Text style={[{ fontSize: size, color, lineHeight: size * 1.2 }, style]}>
      {'✦'}
    </Text>
  );
}
