import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, PIXEL_FONT } from '@/constants/theme';

type Props = { path?: string };

export function BrowserBar({ path = '' }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
      <View style={styles.dots}>
        <View style={[styles.dot, { backgroundColor: '#FF5F57' }]} />
        <View style={[styles.dot, { backgroundColor: '#FFBD2E' }]} />
        <View style={[styles.dot, { backgroundColor: '#28C840' }]} />
      </View>
      <View style={styles.urlBar}>
        <Text style={styles.url} numberOfLines={1}>
          {'dog-tracker.exe'}
          {path ? `/${path}` : ''}
        </Text>
      </View>
      <Pressable onPress={() => router.push('/settings')} style={styles.settingsBtn} hitSlop={8}>
        <Text style={styles.settingsIcon}>⚙</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  urlBar: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  url: {
    fontFamily: PIXEL_FONT,
    fontSize: 8,
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  settingsBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 18,
    color: Colors.text,
  },
});
