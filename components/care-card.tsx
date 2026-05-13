import React, { useEffect, useRef } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, PIXEL_FONT } from '@/constants/theme';
import { OffsetCard } from './offset-card';
import { Sparkle } from './sparkle';

type Props = {
  emoji: string;
  label: string;
  onLog: () => void;
} & (
  | { kind: 'weekly'; done: number; target: number }
  | { kind: 'periodic'; daysSinceLast: number | null; frequencyDays: number; lastDate: string | null }
);

function formatDaysAgo(days: number | null): string {
  if (days === null) return 'Never';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function formatDaysUntil(daysSinceLast: number | null, frequencyDays: number): string {
  if (daysSinceLast === null) return 'Overdue!';
  const remaining = frequencyDays - daysSinceLast;
  if (remaining <= 0) return 'Overdue!';
  if (remaining === 1) return 'Tomorrow';
  return `In ${remaining}d`;
}

export function CareCard(props: Props) {
  const { emoji, label, onLog } = props;

  // ── counter bounce animation ──────────────────────────────────────────────
  const counterScale = useSharedValue(1);
  const plusOneOpacity = useSharedValue(0);
  const plusOneY = useSharedValue(0);
  const prevDone = useRef(props.kind === 'weekly' ? props.done : 0);

  useEffect(() => {
    if (props.kind !== 'weekly') return;
    if (props.done > prevDone.current) {
      // Bounce the score counter
      counterScale.value = withSequence(
        withSpring(1.5, { damping: 8, stiffness: 300 }),
        withSpring(1,   { damping: 12, stiffness: 200 }),
      );
      // Float "+1" up and fade out
      plusOneOpacity.value = 1;
      plusOneY.value = 0;
      plusOneOpacity.value = withSequence(
        withTiming(1, { duration: 50 }),
        withTiming(0, { duration: 700 }),
      );
      plusOneY.value = withTiming(-40, { duration: 750 });
    }
    prevDone.current = props.done;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.kind === 'weekly' ? props.done : null]);

  const counterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: counterScale.value }],
  }));
  const plusOneStyle = useAnimatedStyle(() => ({
    opacity: plusOneOpacity.value,
    transform: [{ translateY: plusOneY.value }],
  }));

  // ── button press animation ────────────────────────────────────────────────
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handleLog = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    btnScale.value = withSequence(
      withSpring(0.88, { damping: 10, stiffness: 400 }),
      withSpring(1,    { damping: 12, stiffness: 300 }),
    );
    onLog();
  };

  const isOverdue =
    props.kind === 'periodic' &&
    (props.daysSinceLast === null || props.daysSinceLast >= props.frequencyDays);
  const weeklyDone = props.kind === 'weekly' && props.done >= props.target;
  const accentColor = isOverdue ? Colors.negative : weeklyDone ? Colors.positive : Colors.accent;

  return (
    <OffsetCard style={[styles.card, { borderColor: accentColor }] as StyleProp<ViewStyle>}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
        {(weeklyDone || (props.kind === 'periodic' && !isOverdue)) && (
          <Sparkle size={14} color={accentColor} />
        )}
      </View>

      {props.kind === 'weekly' && (
        <View style={styles.body}>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(1, props.done / props.target) * 100}%`, backgroundColor: accentColor },
                ]}
              />
            </View>
            {/* Animated score counter */}
            <View style={styles.scoreWrap}>
              <Animated.View style={[styles.plusOneWrap, plusOneStyle]}>
                <Text style={[styles.plusOne, { color: accentColor }]}>+1</Text>
              </Animated.View>
              <Animated.View style={counterStyle}>
                <Text style={[styles.stat, { color: accentColor }]}>
                  {props.done}/{props.target}
                </Text>
              </Animated.View>
            </View>
          </View>
          <Text style={styles.sub}>THIS WEEK</Text>
        </View>
      )}

      {props.kind === 'periodic' && (
        <View style={styles.body}>
          <Text style={[styles.stat, { color: accentColor }]}>
            {formatDaysAgo(props.daysSinceLast)}
          </Text>
          <Text style={styles.sub}>
            NEXT: {formatDaysUntil(props.daysSinceLast, props.frequencyDays)}
          </Text>
        </View>
      )}

      <Animated.View style={btnStyle}>
        <Pressable onPress={handleLog} style={styles.logBtn}>
          <Text style={styles.logBtnText}>LOG →→</Text>
        </Pressable>
      </Animated.View>
    </OffsetCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  emoji: { fontSize: 20 },
  label: {
    fontFamily: PIXEL_FONT,
    fontSize: 9,
    color: Colors.text,
    flex: 1,
  },
  body: { marginBottom: 12, gap: 4 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  scoreWrap: {
    alignItems: 'center',
    minWidth: 44,
  },
  plusOneWrap: {
    position: 'absolute',
    bottom: 18,
  },
  plusOne: {
    fontFamily: PIXEL_FONT,
    fontSize: 10,
    fontWeight: '700',
  },
  stat: {
    fontFamily: PIXEL_FONT,
    fontSize: 14,
    color: Colors.text,
  },
  sub: {
    fontFamily: PIXEL_FONT,
    fontSize: 7,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  logBtn: {
    backgroundColor: Colors.text,
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-end',
  },
  logBtnText: {
    fontFamily: PIXEL_FONT,
    fontSize: 8,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
