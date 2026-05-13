import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, PIXEL_FONT } from '@/constants/theme';
import { BrowserBar } from '@/components/browser-bar';
import { DogMascot } from '@/components/dog-mascot';
import { Sparkle } from '@/components/sparkle';
import { OffsetCard } from '@/components/offset-card';
import { useAppData } from '@/hooks/use-app-data';

export default function HomeScreen() {
  const { dog, fillPercent, weeklyScores, periodicScores, logCare } = useAppData();
  const insets = useSafeAreaInsets();

  // ── Animate health % when fillPercent changes ─────────────────────────────
  const scoreScale = useSharedValue(1);
  const prevFill = useRef(fillPercent);

  useEffect(() => {
    if (Math.abs(fillPercent - prevFill.current) > 0.005) {
      scoreScale.value = withSequence(
        withSpring(1.25, { damping: 8, stiffness: 300 }),
        withSpring(1,    { damping: 12, stiffness: 200 }),
      );
    }
    prevFill.current = fillPercent;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fillPercent]);

  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  if (!dog) return null;

  const healthPct = Math.round(fillPercent * 100);
  const { worming, vet, grooming } = periodicScores;
  const { walking, teeth, training } = weeklyScores;

  function periodicStatus(daysSince: number | null, freq: number): string {
    if (daysSince === null) return 'NEVER';
    if (daysSince >= freq) return 'OVERDUE';
    const rem = freq - daysSince;
    return rem < 30 ? `${rem}D` : `${Math.round(rem / 30)}MO`;
  }

  const trackedWeekly   = dog.trackedActivities.filter(t => t === 'walking' || t === 'teeth' || t === 'training') as ('walking' | 'teeth' | 'training')[];
  const trackedPeriodic = dog.trackedActivities.filter(t => t === 'worming' || t === 'vet' || t === 'grooming') as ('worming' | 'vet' | 'grooming')[];

  const QUICK_LOG_ITEMS = [
    { type: 'walking'  as const, emoji: '🐾', label: 'Walk' },
    { type: 'teeth'    as const, emoji: '🦷', label: 'Teeth' },
    { type: 'training' as const, emoji: '🎓', label: 'Train' },
    { type: 'worming'  as const, emoji: '💊', label: 'Worming' },
    { type: 'vet'      as const, emoji: '🏥', label: 'Vet' },
    { type: 'grooming' as const, emoji: '✂️', label: 'Groom' },
  ].filter(item => dog.trackedActivities.includes(item.type));

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

        {/* Animated health score */}
        <View style={styles.scoreWrap}>
          <Animated.View style={scoreStyle}>
            <Text style={styles.scoreBig}>{healthPct}%</Text>
          </Animated.View>
          <Text style={styles.scoreSub}>{'HEALTH SCORE'}</Text>
        </View>

        {/* Weekly stat cards */}
        {trackedWeekly.length > 0 && (
          <View style={styles.statsRow}>
            {trackedWeekly.map((type, i) => {
              const score = type === 'walking' ? walking : type === 'teeth' ? teeth : training;
              const emoji = type === 'walking' ? '🐾' : type === 'teeth' ? '🦷' : '🎓';
              const label = type === 'walking' ? 'WALKS\nTHIS WK' : type === 'teeth' ? 'TEETH\nTHIS WK' : 'TRAIN\nTHIS WK';
              const done = score.done >= score.target;
              return (
                <OffsetCard
                  key={type}
                  style={[styles.statCard, { transform: [{ rotate: i % 2 === 0 ? '-1.5deg' : '1.2deg' }] }] as StyleProp<ViewStyle>}
                >
                  <Text style={styles.statEmoji}>{emoji}</Text>
                  <Text style={[styles.statValue, { color: done ? Colors.positive : Colors.accent }]}>
                    {score.done}/{score.target}
                  </Text>
                  <Text style={styles.statLabel}>{label}</Text>
                  <View style={[styles.statPill, { backgroundColor: done ? Colors.positive : Colors.background }]}>
                    <Text style={[styles.statPillText, { color: done ? '#FFF' : Colors.textMuted }]}>
                      {done ? '✓ DONE' : 'IN PROG'}
                    </Text>
                  </View>
                </OffsetCard>
              );
            })}
          </View>
        )}

        {/* Periodic care summary */}
        {trackedPeriodic.length > 0 && (
          <OffsetCard style={styles.periodicCard}>
            <Text style={styles.periodicTitle}>CARE.LOG ✦</Text>
            {trackedPeriodic.map((type, i) => {
              const score = type === 'worming' ? worming : type === 'vet' ? vet : grooming;
              const ok = score.daysSinceLast !== null && score.daysSinceLast < score.frequencyDays;
              const emoji = type === 'worming' ? '💊' : type === 'vet' ? '🏥' : '✂️';
              const lbl   = type === 'worming' ? 'WORMING' : type === 'vet' ? 'VET VISIT' : 'GROOMING';
              return (
                <View
                  key={type}
                  style={[
                    styles.periodicRow,
                    i > 0 && { borderTopWidth: 1.5, borderTopColor: '#F0F0F0', paddingTop: 10 },
                  ]}
                >
                  <Text style={styles.periodicEmoji}>{emoji}</Text>
                  <Text style={styles.periodicLabel}>{lbl}</Text>
                  <Text style={[styles.periodicStatus, { color: ok ? Colors.positive : Colors.negative }]}>
                    {periodicStatus(score.daysSinceLast, score.frequencyDays)}
                  </Text>
                </View>
              );
            })}
          </OffsetCard>
        )}

        {/* Quick log */}
        <OffsetCard style={styles.quickLogCard}>
          <Text style={styles.quickLogTitle}>QUICK.LOG ✦</Text>
          <View style={styles.quickLogRow}>
            {QUICK_LOG_ITEMS.map(item => (
              <QuickLogButton
                key={item.type}
                emoji={item.emoji}
                label={item.label}
                onPress={() => logCare(item.type)}
              />
            ))}
          </View>
        </OffsetCard>
      </ScrollView>
    </View>
  );
}

