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
import { BreedId } from '@/store/types';

type Step = 'name' | 'breed' | 'frequency';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { setDog } = useAppData();

  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState<BreedId>('corgi');
  const [walkingPerWeek, setWalkingPerWeek] = useState(4);
  const [teethPerWeek, setTeethPerWeek] = useState(7);

  const advance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'name') setStep('breed');
    else if (step === 'breed') setStep('frequency');
    else finish();
  };

  const finish = async () => {
    await setDog({ name: name.trim(), breed, walkingPerWeek, teethPerWeek });
    router.replace('/');
  };

  const canAdvance =
    step === 'name' ? name.trim().length > 0
    : step === 'breed' ? true
    : true;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Sparkle size={12} />
          <Text style={styles.appName}>dog-tracker.exe</Text>
          <Sparkle size={12} />
        </View>

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

        {step === 'breed' && (
          <>
            <Text style={styles.heading}>PICK A BREED</Text>
            <Text style={styles.sub}>{'CHOOSE '}{name.toUpperCase()}{'\'S BREED'}</Text>
            <View style={styles.breedGrid}>
              {BREED_ORDER.map(id => (
                <Pressable
                  key={id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setBreed(id);
                  }}
                  style={[
                    styles.breedCard,
                    breed === id && styles.breedCardSelected,
                  ]}
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

        {step === 'frequency' && (
          <>
            <View style={styles.mascotWrap}>
              <DogMascot breed={breed} fillPercent={0.5} cellSize={12} />
            </View>
            <Text style={styles.heading}>SET GOALS</Text>
            <Text style={styles.sub}>HOW OFTEN PER WEEK?</Text>

            <FrequencyStepper
              emoji="🐾"
              label="WALKIES"
              value={walkingPerWeek}
              min={1}
              max={7}
              onChange={setWalkingPerWeek}
            />
            <FrequencyStepper
              emoji="🦷"
              label="TEETH BRUSHING"
              value={teethPerWeek}
              min={1}
              max={7}
              onChange={setTeethPerWeek}
            />
          </>
        )}

        <Pressable
          onPress={advance}
          disabled={!canAdvance}
          style={({ pressed }) => [
            styles.cta,
            !canAdvance && styles.ctaDisabled,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.ctaText}>
            {step === 'frequency' ? 'GET STARTED →→' : 'NEXT →→'}
          </Text>
        </Pressable>

        <View style={styles.dotsRow}>
          {(['name', 'breed', 'frequency'] as Step[]).map(s => (
            <View key={s} style={[styles.dot, step === s && styles.dotActive]} />
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FrequencyStepper({
  emoji, label, value, min, max, onChange,
}: {
  emoji: string; label: string; value: number; min: number; max: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperEmoji}>{emoji}</Text>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); onChange(Math.max(min, value - 1)); }}
          style={styles.stepperBtn}
        >
          <Text style={styles.stepperBtnText}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{value}x</Text>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); onChange(Math.min(max, value + 1)); }}
          style={styles.stepperBtn}
        >
          <Text style={styles.stepperBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  appName: {
    fontFamily: PIXEL_FONT,
    fontSize: 10,
    color: Colors.accent,
  },
  mascotWrap: {
    marginBottom: 24,
  },
  heading: {
    fontFamily: PIXEL_FONT,
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 12,
  },
  sub: {
    fontFamily: PIXEL_FONT,
    fontSize: 8,
    color: Colors.textMuted,
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  input: {
    width: '100%',
    backgroundColor: Colors.card,
    borderWidth: 2.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 32,
    textAlign: 'center',
  },
  breedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 32,
    width: '100%',
  },
  breedCard: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.dogEmpty,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 6,
    width: '44%',
  },
  breedCardSelected: {
    borderColor: Colors.border,
    borderWidth: 2.5,
  },
  breedName: {
    fontFamily: PIXEL_FONT,
    fontSize: 6,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  breedNameSelected: {
    color: Colors.accent,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    width: '100%',
    gap: 8,
  },
  stepperEmoji: { fontSize: 18 },
  stepperLabel: {
    fontFamily: PIXEL_FONT,
    fontSize: 7,
    color: Colors.text,
    flex: 1,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  stepperValue: {
    fontFamily: PIXEL_FONT,
    fontSize: 12,
    color: Colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
  cta: {
    backgroundColor: Colors.text,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginTop: 8,
    marginBottom: 20,
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: {
    fontFamily: PIXEL_FONT,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dogEmpty,
  },
  dotActive: {
    backgroundColor: Colors.accent,
    width: 20,
    borderRadius: 4,
  },
});
