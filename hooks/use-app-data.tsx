import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { clearData, loadData, saveData } from '@/store/app-store';
import { AppData, CareLog, CareType, DogProfile } from '@/store/types';

// ── date helpers ──────────────────────────────────────────────────────────────

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// ── computed helpers (pure functions, no closures over refs) ──────────────────

export type WeeklyScore  = { done: number; target: number };
export type PeriodicScore = { daysSinceLast: number | null; frequencyDays: number; lastDate: string | null };
export type DayActivity  = { date: Date; hasLog: boolean };

export function weeklyScore(logs: CareLog[], type: CareType, target: number): WeeklyScore {
  const monday = getMonday(new Date());
  const done = logs.filter(l => l.type === type && new Date(l.date) >= monday).length;
  return { done: Math.min(done, target), target };
}

export function periodicScore(logs: CareLog[], type: CareType, frequencyDays: number): PeriodicScore {
  const sorted = logs
    .filter(l => l.type === type)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  if (sorted.length === 0) return { daysSinceLast: null, frequencyDays, lastDate: null };
  const last = new Date(sorted[0].date);
  return { daysSinceLast: daysBetween(last, new Date()), frequencyDays, lastDate: sorted[0].date };
}

export function weekDaysWithLogs(logs: CareLog[], type: CareType): DayActivity[] {
  const monday = getMonday(new Date());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const hasLog = logs.some(l => l.type === type && new Date(l.date).toDateString() === d.toDateString());
    return { date: d, hasLog };
  });
}

function computeFillPercent(data: AppData): number {
  const { dog, logs } = data;
  if (!dog || dog.trackedActivities.length === 0) return 0;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const scores: number[] = [];

  if (dog.trackedActivities.includes('walking')) {
    const count = logs.filter(l => l.type === 'walking' && new Date(l.date) >= sevenDaysAgo).length;
    scores.push(Math.min(1, count / (dog.walkingPerWeek || 4)));
  }
  if (dog.trackedActivities.includes('teeth')) {
    const count = logs.filter(l => l.type === 'teeth' && new Date(l.date) >= sevenDaysAgo).length;
    scores.push(Math.min(1, count / (dog.teethPerWeek || 7)));
  }
  if (dog.trackedActivities.includes('training')) {
    const count = logs.filter(l => l.type === 'training' && new Date(l.date) >= sevenDaysAgo).length;
    scores.push(Math.min(1, count / (dog.trainingPerWeek || 3)));
  }
  if (dog.trackedActivities.includes('worming')) {
    const s = periodicScore(logs, 'worming', dog.wormingFrequencyDays);
    scores.push(s.daysSinceLast === null ? 0 : Math.max(0, 1 - s.daysSinceLast / dog.wormingFrequencyDays));
  }
  if (dog.trackedActivities.includes('vet')) {
    const s = periodicScore(logs, 'vet', dog.vetFrequencyDays);
    scores.push(s.daysSinceLast === null ? 0 : Math.max(0, 1 - s.daysSinceLast / dog.vetFrequencyDays));
  }
  if (dog.trackedActivities.includes('grooming')) {
    const freq = dog.groomingFrequencyDays || 42;
    const s = periodicScore(logs, 'grooming', freq);
    scores.push(s.daysSinceLast === null ? 0 : Math.max(0, 1 - s.daysSinceLast / freq));
  }

  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

// ── context ───────────────────────────────────────────────────────────────────

type AppDataContextValue = {
  dog: DogProfile | null;
  logs: CareLog[];
  isLoading: boolean;
  fillPercent: number;
  weeklyScores:  { walking: WeeklyScore; teeth: WeeklyScore; training: WeeklyScore };
  periodicScores: { worming: PeriodicScore; vet: PeriodicScore; grooming: PeriodicScore };
  setDog:    (profile: DogProfile) => Promise<void>;
  updateDog: (profile: DogProfile) => Promise<void>;
  resetApp:  () => Promise<void>;
  logCare:   (type: CareType) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>({ dog: null, logs: [] });
  const [isLoading, setIsLoading] = useState(true);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    loadData().then(d => {
      setData(d);
      setIsLoading(false);
    });
  }, []);

  const persist = useCallback(async (next: AppData) => {
    setData(next);
    await saveData(next);
  }, []);

  const setDog = useCallback(async (profile: DogProfile) => {
    const initialLogs: CareLog[] = [];
    if (profile.wormingLastDate  && profile.trackedActivities.includes('worming'))
      initialLogs.push({ id: 'init-worming',  type: 'worming',  date: profile.wormingLastDate });
    if (profile.vetLastDate      && profile.trackedActivities.includes('vet'))
      initialLogs.push({ id: 'init-vet',      type: 'vet',      date: profile.vetLastDate });
    if (profile.groomingLastDate && profile.trackedActivities.includes('grooming'))
      initialLogs.push({ id: 'init-grooming', type: 'grooming', date: profile.groomingLastDate });
    await persist({ dog: profile, logs: initialLogs });
  }, [persist]);

  const updateDog = useCallback(async (profile: DogProfile) => {
    let logs = dataRef.current.logs.filter(
      l => l.id !== 'init-worming' && l.id !== 'init-vet' && l.id !== 'init-grooming'
    );
    if (profile.wormingLastDate  && profile.trackedActivities.includes('worming'))
      logs = [...logs, { id: 'init-worming',  type: 'worming'  as CareType, date: profile.wormingLastDate }];
    if (profile.vetLastDate      && profile.trackedActivities.includes('vet'))
      logs = [...logs, { id: 'init-vet',      type: 'vet'      as CareType, date: profile.vetLastDate }];
    if (profile.groomingLastDate && profile.trackedActivities.includes('grooming'))
      logs = [...logs, { id: 'init-grooming', type: 'grooming' as CareType, date: profile.groomingLastDate }];
    await persist({ dog: profile, logs });
  }, [persist]);

  const resetApp = useCallback(async () => {
    await clearData();
    setData({ dog: null, logs: [] });
  }, []);

  const logCare = useCallback(async (type: CareType) => {
    const log: CareLog = { id: Date.now().toString(), type, date: new Date().toISOString() };
    const next = { ...dataRef.current, logs: [...dataRef.current.logs, log] };
    await persist(next);
  }, [persist]);

  // Pre-compute scores inline so they're always fresh after setData
  const dog  = data.dog;
  const logs = data.logs;

  const walking  = weeklyScore(logs, 'walking',  dog?.walkingPerWeek  ?? 4);
  const teeth    = weeklyScore(logs, 'teeth',    dog?.teethPerWeek    ?? 7);
  const training = weeklyScore(logs, 'training', dog?.trainingPerWeek ?? 3);
  const worming  = periodicScore(logs, 'worming',  dog?.wormingFrequencyDays  ?? 90);
  const vet      = periodicScore(logs, 'vet',      dog?.vetFrequencyDays      ?? 365);
  const grooming = periodicScore(logs, 'grooming', dog?.groomingFrequencyDays ?? 42);

  return (
    <AppDataContext.Provider value={{
      dog, logs, isLoading,
      fillPercent: computeFillPercent(data),
      weeklyScores:   { walking, teeth, training },
      periodicScores: { worming, vet, grooming },
      setDog, updateDog, resetApp, logCare,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
}