function QuickLogButton({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withSpring(0.85, { damping: 10, stiffness: 400 }),
      withSpring(1,    { damping: 12, stiffness: 300 }),
    );
    onPress();
  };

  return (
    <Animated.View style={[styles.quickBtn, animStyle]}>
      <Pressable onPress={handlePress} style={styles.quickBtnInner}>
        <Text style={styles.quickBtnEmoji}>{emoji}</Text>
        <Text style={styles.quickBtnLabel}>{label.toUpperCase()}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 16, alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dogName: { fontFamily: PIXEL_FONT, fontSize: 10, color: Colors.text, letterSpacing: 0.5 },
  mascotWrap: { marginBottom: 16 },
  scoreWrap: { alignItems: 'center', marginBottom: 20 },
  scoreBig: { fontFamily: PIXEL_FONT, fontSize: 36, color: Colors.accent, letterSpacing: 2 },
  scoreSub: { fontFamily: PIXEL_FONT, fontSize: 8, color: Colors.textMuted, letterSpacing: 1, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 12 },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statEmoji: { fontSize: 22 },
  statValue: { fontFamily: PIXEL_FONT, fontSize: 18, color: Colors.accent },
  statLabel: { fontFamily: PIXEL_FONT, fontSize: 7, color: Colors.textMuted, textAlign: 'center', lineHeight: 13 },
  statPill: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginTop: 4,
  },
  statPillText: { fontFamily: PIXEL_FONT, fontSize: 6, letterSpacing: 0.5 },
  periodicCard: { width: '100%', marginBottom: 12 },
  periodicTitle: { fontFamily: PIXEL_FONT, fontSize: 9, color: Colors.text, marginBottom: 12, letterSpacing: 0.5 },
  periodicRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  periodicEmoji: { fontSize: 18 },
  periodicLabel: { fontFamily: PIXEL_FONT, fontSize: 8, color: Colors.text, flex: 1 },
  periodicStatus: { fontFamily: PIXEL_FONT, fontSize: 8 },
  quickLogCard: { width: '100%' },
  quickLogTitle: { fontFamily: PIXEL_FONT, fontSize: 9, color: Colors.text, marginBottom: 12, letterSpacing: 0.5 },
  quickLogRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: { flex: 1, minWidth: '40%' },
  quickBtnInner: {
    backgroundColor: Colors.text,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  quickBtnEmoji: { fontSize: 22 },
  quickBtnLabel: { fontFamily: PIXEL_FONT, fontSize: 7, color: '#FFF', letterSpacing: 0.5 },
});
