import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, PIXEL_FONT } from '@/constants/theme';
import { CARE_ACTIVITIES } from '@/constants/care-activities';
import { BrowserBar } from '@/components/browser-bar';
import { CareCard } from '@/components/care-card';
import { Sparkle } from '@/components/sparkle';
import { useAppData } from '@/hooks/use-app-data';

export default function CareScreen() {
  const { dog, logCare, weeklyScores, periodicScores } = useAppData();
  const insets = useSafeAreaInsets();

  if (!dog) return null;

  const tracked = dog.trackedActivities;
  const { walking, teeth, training } = weeklyScores;
  const { worming, vet, grooming }   = periodicScores;

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
          <CareCard kind="weekly" emoji={CARE_ACTIVITIES.walking.emoji} label={CARE_ACTIVITIES.walking.label}
            done={walking.done} target={walking.target} onLog={() => logCare('walking')} />
        )}
        {tracked.includes('teeth') && (
          <CareCard kind="weekly" emoji={CARE_ACTIVITIES.teeth.emoji} label={CARE_ACTIVITIES.teeth.label}
            done={teeth.done} target={teeth.target} onLog={() => logCare('teeth')} />
        )}
        {tracked.includes('training') && (
          <CareCard kind="weekly" emoji={CARE_ACTIVITIES.training.emoji} label={CARE_ACTIVITIES.training.label}
            done={training.done} target={training.target} onLog={() => logCare('training')} />
        )}
        {tracked.includes('worming') && (
          <CareCard kind="periodic" emoji={CARE_ACTIVITIES.worming.emoji} label={CARE_ACTIVITIES.worming.label}
            daysSinceLast={worming.daysSinceLast} frequencyDays={worming.frequencyDays}
            lastDate={worming.lastDate} onLog={() => logCare('worming')} />
        )}
        {tracked.includes('vet') && (
          <CareCard kind="periodic" emoji={CARE_ACTIVITIES.vet.emoji} label={CARE_ACTIVITIES.vet.label}
            daysSinceLast={vet.daysSinceLast} frequencyDays={vet.frequencyDays}
            lastDate={vet.lastDate} onLog={() => logCare('vet')} />
        )}
        {tracked.includes('grooming') && (
          <CareCard kind="periodic" emoji={CARE_ACTIVITIES.grooming.emoji} label={CARE_ACTIVITIES.grooming.label}
            daysSinceLast={grooming.daysSinceLast} frequencyDays={grooming.frequencyDays}
            lastDate={grooming.lastDate} onLog={() => logCare('grooming')} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page:     { flex: 1, backgroundColor: Colors.background },
  content:  { paddingHorizontal: 20, paddingTop: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  title:    { fontFamily: PIXEL_FONT, fontSize: 12, color: Colors.text, letterSpacing: 0.5 },
});
