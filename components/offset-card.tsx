import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';

type Props = {
  children: React.ReactNode;
  rotation?: number; // degrees, positive = clockwise
  style?: StyleProp<ViewStyle>;
};

export function OffsetCard({ children, rotation = 0, style }: Props) {
  return (
    <View
      style={[
        styles.card,
        rotation ? { transform: [{ rotate: `${rotation}deg` }] } : undefined,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderWidth: 2.5,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
  },
});
