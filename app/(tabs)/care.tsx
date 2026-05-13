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
  const { dog, logCare, weeklyScores, periodicScores } = useAppData();
  const insets = useSafeAreaInsets();

  if (!dog) return null;

  const tracked = dog.trackedActivities;

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

        {tracked.includes('walking') && (
          <CareCard
            kind="weekly"
            emoji={CARE_ACTIVITIES.walking.emoji}
            label={CARE_ACTIVITIES.walking.label}
            done={weeklyScores.walking.done}
            target={weeklyScores.walking.target}
            onLog={() => logCare('walking')}
          />
        )}

        {tracked.includes('teeth') && (
          <CareCard
            kind="weekly"
            emoji={CARE_ACTIVITIES.teeth.emoji}
            label={CARE_ACTIVITIES.teeth.label}
            done={weeklyScores.teeth.done}
            target={weeklyScores.teeth.target}
            onLog={() => logCare('teeth')}
          />
        )}

        {tracked.includes('worming') && (
          <CareCard
            kind="periodic"
            emoji={CARE_ACTIVITIES.worming.emoji}
            label={CARE_ACTIVITIES.worming.label}
            daysSinceLast={periodicScores.worming.daysSinceLast}
            frequencyDays={periodicScores.worming.frequencyDays}
            lastDate={periodicScores.worming.lastDate}
            onLog={() => logCare('worming')}
          />
        )}

        {tracked.includes('vet') && (
          <CareCard
            kind="periodic"
            emoji={CARE_ACTIVITIES.vet.emoji}
            label={CARE_ACTIVITIES.vet.label}
            daysSinceLast={periodicScores.vet.daysSinceLast}
            frequencyDays={periodicScores.vet.frequencyDays}
            lastDate={periodicScores.vet.lastDate}
            onLog={() => logCare('vet')}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  title: { fontFamily: PIXEL_FONT, fontSize: 12, color: Colors.text, letterSpacing: 0.5 },
});
