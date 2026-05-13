import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { loadData, saveData } from '@/store/app-store';
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

export type WeeklyScore = { done: number; target: number };
export type PeriodicScore = { daysSinceLast: number | null; frequencyDays: number; lastDate: string | null };
export type DayActivity = { date: Date; hasLog: boolean };

export function weeklyScore(logs: CareLog[], type: 'walking' | 'teeth', target: number): WeeklyScore {
  const monday = getMonday(new Date());
  const done = logs.filter(l => l.type === type && new Date(l.date) >= monday).length;
  return { done: Math.min(done, target), target };
}

export function periodicScore(logs: CareLog[], type: 'worming' | 'vet', frequencyDays: number): PeriodicScore {
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
    scores.push(Math.min(1, count / dog.walkingPerWeek));
  }
  if (dog.trackedActivities.includes('teeth')) {
    const count = logs.filter(l => l.type === 'teeth' && new Date(l.date) >= sevenDaysAgo).length;
    scores.push(Math.min(1, count / dog.teethPerWeek));
  }
  if (dog.trackedActivities.includes('worming')) {
    const s = periodicScore(logs, 'worming', dog.wormingFrequencyDays);
    scores.push(s.daysSinceLast === null ? 0 : Math.max(0, 1 - s.daysSinceLast / dog.wormingFrequencyDays));
  }
  if (dog.trackedActivities.includes('vet')) {
    const s = periodicScore(logs, 'vet', dog.vetFrequencyDays);
    scores.push(s.daysSinceLast === null ? 0 : Math.max(0, 1 - s.daysSinceLast / dog.vetFrequencyDays));
  }

  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

// ── context ───────────────────────────────────────────────────────────────────

type AppDataContextValue = {
  dog: DogProfile | null;
  logs: CareLog[];
  isLoading: boolean;
  fillPercent: number;
  // Pre-computed each render — always in sync with logs state
  weeklyScores: { walking: WeeklyScore; teeth: WeeklyScore };
  periodicScores: { worming: PeriodicScore; vet: PeriodicScore };
  setDog: (profile: DogProfile) => Promise<void>;
  logCare: (type: CareType) => Promise<void>;
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
    // Seed initial logs from last-known periodic dates provided during onboarding
    const initialLogs: CareLog[] = [];
    if (profile.wormingLastDate && profile.trackedActivities.includes('worming')) {
      initialLogs.push({ id: `init-worming`, type: 'worming', date: profile.wormingLastDate });
    }
    if (profile.vetLastDate && profile.trackedActivities.includes('vet')) {
      initialLogs.push({ id: `init-vet`, type: 'vet', date: profile.vetLastDate });
    }
    await persist({ dog: profile, logs: initialLogs });
  }, [persist]);

  const logCare = useCallback(async (type: CareType) => {
    const log: CareLog = { id: Date.now().toString(), type, date: new Date().toISOString() };
    const next = { ...dataRef.current, logs: [...dataRef.current.logs, log] };
    await persist(next);
  }, [persist]);

  // ── pre-compute scores inline so they're always fresh after setData ──────────
  const dog = data.dog;
  const logs = data.logs;

  const walking = weeklyScore(logs, 'walking', dog?.walkingPerWeek ?? 4);
  const teeth   = weeklyScore(logs, 'teeth',   dog?.teethPerWeek  ?? 7);
  const worming = periodicScore(logs, 'worming', dog?.wormingFrequencyDays ?? 90);
  const vet     = periodicScore(logs, 'vet',     dog?.vetFrequencyDays     ?? 365);

  return (
    <AppDataContext.Provider value={{
      dog,
      logs,
      isLoading,
      fillPercent: computeFillPercent(data),
      weeklyScores:  { walking, teeth },
      periodicScores: { worming, vet },
      setDog,
      logCare,
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
