import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, PIXEL_FONT } from '@/constants/theme';
import { BREED_ORDER, BREEDS } from '@/constants/breeds';
import { DogMascot } from '@/components/dog-mascot';
import { OffsetCard } from '@/components/offset-card';
import { useAppData } from '@/hooks/use-app-data';
import { BreedId, CareType } from '@/store/types';

const ALL_ACTIVITIES: { type: CareType; emoji: string; label: string; hint?: string }[] = [
  { type: 'walking',  emoji: '🐾', label: 'Walkies' },
  { type: 'teeth',    emoji: '🦷', label: 'Teeth Brushing' },
  { type: 'worming',  emoji: '💊', label: 'Worming Tablet' },
  { type: 'vet',      emoji: '🏥', label: 'Vet Visits' },
  { type: 'grooming', emoji: '✂️', label: 'Grooming',    hint: 'Suggested' },
  { type: 'training', emoji: '🎓', label: 'Training',    hint: 'Suggested' },
];

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const WORMING_LAST_OPTIONS  = [
  { label: 'Today',        value: daysAgoISO(0)  },
  { label: '2 wks ago',    value: daysAgoISO(14) },
  { label: '1 month ago',  value: daysAgoISO(30) },
  { label: '2 months ago', value: daysAgoISO(60) },
  { label: "Don't know",   value: null            },
];
const VET_LAST_OPTIONS = [
  { label: 'Today',        value: daysAgoISO(0)   },
  { label: '3 months ago', value: daysAgoISO(90)  },
  { label: '6 months ago', value: daysAgoISO(180) },
  { label: '9 months ago', value: daysAgoISO(270) },
  { label: '1+ years ago', value: daysAgoISO(400) },
  { label: "Don't know",   value: null             },
];
const GROOMING_LAST_OPTIONS = [
  { label: 'Today',        value: daysAgoISO(0)  },
  { label: '2 weeks ago',  value: daysAgoISO(14) },
  { label: '1 month ago',  value: daysAgoISO(30) },
  { label: '6 weeks ago',  value: daysAgoISO(42) },
  { label: "Don't know",   value: null            },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { dog, updateDog, resetApp } = useAppData();

  const [name,    setName]    = useState(dog?.name    ?? '');
  const [breed,   setBreed]   = useState<BreedId>(dog?.breed ?? 'corgi');
  const [tracked, setTracked] = useState<CareType[]>(dog?.trackedActivities ?? ['walking', 'teeth', 'worming', 'vet']);

  const [walkingPerWeek,    setWalkingPerWeek]    = useState(dog?.walkingPerWeek    ?? 4);
  const [teethPerWeek,      setTeethPerWeek]      = useState(dog?.teethPerWeek      ?? 7);
  const [trainingPerWeek,   setTrainingPerWeek]   = useState(dog?.trainingPerWeek   ?? 3);
  const [wormingFreqMonths, setWormingFreqMonths] = useState(Math.round((dog?.wormingFrequencyDays  ?? 90)  / 30));
  const [vetFreqMonths,     setVetFreqMonths]     = useState(Math.round((dog?.vetFrequencyDays      ?? 365) / 30));
  const [groomingFreqWeeks, setGroomingFreqWeeks] = useState(Math.round((dog?.groomingFrequencyDays ?? 42)  / 7));
  const [wormingLastDate,   setWormingLastDate]   = useState<string | null>(dog?.wormingLastDate   ?? null);
  const [vetLastDate,       setVetLastDate]       = useState<string | null>(dog?.vetLastDate       ?? null);
  const [groomingLastDate,  setGroomingLastDate]  = useState<string | null>(dog?.groomingLastDate  ?? null);

  const [devTaps, setDevTaps] = useState(0);
  const devUnlocked = devTaps >= 5;

  const toggleActivity = (type: CareType) => {
    Haptics.selectionAsync();
    setTracked(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const handleSave = async () => {
    if (!name.trim() || tracked.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateDog({
      name: name.trim(), breed, trackedActivities: tracked,
      walkingPerWeek, teethPerWeek, trainingPerWeek,
      wormingFrequencyDays:  wormingFreqMonths * 30,
      vetFrequencyDays:      vetFreqMonths     * 30,
      groomingFrequencyDays: groomingFreqWeeks * 7,
      wormingLastDate, vetLastDate, groomingLastDate,
    });
    router.back();
  };

  const handleReset = () => {
    Alert.alert(
      'RESET APP',
      'This will delete all data and return to onboarding. Cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: async () => {
          await resetApp();
          // _layout.tsx watches dog and redirects to /onboarding automatically
        }},
      ]
    );
  };

  const canSave = name.trim().length > 0 && tracked.length > 0;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backText}>← BACK</Text>
        </Pressable>
        <Text style={styles.headerTitle}>SETTINGS.EXE</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Dog Profile */}
        <OffsetCard style={styles.section}>
          <Text style={styles.sectionTitle}>DOG.PROFILE ✦</Text>
          <Text style={styles.fieldLabel}>NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Dog's name"
            placeholderTextColor={Colors.textMuted}
            returnKeyType="done"
          />
          <Text style={styles.fieldLabel}>BREED</Text>
          <View style={styles.breedGrid}>
            {BREED_ORDER.map(id => (
              <Pressable
                key={id}
                onPress={() => { Haptics.selectionAsync(); setBreed(id); }}
                style={[styles.breedCard, breed === id && styles.breedCardSelected]}
              >
                <DogMascot breed={id} fillPercent={breed === id ? 1 : 0.2} cellSize={6} />
                <Text style={[styles.breedName, breed === id && styles.breedNameSelected]}>
                  {BREEDS[id].name.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </OffsetCard>

        {/* Tracked Activities */}
        <OffsetCard style={styles.section}>
          <Text style={styles.sectionTitle}>CARE.TRACKING ✦</Text>
          {ALL_ACTIVITIES.map(({ type, emoji, label, hint }) => {
            const selected = tracked.includes(type);
            return (
              <Pressable
                key={type}
                onPress={() => toggleActivity(type)}
                style={[styles.activityRow, selected && styles.activityRowSelected]}
              >
                <Text style={styles.activityEmoji}>{emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.activityLabel, selected && styles.activityLabelSelected]}>
                    {label.toUpperCase()}
                  </Text>
                  {hint && <Text style={styles.activityHint}>{hint}</Text>}
                </View>
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </Pressable>
            );
          })}
        </OffsetCard>

        {/* Goals Setup */}
        <OffsetCard style={styles.section}>
          <Text style={styles.sectionTitle}>GOALS.SETUP ✦</Text>

          {tracked.includes('walking') && (
            <>
              <Text style={styles.fieldLabel}>🐾 WALKIES PER WEEK</Text>
              <FrequencyStepper value={walkingPerWeek} min={1} max={7} unit="×/wk" onChange={setWalkingPerWeek} />
            </>
          )}
          {tracked.includes('teeth') && (
            <>
              <Text style={styles.fieldLabel}>🦷 TEETH BRUSHING PER WEEK</Text>
              <FrequencyStepper value={teethPerWeek} min={1} max={7} unit="×/wk" onChange={setTeethPerWeek} />
            </>
          )}
          {tracked.includes('training') && (
            <>
              <Text style={styles.fieldLabel}>🎓 TRAINING SESSIONS PER WEEK</Text>
              <FrequencyStepper value={trainingPerWeek} min={1} max={7} unit="×/wk" onChange={setTrainingPerWeek} />
            </>
          )}
          {tracked.includes('worming') && (
            <>
              <Text style={styles.fieldLabel}>💊 WORMING FREQUENCY</Text>
              <FrequencyStepper value={wormingFreqMonths} min={1} max={6} unit="months" onChange={setWormingFreqMonths} />
              <Text style={styles.fieldLabel}>LAST DOSE</Text>
              <QuickPicker options={WORMING_LAST_OPTIONS} selected={wormingLastDate} onSelect={setWormingLastDate} />
            </>
          )}
          {tracked.includes('vet') && (
            <>
              <Text style={styles.fieldLabel}>🏥 VET VISIT FREQUENCY</Text>
              <FrequencyStepper value={vetFreqMonths} min={6} max={24} unit="months" onChange={setVetFreqMonths} />
              <Text style={styles.fieldLabel}>LAST VISIT</Text>
              <QuickPicker options={VET_LAST_OPTIONS} selected={vetLastDate} onSelect={setVetLastDate} />
            </>
          )}
          {tracked.includes('grooming') && (
            <>
              <Text style={styles.fieldLabel}>✂️ GROOMING FREQUENCY</Text>
              <FrequencyStepper value={groomingFreqWeeks} min={2} max={12} unit="weeks" onChange={setGroomingFreqWeeks} />
              <Text style={styles.fieldLabel}>LAST GROOMING</Text>
              <QuickPicker options={GROOMING_LAST_OPTIONS} selected={groomingLastDate} onSelect={setGroomingLastDate} />
            </>
          )}
        </OffsetCard>

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={({ pressed }) => [styles.saveBtn, !canSave && styles.saveBtnDisabled, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.saveBtnText}>SAVE CHANGES →→</Text>
        </Pressable>

        {/* Developer Options */}
        <Pressable
          onPress={() => { setDevTaps(t => t + 1); if (devTaps === 4) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
          style={styles.devHeader}
        >
          <Text style={styles.devLabel}>{devUnlocked ? '🔓 DEVELOPER OPTIONS' : 'DEVELOPER OPTIONS'}</Text>
          {!devUnlocked && devTaps > 0 && <Text style={styles.devHint}>{5 - devTaps} more taps...</Text>}
        </Pressable>

        {devUnlocked && (
          <OffsetCard style={[styles.section, styles.devSection]}>
            <Text style={styles.devInfo}>{'Storage: @dog_tracker_data\nThis will wipe all data and restart onboarding.'}</Text>
            <Pressable
              onPress={handleReset}
              style={({ pressed }) => [styles.resetBtn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.resetBtnText}>⚠ RESET APP DATA</Text>
            </Pressable>
          </OffsetCard>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FrequencyStepper({
  value, min, max, unit, onChange,
}: { value: number; min: number; max: number; unit: string; onChange: (v: number) => void }) {
  return (
    <View style={styles.stepperRow}>
      <Pressable onPress={() => { Haptics.selectionAsync(); onChange(Math.max(min, value - 1)); }} style={styles.stepperBtn}>
        <Text style={styles.stepperBtnText}>−</Text>
      </Pressable>
      <Text style={styles.stepperValue}>{value} {unit}</Text>
      <Pressable onPress={() => { Haptics.selectionAsync(); onChange(Math.min(max, value + 1)); }} style={styles.stepperBtn}>
        <Text style={styles.stepperBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

function QuickPicker({
  options, selected, onSelect,
}: { options: { label: string; value: string | null }[]; selected: string | null; onSelect: (v: string | null) => void }) {
  return (
    <View style={styles.pickerRow}>
      {options.map(opt => (
        <Pressable
          key={opt.label}
          onPress={() => { Haptics.selectionAsync(); onSelect(opt.value); }}
          style={[styles.pickerPill, selected === opt.value && styles.pickerPillSelected]}
        >
          <Text style={[styles.pickerText, selected === opt.value && styles.pickerTextSelected]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.card, borderBottomWidth: 2, borderBottomColor: Colors.border,
    paddingHorizontal: 16, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn:     { width: 60 },
  backText:    { fontFamily: PIXEL_FONT, fontSize: 7, color: Colors.accent },
  headerTitle: { fontFamily: PIXEL_FONT, fontSize: 9, color: Colors.text },
  content:     { paddingHorizontal: 20, paddingTop: 20 },
  section:     { marginBottom: 16 },
  sectionTitle: { fontFamily: PIXEL_FONT, fontSize: 9, color: Colors.text, marginBottom: 16, letterSpacing: 0.5 },
  fieldLabel: {
    fontFamily: PIXEL_FONT, fontSize: 7, color: Colors.textMuted,
    marginBottom: 8, marginTop: 12, letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 16, fontWeight: '700', color: Colors.text,
  },
  breedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  breedCard: {
    backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.dogEmpty,
    borderRadius: 10, padding: 8, alignItems: 'center', gap: 4, width: '18%',
  },
  breedCardSelected: { borderColor: Colors.border, borderWidth: 2 },
  breedName:         { fontFamily: PIXEL_FONT, fontSize: 5, color: Colors.textMuted, textAlign: 'center' },
  breedNameSelected: { color: Colors.accent },
  activityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10,
    paddingHorizontal: 12, borderRadius: 10, borderWidth: 1.5,
    borderColor: Colors.dogEmpty, marginBottom: 8,
  },
  activityRowSelected: { borderColor: Colors.border },
  activityEmoji: { fontSize: 20 },
  activityLabel: { fontFamily: PIXEL_FONT, fontSize: 7, color: Colors.textMuted },
  activityLabelSelected: { color: Colors.text },
  activityHint: { fontFamily: PIXEL_FONT, fontSize: 6, color: Colors.accent, marginTop: 2 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5,
    borderColor: Colors.dogEmpty, alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkmark: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  stepperRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'center',
  },
  stepperBtn: {
    width: 32, height: 32, backgroundColor: Colors.accent,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  stepperBtnText: { color: '#FFF', fontSize: 20, fontWeight: '700', lineHeight: 24 },
  stepperValue:   { fontFamily: PIXEL_FONT, fontSize: 9, color: Colors.text, minWidth: 70, textAlign: 'center' },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pickerPill: {
    backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.dogEmpty,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  pickerPillSelected:  { borderColor: Colors.accent, backgroundColor: Colors.accent },
  pickerText:          { fontFamily: PIXEL_FONT, fontSize: 6, color: Colors.textMuted },
  pickerTextSelected:  { color: '#FFF' },
  saveBtn:        { backgroundColor: Colors.text, borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginBottom: 32 },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText:    { fontFamily: PIXEL_FONT, fontSize: 10, color: '#FFF', letterSpacing: 1 },
  devHeader: { alignItems: 'center', marginBottom: 8, gap: 4 },
  devLabel:  { fontFamily: PIXEL_FONT, fontSize: 7, color: Colors.textMuted, letterSpacing: 0.5 },
  devHint:   { fontFamily: PIXEL_FONT, fontSize: 6, color: Colors.accent },
  devSection: { borderColor: Colors.negative },
  devInfo: { fontFamily: PIXEL_FONT, fontSize: 6, color: Colors.textMuted, lineHeight: 12, marginBottom: 16 },
  resetBtn:     { backgroundColor: Colors.negative, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  resetBtnText: { fontFamily: PIXEL_FONT, fontSize: 8, color: '#FFF', letterSpacing: 0.5 },
});
