import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, PIXEL_FONT } from '@/constants/theme';
import { BrowserBar } from '@/components/browser-bar';
import { ChatBubble } from '@/components/chat-bubble';
import { OffsetCard } from '@/components/offset-card';
import { Sparkle } from '@/components/sparkle';
import { useAppData, weekDaysWithLogs } from '@/hooks/use-app-data';
import { CareType } from '@/store/types';
import { CARE_ACTIVITIES } from '@/constants/care-activities';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const m = new Date(d);
  m.setDate(diff);
  return m;
}

function formatWeekRange(): string {
  const monday = getMonday(new Date());
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function generateMessage(
  dogName: string,
  walksDone: number, walksTarget: number,
  teethDone: number, teethTarget: number,
): string {
  const walksBehind = walksTarget - walksDone;
  const teethBehind = teethTarget - teethDone;

  if (walksDone >= walksTarget && teethDone >= teethTarget) {
    return `woof! ${dogName} is thriving this week! all goals smashed ✦`;
  }
  if (walksBehind > 0 && teethBehind > 0) {
    return `hey! ${walksBehind} walk${walksBehind > 1 ? 's' : ''} and ${teethBehind} brush${teethBehind > 1 ? 'es' : ''} to go this week 🐾🦷`;
  }
  if (walksBehind > 0) {
    return `time for walkies! ${walksBehind} more walk${walksBehind > 1 ? 's' : ''} to hit the goal this week 🐾`;
  }
  if (teethBehind > 0) {
    return `don't forget the toothbrush! ${teethBehind} more brush${teethBehind > 1 ? 'es' : ''} left this week 🦷`;
  }
  return `looking good! keep it up this week ✦`;
}

type DayRowProps = { type: CareType; label: string; done: number; target: number };

function WeekDayRow({ type, label, done, target }: DayRowProps) {
  const { logs } = useAppData();
  const days = weekDaysWithLogs(logs, type);
  const isOnTrack = done >= target;

  return (
    <OffsetCard style={styles.weekCard}>
      <View style={styles.weekCardHeader}>
        <Text style={styles.weekCardTitle}>{label}</Text>
        <Text style={[styles.weekCardCount, { color: isOnTrack ? Colors.positive : Colors.accent }]}>
          {done}/{target} {isOnTrack ? '✓' : ''}
        </Text>
      </View>
      <View style={styles.dayRow}>
        {days.map(({ date, hasLog }, i) => {
          const isToday = date.toDateString() === new Date().toDateString();
          const isFuture = date > new Date();
          return (
            <View key={i} style={styles.dayCell}>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {DAY_LABELS[i]}
              </Text>
              <View
                style={[
                  styles.dayDot,
                  hasLog && styles.dayDotDone,
                  isFuture && styles.dayDotFuture,
                ]}
              >
                {hasLog && <Text style={styles.dayCheck}>✓</Text>}
              </View>
            </View>
          );
        })}
      </View>
    </OffsetCard>
  );
}

export default function WeeklyScreen() {
  const { dog, getWeeklyScore, getPeriodicScore } = useAppData();
  const insets = useSafeAreaInsets();

  if (!dog) return null;

  const walks = getWeeklyScore('walking');
  const teeth = getWeeklyScore('teeth');
  const worming = getPeriodicScore('worming');
  const vet = getPeriodicScore('vet');

  const message = generateMessage(dog.name, walks.done, walks.target, teeth.done, teeth.target);

  const wormingOk = worming.daysSinceLast !== null && worming.daysSinceLast < worming.frequencyDays;
  const vetOk = vet.daysSinceLast !== null && vet.daysSinceLast < vet.frequencyDays;

  return (
    <View style={styles.page}>
      <BrowserBar path="weekly" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>WEEKLY.REPORT</Text>
          <Sparkle size={12} />
        </View>
        <Text style={styles.weekRange}>{formatWeekRange()}</Text>

        <ChatBubble message={message} breed={dog.breed} />

        <WeekDayRow
          type="walking"
          label={`🐾 ${CARE_ACTIVITIES.walking.label.toUpperCase()}`}
          done={walks.done}
          target={walks.target}
        />

        <WeekDayRow
          type="teeth"
          label={`🦷 ${CARE_ACTIVITIES.teeth.label.toUpperCase()}`}
          done={teeth.done}
          target={teeth.target}
        />

        {/* Periodic summary */}
        <OffsetCard style={styles.periodicSummary}>
          <Text style={styles.weekCardTitle}>PERIODIC.CARE</Text>
          <View style={styles.periodicRow}>
            <Text style={styles.periodicEmoji}>💊</Text>
            <View style={styles.periodicInfo}>
              <Text style={styles.periodicLabel}>WORMING TABLET</Text>
              <Text style={[styles.periodicValue, { color: wormingOk ? Colors.positive : Colors.negative }]}>
                {worming.daysSinceLast === null
                  ? 'NEVER LOGGED'
                  : worming.daysSinceLast >= worming.frequencyDays
                  ? `OVERDUE BY ${worming.daysSinceLast - worming.frequencyDays}D`
                  : `NEXT IN ${worming.frequencyDays - worming.daysSinceLast}D`}
              </Text>
            </View>
            <Text style={{ fontSize: 18 }}>{wormingOk ? '✓' : '!'}</Text>
          </View>
          <View style={[styles.periodicRow, { borderTopWidth: 1.5, borderTopColor: '#F0F0F0', paddingTop: 10 }]}>
            <Text style={styles.periodicEmoji}>🏥</Text>
            <View style={styles.periodicInfo}>
              <Text style={styles.periodicLabel}>VET VISIT</Text>
              <Text style={[styles.periodicValue, { color: vetOk ? Colors.positive : Colors.negative }]}>
                {vet.daysSinceLast === null
                  ? 'NEVER LOGGED'
                  : vet.daysSinceLast >= vet.frequencyDays
                  ? `OVERDUE BY ${vet.daysSinceLast - vet.frequencyDays}D`
                  : `NEXT IN ${vet.frequencyDays - vet.daysSinceLast}D`}
              </Text>
            </View>
            <Text style={{ fontSize: 18 }}>{vetOk ? '✓' : '!'}</Text>
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
    paddingTop: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontFamily: PIXEL_FONT,
    fontSize: 12,
    color: Colors.text,
  },
  weekRange: {
    fontFamily: PIXEL_FONT,
    fontSize: 7,
    color: Colors.textMuted,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  weekCard: { marginBottom: 12 },
  weekCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekCardTitle: {
    fontFamily: PIXEL_FONT,
    fontSize: 8,
    color: Colors.text,
  },
  weekCardCount: {
    fontFamily: PIXEL_FONT,
    fontSize: 10,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    alignItems: 'center',
    gap: 4,
  },
  dayLabel: {
    fontFamily: PIXEL_FONT,
    fontSize: 7,
    color: Colors.textMuted,
  },
  dayLabelToday: {
    color: Colors.accent,
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotDone: {
    backgroundColor: Colors.positive,
    borderColor: Colors.positive,
  },
  dayDotFuture: {
    borderColor: Colors.dogEmpty,
  },
  dayCheck: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  periodicSummary: { marginBottom: 12 },
  periodicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  periodicEmoji: { fontSize: 20 },
  periodicInfo: { flex: 1, gap: 2 },
  periodicLabel: {
    fontFamily: PIXEL_FONT,
    fontSize: 7,
    color: Colors.text,
  },
  periodicValue: {
    fontFamily: PIXEL_FONT,
    fontSize: 7,
  },
});
