import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, PIXEL_FONT } from '@/constants/theme';
import { ACTIVITY_COLORS, CARE_ACTIVITIES } from '@/constants/care-activities';
import { BrowserBar } from '@/components/browser-bar';
import { ChatBubble } from '@/components/chat-bubble';
import { OffsetCard } from '@/components/offset-card';
import { Sparkle } from '@/components/sparkle';
import { useAppData, weekDaysWithLogs } from '@/hooks/use-app-data';
import { CareType } from '@/store/types';

type Period = 'week' | 'month' | 'year';
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

// ── date helpers ──────────────────────────────────────────────────────────────

function getMonday(d: Date): Date {
  const day = d.getDay();
  const m = new Date(d);
  m.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  m.setHours(0, 0, 0, 0);
  return m;
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function getCalendarDays(year: number, month: number): { date: Date; inMonth: boolean }[] {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const leadingDays = startDow === 0 ? 6 : startDow - 1;

  const days: { date: Date; inMonth: boolean }[] = [];
  for (let i = leadingDays - 1; i >= 0; i--) {
    const d = new Date(firstDay);
    d.setDate(d.getDate() - i - 1);
    days.push({ date: d, inMonth: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), inMonth: true });
  }
  const trailing = 7 - (days.length % 7);
  if (trailing < 7) {
    for (let i = 1; i <= trailing; i++) {
      const d = new Date(lastDay);
      d.setDate(d.getDate() + i);
      days.push({ date: d, inMonth: false });
    }
  }
  return days;
}

// ── chat message generators ───────────────────────────────────────────────────

function weekMessage(dogName: string, weeklyGaps: { label: string; behind: number }[], overdueTypes: string[]): string {
  const allDone = weeklyGaps.every(g => g.behind <= 0) && overdueTypes.length === 0;
  if (allDone) return `woof! ${dogName} is thriving this week! all goals smashed ✦`;
  const parts: string[] = [];
  weeklyGaps.filter(g => g.behind > 0).forEach(g => parts.push(`${g.behind} more ${g.label}`));
  overdueTypes.forEach(t => parts.push(`${t} is overdue!`));
  return parts.length === 0 ? `looking good this week! keep it up ✦` : `hey! ${parts.join(' and ')} to sort this week 🐾`;
}

function monthMessage(dogName: string, year: number, month: number): string {
  const name = MONTH_NAMES[month];
  const now = new Date();
  if (year === now.getFullYear() && month === now.getMonth()) {
    return `${dogName}'s ${name} summary — how's it going so far? 🐾`;
  }
  return `${dogName}'s ${name} ${year} recap ✦`;
}

function yearMessage(dogName: string, year: number): string {
  return `${dogName}'s ${year} in review — here's the full picture ✦`;
}

// ── sub-components ────────────────────────────────────────────────────────────

