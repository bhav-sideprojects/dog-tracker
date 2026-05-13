import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
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

  const handleLog = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLog();
  };

  const isOverdue =
    props.kind === 'periodic' &&
    (props.daysSinceLast === null || props.daysSinceLast >= props.frequencyDays);

  const weeklyDone = props.kind === 'weekly' ? props.done >= props.target : false;

  const accentColor = isOverdue
    ? Colors.negative
    : weeklyDone
    ? Colors.positive
    : Colors.accent;

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
                  {
                    width: `${Math.min(1, props.done / props.target) * 100}%`,
                    backgroundColor: accentColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.stat, { color: accentColor }]}>
              {props.done}/{props.target}
            </Text>
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

      <Pressable
        onPress={handleLog}
        style={({ pressed }) => [styles.logBtn, { opacity: pressed ? 0.75 : 1 }]}
      >
        <Text style={styles.logBtnText}>LOG →→</Text>
      </Pressable>
    </OffsetCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    fontFamily: PIXEL_FONT,
    fontSize: 9,
    color: Colors.text,
    flex: 1,
  },
  body: {
    marginBottom: 12,
    gap: 4,
  },
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
  progressFill: {
    height: '100%',
    borderRadius: 2,
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
