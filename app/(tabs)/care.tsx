import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, PIXEL_FONT } from '@/constants/theme';
import { BrowserBar } from '@/components/browser-bar';
import { CareCard } from '@/components/care-card';
import { Sparkle } from '@/components/sparkle';
import { useAppData } from '@/hooks/use-app-data';
import { CARE_ACTIVITIES } from '@/constants/care-activities';

export default function CareScreen() {
  const { dog, logCare, getWeeklyScore, getPeriodicScore } = useAppData();
  const insets = useSafeAreaInsets();

  if (!dog) return null;

  const walks = getWeeklyScore('walking');
  const teeth = getWeeklyScore('teeth');
  const worming = getPeriodicScore('worming');
  const vet = getPeriodicScore('vet');

  return (
    <View style={styles.page}>
      <BrowserBar path="care" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>CARE.SCHEDULE</Text>
          <Sparkle size={12} />
        </View>

        <CareCard
          kind="weekly"
          emoji={CARE_ACTIVITIES.walking.emoji}
          label={CARE_ACTIVITIES.walking.label}
          done={walks.done}
          target={walks.target}
          onLog={() => logCare('walking')}
        />

        <CareCard
          kind="weekly"
          emoji={CARE_ACTIVITIES.teeth.emoji}
          label={CARE_ACTIVITIES.teeth.label}
          done={teeth.done}
          target={teeth.target}
          onLog={() => logCare('teeth')}
        />

        <CareCard
          kind="periodic"
          emoji={CARE_ACTIVITIES.worming.emoji}
          label={CARE_ACTIVITIES.worming.label}
          daysSinceLast={worming.daysSinceLast}
          frequencyDays={worming.frequencyDays}
          lastDate={worming.lastDate}
          onLog={() => logCare('worming')}
        />

        <CareCard
          kind="periodic"
          emoji={CARE_ACTIVITIES.vet.emoji}
          label={CARE_ACTIVITIES.vet.label}
          daysSinceLast={vet.daysSinceLast}
          frequencyDays={vet.frequencyDays}
          lastDate={vet.lastDate}
          onLog={() => logCare('vet')}
        />
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
    marginBottom: 20,
  },
  title: {
    fontFamily: PIXEL_FONT,
    fontSize: 12,
    color: Colors.text,
    letterSpacing: 0.5,
  },
});
