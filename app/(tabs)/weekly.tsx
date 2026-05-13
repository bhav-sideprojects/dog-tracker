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

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const m = new Date(d);
  m.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  m.setHours(0, 0, 0, 0);
  return m;
}

function formatWeekRange(): string {
  const monday = getMonday(new Date());
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function generateMessage(
  dogName: string,
  weeklyGaps: { label: string; behind: number }[],
  overdueTypes: string[],
): string {
  const allDone = weeklyGaps.every(g => g.behind <= 0) && overdueTypes.length === 0;
  if (allDone) return `woof! ${dogName} is thriving this week! all goals smashed ✦`;

  const parts: string[] = [];
  weeklyGaps.filter(g => g.behind > 0).forEach(g => {
    parts.push(`${g.behind} more ${g.label}`);
  });
  overdueTypes.forEach(t => parts.push(`${t} is overdue!`));

  if (parts.length === 0) return `looking good this week! keep it up ✦`;
  return `hey! ${parts.join(' and ')} to sort this week 🐾`;
}

function WeekDayRow({ type, done, target }: { type: CareType; done: number; target: number }) {
  const { logs } = useAppData();
  const days = weekDaysWithLogs(logs, type);
  const isOnTrack = done >= target;

  return (
    <OffsetCard style={styles.weekCard}>
      <View style={styles.weekCardHeader}>
        <Text style={styles.weekCardTitle}>
          {type === 'walking' ? '🐾 WALKIES' : '🦷 TEETH BRUSHING'}
        </Text>
        <Text style={[styles.weekCardCount, { color: isOnTrack ? Colors.positive : Colors.accent }]}>
          {done}/{target}{isOnTrack ? ' ✓' : ''}
        </Text>
      </View>
      <View style={styles.dayRow}>
        {days.map(({ date, hasLog }, i) => {
          const isToday = date.toDateString() === new Date().toDateString();
          const isFuture = date > new Date();
          return (
            <View key={i} style={styles.dayCell}>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{DAY_LABELS[i]}</Text>
              <View style={[styles.dayDot, hasLog && styles.dayDotDone, isFuture && styles.dayDotFuture]}>
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
  const { dog, weeklyScores, periodicScores } = useAppData();
  const insets = useSafeAreaInsets();

  if (!dog) return null;

  const tracked = dog.trackedActivities;
  const { walking, teeth } = weeklyScores;
  const { worming, vet } = periodicScores;

  const weeklyGaps: { label: string; behind: number }[] = [];
  if (tracked.includes('walking')) weeklyGaps.push({ label: 'walk(s)', behind: walking.target - walking.done });
  if (tracked.includes('teeth'))   weeklyGaps.push({ label: 'brush(es)', behind: teeth.target - teeth.done });

  const overdueTypes: string[] = [];
  if (tracked.includes('worming') && (worming.daysSinceLast === null || worming.daysSinceLast >= worming.frequencyDays)) {
    overdueTypes.push('worming');
  }
  if (tracked.includes('vet') && (vet.daysSinceLast === null || vet.daysSinceLast >= vet.frequencyDays)) {
    overdueTypes.push('vet');
  }

  const message = generateMessage(dog.name, weeklyGaps, overdueTypes);

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

        {tracked.includes('walking') && (
          <WeekDayRow type="walking" done={walking.done} target={walking.target} />
        )}
        {tracked.includes('teeth') && (
          <WeekDayRow type="teeth" done={teeth.done} target={teeth.target} />
        )}

        {(tracked.includes('worming') || tracked.includes('vet')) && (
          <OffsetCard style={styles.periodicSummary}>
            <Text style={styles.weekCardTitle}>PERIODIC.CARE</Text>
            {tracked.includes('worming') && (
              <PeriodicRow
                emoji="💊" label="WORMING TABLET"
                daysSinceLast={worming.daysSinceLast}
                frequencyDays={worming.frequencyDays}
              />
            )}
            {tracked.includes('vet') && (
              <PeriodicRow
                emoji="🏥" label="VET VISIT"
                daysSinceLast={vet.daysSinceLast}
                frequencyDays={vet.frequencyDays}
                borderTop={tracked.includes('worming')}
              />
            )}
          </OffsetCard>
        )}
      </ScrollView>
    </View>
  );
}

function PeriodicRow({
  emoji, label, daysSinceLast, frequencyDays, borderTop = false,
}: {
  emoji: string; label: string; daysSinceLast: number | null; frequencyDays: number; borderTop?: boolean;
}) {
  const ok = daysSinceLast !== null && daysSinceLast < frequencyDays;
  const statusText = daysSinceLast === null
    ? 'NEVER LOGGED'
    : daysSinceLast >= frequencyDays
    ? `OVERDUE BY ${daysSinceLast - frequencyDays}D`
    : `NEXT IN ${frequencyDays - daysSinceLast}D`;

  return (
    <View style={[styles.periodicRow, borderTop && styles.periodicRowBorder]}>
      <Text style={styles.periodicEmoji}>{emoji}</Text>
      <View style={styles.periodicInfo}>
        <Text style={styles.periodicLabel}>{label}</Text>
        <Text style={[styles.periodicValue, { color: ok ? Colors.positive : Colors.negative }]}>
          {statusText}
        </Text>
      </View>
      <Text style={{ fontSize: 18 }}>{ok ? '✓' : '⚠'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { fontFamily: PIXEL_FONT, fontSize: 12, color: Colors.text },
  weekRange: { fontFamily: PIXEL_FONT, fontSize: 7, color: Colors.textMuted, marginBottom: 16, letterSpacing: 0.5 },
  weekCard: { marginBottom: 12 },
  weekCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  weekCardTitle: { fontFamily: PIXEL_FONT, fontSize: 8, color: Colors.text },
  weekCardCount: { fontFamily: PIXEL_FONT, fontSize: 10 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCell: { alignItems: 'center', gap: 4 },
  dayLabel: { fontFamily: PIXEL_FONT, fontSize: 7, color: Colors.textMuted },
  dayLabelToday: { color: Colors.accent },
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
  dayDotDone: { backgroundColor: Colors.positive, borderColor: Colors.positive },
  dayDotFuture: { borderColor: Colors.dogEmpty },
  dayCheck: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  periodicSummary: { marginBottom: 12 },
  periodicRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  periodicRowBorder: { borderTopWidth: 1.5, borderTopColor: '#F0F0F0' },
  periodicEmoji: { fontSize: 20 },
  periodicInfo: { flex: 1, gap: 2 },
  periodicLabel: { fontFamily: PIXEL_FONT, fontSize: 7, color: Colors.text },
  periodicValue: { fontFamily: PIXEL_FONT, fontSize: 7 },
});
