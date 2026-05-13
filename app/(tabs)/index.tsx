import React from 'react';
import { ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, PIXEL_FONT } from '@/constants/theme';
import { BrowserBar } from '@/components/browser-bar';
import { DogMascot } from '@/components/dog-mascot';
import { Sparkle } from '@/components/sparkle';
import { OffsetCard } from '@/components/offset-card';
import { useAppData } from '@/hooks/use-app-data';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { dog, fillPercent, getWeeklyScore, getPeriodicScore } = useAppData();
  const insets = useSafeAreaInsets();

  if (!dog) return null;

  const walks = getWeeklyScore('walking');
  const teeth = getWeeklyScore('teeth');
  const worming = getPeriodicScore('worming');
  const vet = getPeriodicScore('vet');

  const healthPct = Math.round(fillPercent * 100);

  function periodicStatus(daysSince: number | null, freq: number): string {
    if (daysSince === null) return 'NEVER';
    if (daysSince >= freq) return 'OVERDUE';
    const remaining = freq - daysSince;
    if (remaining < 30) return `${remaining}D`;
    return `${Math.round(remaining / 30)}MO`;
  }

  return (
    <View style={styles.page}>
      <BrowserBar />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Dog name */}
        <View style={styles.nameRow}>
          <Sparkle size={10} />
          <Text style={styles.dogName}>{dog.name.toUpperCase()}{'\''}S HEALTH</Text>
          <Sparkle size={10} />
        </View>

        {/* Pixel mascot */}
        <View style={styles.mascotWrap}>
          <DogMascot breed={dog.breed} fillPercent={fillPercent} cellSize={14} />
        </View>

        {/* Health score */}
        <View style={styles.scoreWrap}>
          <Text style={styles.scoreBig}>{healthPct}%</Text>
          <Text style={styles.scoreSub}>{'HEALTH SCORE'}</Text>
        </View>

        {/* Weekly stats row */}
        <View style={styles.statsRow}>
          <OffsetCard style={[styles.statCard, { transform: [{ rotate: '-1.5deg' }] }] as StyleProp<ViewStyle>}>
            <Text style={styles.statEmoji}>🐾</Text>
            <Text style={styles.statValue}>{walks.done}/{walks.target}</Text>
            <Text style={styles.statLabel}>WALKS{'\n'}THIS WK</Text>
            <View style={[styles.statPill, {
              backgroundColor: walks.done >= walks.target ? Colors.positive : Colors.background,
            }]}>
              <Text style={[styles.statPillText, {
                color: walks.done >= walks.target ? '#FFF' : Colors.textMuted,
              }]}>
                {walks.done >= walks.target ? '✓ DONE' : 'IN PROG'}
              </Text>
            </View>
          </OffsetCard>

          <OffsetCard style={[styles.statCard, { transform: [{ rotate: '1.2deg' }] }] as StyleProp<ViewStyle>}>
            <Text style={styles.statEmoji}>🦷</Text>
            <Text style={styles.statValue}>{teeth.done}/{teeth.target}</Text>
            <Text style={styles.statLabel}>TEETH{'\n'}THIS WK</Text>
            <View style={[styles.statPill, {
              backgroundColor: teeth.done >= teeth.target ? Colors.positive : Colors.background,
            }]}>
              <Text style={[styles.statPillText, {
                color: teeth.done >= teeth.target ? '#FFF' : Colors.textMuted,
              }]}>
                {teeth.done >= teeth.target ? '✓ DONE' : 'IN PROG'}
              </Text>
            </View>
          </OffsetCard>
        </View>

        {/* Periodic care summary */}
        <OffsetCard style={styles.periodicCard}>
          <Text style={styles.periodicTitle}>CARE.LOG ✦</Text>
          <View style={styles.periodicRow}>
            <Text style={styles.periodicEmoji}>💊</Text>
            <Text style={styles.periodicLabel}>WORMING</Text>
            <Text style={[
              styles.periodicStatus,
              { color: worming.daysSinceLast !== null && worming.daysSinceLast < worming.frequencyDays
                  ? Colors.positive : Colors.negative },
            ]}>
              {periodicStatus(worming.daysSinceLast, worming.frequencyDays)}
            </Text>
          </View>
          <View style={[styles.periodicRow, { borderTopWidth: 1.5, borderTopColor: '#F0F0F0', paddingTop: 10 }]}>
            <Text style={styles.periodicEmoji}>🏥</Text>
            <Text style={styles.periodicLabel}>VET VISIT</Text>
            <Text style={[
              styles.periodicStatus,
              { color: vet.daysSinceLast !== null && vet.daysSinceLast < vet.frequencyDays
                  ? Colors.positive : Colors.negative },
            ]}>
              {periodicStatus(vet.daysSinceLast, vet.frequencyDays)}
            </Text>
          </View>
        </OffsetCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dogName: {
    fontFamily: PIXEL_FONT,
    fontSize: 10,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  mascotWrap: {
    marginBottom: 16,
  },
  scoreWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreBig: {
    fontFamily: PIXEL_FONT,
    fontSize: 36,
    color: Colors.accent,
    letterSpacing: 2,
  },
  scoreSub: {
    fontFamily: PIXEL_FONT,
    fontSize: 8,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: { fontSize: 22 },
  statValue: {
    fontFamily: PIXEL_FONT,
    fontSize: 18,
    color: Colors.accent,
  },
  statLabel: {
    fontFamily: PIXEL_FONT,
    fontSize: 7,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 13,
  },
  statPill: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginTop: 4,
  },
  statPillText: {
    fontFamily: PIXEL_FONT,
    fontSize: 6,
    letterSpacing: 0.5,
  },
  periodicCard: { width: '100%' },
  periodicTitle: {
    fontFamily: PIXEL_FONT,
    fontSize: 9,
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  periodicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  periodicEmoji: { fontSize: 18 },
  periodicLabel: {
    fontFamily: PIXEL_FONT,
    fontSize: 8,
    color: Colors.text,
    flex: 1,
  },
  periodicStatus: {
    fontFamily: PIXEL_FONT,
    fontSize: 8,
  },
});
