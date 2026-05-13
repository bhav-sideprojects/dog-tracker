import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, PIXEL_FONT } from '@/constants/theme';
import { DogMascot } from './dog-mascot';
import { BreedId } from '@/store/types';

type Props = {
  message: string;
  breed: BreedId;
};

export function ChatBubble({ message, breed }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <DogMascot breed={breed} fillPercent={1} cellSize={5} />
      </View>
      <View style={styles.bubble}>
        <Text style={styles.text}>{message}</Text>
        <View style={styles.tail} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginVertical: 6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tail: {
    position: 'absolute',
    left: -8,
    bottom: 6,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderRightColor: Colors.border,
  },
  text: {
    fontFamily: PIXEL_FONT,
    fontSize: 8,
    color: Colors.text,
    lineHeight: 16,
  },
});