function PeriodSelector({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  const options: Period[] = ['week', 'month', 'year'];
  return (
    <View style={styles.periodRow}>
      {options.map(p => (
        <Pressable
          key={p}
          onPress={() => { Haptics.selectionAsync(); onChange(p); }}
          style={[styles.periodBtn, period === p && styles.periodBtnActive]}
        >
          <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>
            {p.toUpperCase()}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function WeekDayRow({ type, done, target }: { type: CareType; done: number; target: number }) {
  const { logs } = useAppData();
  const days = weekDaysWithLogs(logs, type);
  const isOnTrack = done >= target;
  const cfg = CARE_ACTIVITIES[type];

  return (
    <OffsetCard style={styles.weekCard}>
      <View style={styles.weekCardHeader}>
        <Text style={styles.weekCardTitle}>{cfg.emoji} {cfg.label.toUpperCase()}</Text>
        <Text style={[styles.weekCardCount, { color: isOnTrack ? Colors.positive : Colors.accent }]}>
          {done}/{target}{isOnTrack ? ' ✓' : ''}
        </Text>
      </View>
      <View style={styles.dayRow}>
        {days.map(({ date, hasLog }, i) => {
          const isToday  = date.toDateString() === new Date().toDateString();
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

// ── WEEK view ─────────────────────────────────────────────────────────────────

function WeekView() {
  const { dog, weeklyScores, periodicScores } = useAppData();
  if (!dog) return null;

  const tracked = dog.trackedActivities;
  const { walking, teeth, training } = weeklyScores;
  const { worming, vet, grooming }   = periodicScores;
  const monday = getMonday(new Date());

  const weeklyGaps: { label: string; behind: number }[] = [];
  if (tracked.includes('walking'))  weeklyGaps.push({ label: 'walk(s)',    behind: walking.target  - walking.done  });
  if (tracked.includes('teeth'))    weeklyGaps.push({ label: 'brush(es)', behind: teeth.target    - teeth.done    });
  if (tracked.includes('training')) weeklyGaps.push({ label: 'session(s)',behind: training.target - training.done });

  const overdueTypes: string[] = [];
  if (tracked.includes('worming') && (worming.daysSinceLast === null || worming.daysSinceLast >= worming.frequencyDays))
    overdueTypes.push('worming');
  if (tracked.includes('vet')     && (vet.daysSinceLast     === null || vet.daysSinceLast     >= vet.frequencyDays))
    overdueTypes.push('vet');
  if (tracked.includes('grooming') && (grooming.daysSinceLast === null || grooming.daysSinceLast >= grooming.frequencyDays))
    overdueTypes.push('grooming');

  const message = weekMessage(dog.name, weeklyGaps, overdueTypes);

  return (
    <>
      <Text style={styles.weekRange}>{formatWeekRange(monday)}</Text>
      <ChatBubble message={message} breed={dog.breed} />

      {tracked.includes('walking')  && <WeekDayRow type="walking"  done={walking.done}   target={walking.target}  />}
      {tracked.includes('teeth')    && <WeekDayRow type="teeth"    done={teeth.done}     target={teeth.target}    />}
      {tracked.includes('training') && <WeekDayRow type="training" done={training.done}  target={training.target} />}

      {(tracked.includes('worming') || tracked.includes('vet') || tracked.includes('grooming')) && (
        <OffsetCard style={styles.periodicSummary}>
          <Text style={styles.weekCardTitle}>PERIODIC.CARE</Text>
          {tracked.includes('worming') && (
            <PeriodicRow emoji="💊" label="WORMING TABLET" daysSinceLast={worming.daysSinceLast} frequencyDays={worming.frequencyDays} />
          )}
          {tracked.includes('vet') && (
            <PeriodicRow emoji="🏥" label="VET VISIT" daysSinceLast={vet.daysSinceLast} frequencyDays={vet.frequencyDays}
              borderTop={tracked.includes('worming')} />
          )}
          {tracked.includes('grooming') && (
            <PeriodicRow emoji="✂️" label="GROOMING" daysSinceLast={grooming.daysSinceLast} frequencyDays={grooming.frequencyDays}
              borderTop={tracked.includes('worming') || tracked.includes('vet')} />
          )}
        </OffsetCard>
      )}
    </>
  );
}

// ── MONTH view ────────────────────────────────────────────────────────────────

function MonthView() {
  const { dog, logs } = useAppData();
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  if (!dog) return null;
  const tracked = dog.trackedActivities;
  const calDays = getCalendarDays(year, month);

  const prevMonth = () => {
    Haptics.selectionAsync();
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    Haptics.selectionAsync();
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Count per activity for this month
  const monthlyCounts = tracked.reduce<Record<string, number>>((acc, type) => {
    acc[type] = logs.filter(l => {
      const d = new Date(l.date);
      return l.type === type && d.getFullYear() === year && d.getMonth() === month;
    }).length;
    return acc;
  }, {});

  return (
    <>
      <ChatBubble message={monthMessage(dog.name, year, month)} breed={dog.breed} />

      <OffsetCard style={styles.calendarCard}>
        {/* Month header */}
        <View style={styles.calNavRow}>
          <Pressable onPress={prevMonth} hitSlop={8}><Text style={styles.calNavArrow}>←</Text></Pressable>
          <Text style={styles.calTitle}>{MONTH_NAMES[month]} {year}</Text>
          <Pressable onPress={nextMonth} hitSlop={8}><Text style={styles.calNavArrow}>→</Text></Pressable>
        </View>

        {/* Day-of-week headers */}
        <View style={styles.calDowRow}>
          {DAY_LABELS.map((l, i) => (
            <Text key={i} style={styles.calDow}>{l}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calGrid}>
          {calDays.map(({ date, inMonth }, i) => {
            const isToday = date.toDateString() === now.toDateString();
            const dateStr = date.toDateString();
            const logsOnDay = logs.filter(l => new Date(l.date).toDateString() === dateStr);
            const activeTypes = tracked.filter(t => logsOnDay.some(l => l.type === t));

            return (
              <View key={i} style={[styles.calCell, isToday && styles.calCellToday, !inMonth && styles.calCellOutside]}>
                <Text style={[styles.calDayNum, !inMonth && styles.calDayNumOutside, isToday && styles.calDayNumToday]}>
                  {date.getDate()}
                </Text>
                <View style={styles.calDots}>
                  {activeTypes.slice(0, 3).map(t => (
                    <View key={t} style={[styles.calDot, { backgroundColor: ACTIVITY_COLORS[t] }]} />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </OffsetCard>

      {/* Monthly summary */}
      <OffsetCard style={styles.monthlySummary}>
        <Text style={styles.weekCardTitle}>{MONTH_NAMES[month]} SUMMARY</Text>
        {tracked.map((type, i) => {
          const cfg   = CARE_ACTIVITIES[type];
          const count = monthlyCounts[type] ?? 0;
          const color = ACTIVITY_COLORS[type];
          return (
            <View key={type} style={[styles.summaryRow, i > 0 && styles.summaryRowBorder]}>
              <Text style={styles.summaryEmoji}>{cfg.emoji}</Text>
              <Text style={styles.summaryLabel}>{cfg.label.toUpperCase()}</Text>
              <Text style={[styles.summaryCount, { color }]}>{count}×</Text>
            </View>
          );
        })}
      </OffsetCard>
    </>
  );
}

// ── YEAR view ─────────────────────────────────────────────────────────────────

function YearView() {
  const { dog, logs } = useAppData();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  if (!dog) return null;
  const tracked = dog.trackedActivities;

  return (
    <>
      <ChatBubble message={yearMessage(dog.name, year)} breed={dog.breed} />

      <View style={styles.yearNavRow}>
        <Pressable onPress={() => { Haptics.selectionAsync(); setYear(y => y - 1); }} hitSlop={8}>
          <Text style={styles.calNavArrow}>←</Text>
        </Pressable>
        <Text style={styles.yearTitle}>{year}</Text>
        <Pressable onPress={() => { Haptics.selectionAsync(); setYear(y => y + 1); }} hitSlop={8}>
          <Text style={styles.calNavArrow}>→</Text>
        </Pressable>
      </View>

      {MONTH_NAMES.map((mName, month) => {
        const counts = tracked.reduce<Record<string, number>>((acc, type) => {
          acc[type] = logs.filter(l => {
            const d = new Date(l.date);
            return l.type === type && d.getFullYear() === year && d.getMonth() === month;
          }).length;
          return acc;
        }, {});
        const hasAny = Object.values(counts).some(c => c > 0);
        const isCurrent = year === now.getFullYear() && month === now.getMonth();
        const isFuture  = new Date(year, month, 1) > now;

        return (
          <OffsetCard key={month} style={[styles.yearMonthCard, isCurrent && styles.yearMonthCurrent]}>
            <View style={styles.yearMonthHeader}>
              <Text style={[styles.yearMonthName, isCurrent && styles.yearMonthNameCurrent]}>{mName}</Text>
              {isFuture && <Text style={styles.yearFutureTag}>UPCOMING</Text>}
            </View>
            {hasAny ? (
              <View style={styles.yearCountsRow}>
                {tracked.map(type => {
                  const count = counts[type] ?? 0;
                  if (count === 0 && isFuture) return null;
                  const cfg = CARE_ACTIVITIES[type];
                  return (
                    <View key={type} style={[styles.yearCountPill, { borderColor: ACTIVITY_COLORS[type] }]}>
                      <Text style={styles.yearCountEmoji}>{cfg.emoji}</Text>
                      <Text style={[styles.yearCountNum, { color: ACTIVITY_COLORS[type] }]}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.yearEmpty}>{isFuture ? '—' : 'NO LOGS'}</Text>
            )}
          </OffsetCard>
        );
      })}
    </>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function WeeklyScreen() {
  const { dog } = useAppData();
  const insets  = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('week');

  if (!dog) return null;

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

        <PeriodSelector period={period} onChange={setPeriod} />

        {period === 'week'  && <WeekView  />}
        {period === 'month' && <MonthView />}
        {period === 'year'  && <YearView  />}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page:    { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  title:   { fontFamily: PIXEL_FONT, fontSize: 12, color: Colors.text },

  // Period selector
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.dogEmpty,
    alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  periodBtnText:   { fontFamily: PIXEL_FONT, fontSize: 7, color: Colors.textMuted },
  periodBtnTextActive: { color: '#FFF' },

  weekRange: { fontFamily: PIXEL_FONT, fontSize: 7, color: Colors.textMuted, marginBottom: 16, letterSpacing: 0.5 },

  // Weekly cards
  weekCard: { marginBottom: 12 },
  weekCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  weekCardTitle:  { fontFamily: PIXEL_FONT, fontSize: 8, color: Colors.text },
  weekCardCount:  { fontFamily: PIXEL_FONT, fontSize: 10 },
  dayRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  dayCell: { alignItems: 'center', gap: 4 },
  dayLabel: { fontFamily: PIXEL_FONT, fontSize: 7, color: Colors.textMuted },
  dayLabelToday: { color: Colors.accent },
  dayDot: {
    width: 28, height: 28, borderRadius: 6,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  dayDotDone:   { backgroundColor: Colors.positive, borderColor: Colors.positive },
  dayDotFuture: { borderColor: Colors.dogEmpty },
  dayCheck: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  // Periodic
  periodicSummary: { marginBottom: 12 },
  periodicRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  periodicRowBorder: { borderTopWidth: 1.5, borderTopColor: '#F0F0F0' },
  periodicEmoji: { fontSize: 20 },
  periodicInfo:  { flex: 1, gap: 2 },
  periodicLabel: { fontFamily: PIXEL_FONT, fontSize: 7, color: Colors.text },
  periodicValue: { fontFamily: PIXEL_FONT, fontSize: 7 },

  // Calendar
  calendarCard: { marginBottom: 12 },
  calNavRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  calNavArrow: { fontFamily: PIXEL_FONT, fontSize: 10, color: Colors.accent, paddingHorizontal: 4 },
  calTitle:   { fontFamily: PIXEL_FONT, fontSize: 9, color: Colors.text },
  calDowRow:  { flexDirection: 'row', marginBottom: 4 },
  calDow:     { flex: 1, fontFamily: PIXEL_FONT, fontSize: 6, color: Colors.textMuted, textAlign: 'center' },
  calGrid:    { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: '14.28%',
    paddingVertical: 4,
    alignItems: 'center',
    gap: 2,
    minHeight: 40,
  },
  calCellToday:   { backgroundColor: '#F0F0FF', borderRadius: 6 },
  calCellOutside: { opacity: 0.3 },
  calDayNum:      { fontFamily: PIXEL_FONT, fontSize: 6, color: Colors.text },
  calDayNumOutside: { color: Colors.textMuted },
  calDayNumToday:   { color: Colors.accent },
  calDots: { flexDirection: 'row', gap: 2, flexWrap: 'wrap', justifyContent: 'center' },
  calDot:  { width: 4, height: 4, borderRadius: 2 },

  // Monthly summary
  monthlySummary: { marginBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  summaryRowBorder: { borderTopWidth: 1.5, borderTopColor: '#F0F0F0' },
  summaryEmoji: { fontSize: 18 },
  summaryLabel: { fontFamily: PIXEL_FONT, fontSize: 7, color: Colors.text, flex: 1 },
  summaryCount: { fontFamily: PIXEL_FONT, fontSize: 10 },

  // Year
  yearNavRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 },
  yearTitle:   { fontFamily: PIXEL_FONT, fontSize: 12, color: Colors.text },
  yearMonthCard:    { marginBottom: 8 },
  yearMonthCurrent: { borderColor: Colors.accent },
  yearMonthHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  yearMonthName:    { fontFamily: PIXEL_FONT, fontSize: 8, color: Colors.textMuted },
  yearMonthNameCurrent: { color: Colors.accent },
  yearFutureTag:    { fontFamily: PIXEL_FONT, fontSize: 6, color: Colors.textMuted },
  yearCountsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  yearCountPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  yearCountEmoji: { fontSize: 12 },
  yearCountNum:   { fontFamily: PIXEL_FONT, fontSize: 7 },
  yearEmpty:      { fontFamily: PIXEL_FONT, fontSize: 7, color: Colors.dogEmpty },
});
