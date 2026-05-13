import React, { useState } from 'react';
import {
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
import { Sparkle } from '@/components/sparkle';
import { useAppData } from '@/hooks/use-app-data';
import { BreedId, CareType } from '@/store/types';

type Step = 'name' | 'breed' | 'activities' | 'setup';
const STEPS: Step[] = ['name', 'breed', 'activities', 'setup'];

const ESSENTIALS: { type: CareType; emoji: string; label: string }[] = [
  { type: 'walking', emoji: '🐾', label: 'Walkies' },
  { type: 'teeth',   emoji: '🦷', label: 'Teeth Brushing' },
  { type: 'worming', emoji: '💊', label: 'Worming Tablet' },
  { type: 'vet',     emoji: '🏥', label: 'Vet Visits' },
];

const SUGGESTED: { type: CareType; emoji: string; label: string; hint: string }[] = [
  { type: 'grooming', emoji: '✂️', label: 'Grooming',        hint: 'Every 6 weeks' },
  { type: 'training', emoji: '🎓', label: 'Training',        hint: '3× per week' },
];

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const WORMING_LAST_OPTIONS = [
  { label: 'Today',        value: daysAgoISO(0)  },
  { label: '2 weeks ago',  value: daysAgoISO(14) },
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

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { setDog } = useAppData();

  const [step,  setStep]  = useState<Step>('name');
  const [name,  setName]  = useState('');
  const [breed, setBreed] = useState<BreedId>('corgi');
  const [tracked, setTracked] = useState<CareType[]>(['walking', 'teeth', 'worming', 'vet']);

  const [walkingPerWeek,       setWalkingPerWeek]       = useState(4);
  const [teethPerWeek,         setTeethPerWeek]         = useState(7);
  const [trainingPerWeek,      setTrainingPerWeek]      = useState(3);
  const [wormingFreqMonths,    setWormingFreqMonths]    = useState(3);
  const [vetFreqMonths,        setVetFreqMonths]        = useState(12);
  const [groomingFreqWeeks,    setGroomingFreqWeeks]    = useState(6);
  const [wormingLastDate,      setWormingLastDate]      = useState<string | null>(null);
  const [vetLastDate,          setVetLastDate]          = useState<string | null>(null);
  const [groomingLastDate,     setGroomingLastDate]     = useState<string | null>(null);

  const toggleActivity = (type: CareType) => {
    Haptics.selectionAsync();
    setTracked(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const advance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
    else finish();
  };

  const finish = async () => {
    await setDog({
      name: name.trim(),
      breed,
      trackedActivities: tracked,
      walkingPerWeek,
      teethPerWeek,
      trainingPerWeek,
      wormingFrequencyDays:  wormingFreqMonths * 30,
      vetFrequencyDays:      vetFreqMonths     * 30,
      groomingFrequencyDays: groomingFreqWeeks * 7,
      wormingLastDate,
      vetLastDate,
      groomingLastDate,
    });
    router.replace('/');
  };

  const canAdvance =
    step === 'name'       ? name.trim().length > 0 :
    step === 'activities' ? tracked.length > 0      :
    true;

  const isLastStep = step === 'setup';

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Sparkle size={12} />
          <Text style={styles.appName}>dog-tracker.exe</Text>
          <Sparkle size={12} />
        </View>

        {/* ── NAME ─────────────────────────────────────────────────── */}
        {step === 'name' && (
          <>
            <View style={styles.mascotWrap}>
              <DogMascot breed={breed} fillPercent={0} cellSize={12} />
            </View>
            <Text style={styles.heading}>{'WHAT\'S YOUR'}{'\n'}{'DOG\'S NAME?'}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Biscuit"
              placeholderTextColor={Colors.textMuted}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={canAdvance ? advance : undefined}
            />
          </>
        )}

        {/* ── BREED ────────────────────────────────────────────────── */}
        {step === 'breed' && (
          <>
            <Text style={styles.heading}>PICK A BREED</Text>
            <Text style={styles.sub}>{'CHOOSE '}{name.toUpperCase()}{'\'S BREED'}</Text>
            <View style={styles.breedGrid}>
              {BREED_ORDER.map(id => (
                <Pressable
                  key={id}
                  onPress={() => { Haptics.selectionAsync(); setBreed(id); }}
                  style={[styles.breedCard, breed === id && styles.breedCardSelected]}
                >
                  <DogMascot breed={id} fillPercent={breed === id ? 1 : 0.3} cellSize={8} />
                  <Text style={[styles.breedName, breed === id && styles.breedNameSelected]}>
                    {BREEDS[id].name.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* ── ACTIVITIES ───────────────────────────────────────────── */}
        {step === 'activities' && (
          <>
            <View style={styles.mascotWrap}>
              <DogMascot breed={breed} fillPercent={0.5} cellSize={12} />
            </View>
            <Text style={styles.heading}>WHAT DO YOU{'\n'}WANT TO TRACK?</Text>

            <Text style={styles.sectionTag}>ESSENTIALS</Text>
            <View style={styles.activitiesGrid}>
              {ESSENTIALS.map(({ type, emoji, label }) => {
                const selected = tracked.includes(type);
                return (
                  <Pressable
                    key={type}
                    onPress={() => toggleActivity(type)}
                    style={[styles.activityCard, selected && styles.activityCardSelected]}
                  >
                    <Text style={styles.activityEmoji}>{emoji}</Text>
                    <Text style={[styles.activityLabel, selected && styles.activityLabelSelected]}>
                      {label.toUpperCase()}
                    </Text>
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionTag}>SUGGESTED</Text>
            <View style={styles.activitiesGrid}>
              {SUGGESTED.map(({ type, emoji, label, hint }) => {
                const selected = tracked.includes(type);
                return (
                  <Pressable
                    key={type}
                    onPress={() => toggleActivity(type)}
                    style={[styles.activityCard, selected && styles.activityCardSelected]}
                  >
                    <Text style={styles.activityEmoji}>{emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.activityLabel, selected && styles.activityLabelSelected]}>
                        {label.toUpperCase()}
                      </Text>
                      <Text style={styles.activityHint}>{hint}</Text>
                    </View>
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* ── SETUP ────────────────────────────────────────────────── */}
        {step === 'setup' && (
          <>
            <Text style={styles.heading}>SET YOUR{'\n'}GOALS</Text>

            {tracked.includes('walking') && (
              <>
                <Text style={styles.sectionLabel}>🐾 WALKIES — HOW OFTEN PER WEEK?</Text>
                <FrequencyStepper value={walkingPerWeek} min={1} max={7} unit="×/week" onChange={setWalkingPerWeek} />
              </>
            )}
            {tracked.includes('teeth') && (
              <>
                <Text style={styles.sectionLabel}>🦷 TEETH — HOW OFTEN PER WEEK?</Text>
                <FrequencyStepper value={teethPerWeek} min={1} max={7} unit="×/week" onChange={setTeethPerWeek} />
              </>
            )}
            {tracked.includes('training') && (
              <>
                <Text style={styles.sectionLabel}>🎓 TRAINING — HOW OFTEN PER WEEK?</Text>
                <FrequencyStepper value={trainingPerWeek} min={1} max={7} unit="×/week" onChange={setTrainingPerWeek} />
              </>
            )}
            {tracked.includes('worming') && (
              <>
                <Text style={styles.sectionLabel}>💊 WORMING — HOW OFTEN?</Text>
                <FrequencyStepper value={wormingFreqMonths} min={1} max={6} unit="months" onChange={setWormingFreqMonths} />
                <Text style={styles.sectionLabel}>LAST DOSE?</Text>
                <QuickPicker options={WORMING_LAST_OPTIONS} selected={wormingLastDate} onSelect={setWormingLastDate} />
              </>
            )}
            {tracked.includes('vet') && (
              <>
                <Text style={styles.sectionLabel}>🏥 VET — HOW OFTEN?</Text>
                <FrequencyStepper value={vetFreqMonths} min={6} max={24} unit="months" onChange={setVetFreqMonths} />
                <Text style={styles.sectionLabel}>LAST VISIT?</Text>
                <QuickPicker options={VET_LAST_OPTIONS} selected={vetLastDate} onSelect={setVetLastDate} />
              </>
            )}
            {tracked.includes('grooming') && (
              <>
                <Text style={styles.sectionLabel}>✂️ GROOMING — HOW OFTEN?</Text>
                <FrequencyStepper value={groomingFreqWeeks} min={2} max={12} unit="weeks" onChange={setGroomingFreqWeeks} />
                <Text style={styles.sectionLabel}>LAST GROOMING?</Text>
                <QuickPicker options={GROOMING_LAST_OPTIONS} selected={groomingLastDate} onSelect={setGroomingLastDate} />
              </>
            )}
          </>
        )}

        <Pressable
          onPress={advance}
          disabled={!canAdvance}
          style={({ pressed }) => [styles.cta, !canAdvance && styles.ctaDisabled, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.ctaText}>{isLastStep ? 'GET STARTED →→' : 'NEXT →→'}</Text>
        </Pressable>

        <View style={styles.dotsRow}>
          {STEPS.map(s => (
            <View key={s} style={[styles.dot, step === s && styles.dotActive]} />
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: Colors.background },
  container: { paddingHorizontal: 24, alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 32 },
  appName:   { fontFamily: PIXEL_FONT, fontSize: 10, color: Colors.accent },
  mascotWrap: { marginBottom: 24 },
  heading: {
    fontFamily: PIXEL_FONT, fontSize: 18, color: Colors.text,
    textAlign: 'center', lineHeight: 32, marginBottom: 12,
  },
  sub: { fontFamily: PIXEL_FONT, fontSize: 8, color: Colors.textMuted, marginBottom: 24, letterSpacing: 0.5 },
  sectionTag: {
    fontFamily: PIXEL_FONT, fontSize: 7, color: Colors.accent,
    alignSelf: 'flex-start', marginBottom: 8, marginTop: 8, letterSpacing: 1,
  },
  input: {
    width: '100%', backgroundColor: Colors.card,
    borderWidth: 2.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 20, fontWeight: '700', color: Colors.text,
    marginBottom: 32, textAlign: 'center',
  },
  breedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 32, width: '100%' },
  breedCard: {
    backgroundColor: Colors.card, borderWidth: 2, borderColor: Colors.dogEmpty,
    borderRadius: 12, padding: 10, alignItems: 'center', gap: 6, width: '44%',
  },
  breedCardSelected: { borderColor: Colors.border, borderWidth: 2.5 },
  breedName: { fontFamily: PIXEL_FONT, fontSize: 6, color: Colors.textMuted, textAlign: 'center' },
  breedNameSelected: { color: Colors.accent },
  activitiesGrid: { width: '100%', gap: 8, marginBottom: 8 },
  activityCard: {
    backgroundColor: Colors.card, borderWidth: 2, borderColor: Colors.dogEmpty,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  activityCardSelected: { borderColor: Colors.border },
  activityEmoji: { fontSize: 22 },
  activityLabel: { fontFamily: PIXEL_FONT, fontSize: 8, color: Colors.textMuted },
  activityLabelSelected: { color: Colors.text },
  activityHint: { fontFamily: PIXEL_FONT, fontSize: 6, color: Colors.textMuted, marginTop: 3 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: Colors.dogEmpty, alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkmark: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  sectionLabel: {
    fontFamily: PIXEL_FONT, fontSize: 7, color: Colors.textMuted,
    alignSelf: 'flex-start', marginTop: 16, marginBottom: 8, letterSpacing: 0.5,
  },
  stepperRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: Colors.card, borderWidth: 2, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12,
    width: '100%', justifyContent: 'center',
  },
  stepperBtn: {
    width: 36, height: 36, backgroundColor: Colors.accent,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  stepperBtnText: { color: '#FFF', fontSize: 22, fontWeight: '700', lineHeight: 26 },
  stepperValue:   { fontFamily: PIXEL_FONT, fontSize: 11, color: Colors.text, minWidth: 80, textAlign: 'center' },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%', marginBottom: 8 },
  pickerPill: {
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.dogEmpty,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  pickerPillSelected: { borderColor: Colors.accent, backgroundColor: Colors.accent },
  pickerText:         { fontFamily: PIXEL_FONT, fontSize: 7, color: Colors.textMuted },
  pickerTextSelected: { color: '#FFF' },
  cta: {
    backgroundColor: Colors.text, borderRadius: 50,
    paddingVertical: 16, paddingHorizontal: 40,
    marginTop: 24, marginBottom: 20,
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { fontFamily: PIXEL_FONT, fontSize: 10, color: '#FFFFFF', letterSpacing: 1 },
  dotsRow: { flexDirection: 'row', gap: 8 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.dogEmpty },
  dotActive: { backgroundColor: Colors.accent, width: 20, borderRadius: 4 },
});
