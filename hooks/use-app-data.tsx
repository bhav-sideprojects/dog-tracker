import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { loadData, saveData } from '@/store/app-store';
import { AppData, CareLog, CareType, DogProfile } from '@/store/types';
import { CARE_ACTIVITIES, PERIODIC_TYPES, WEEKLY_TYPES } from '@/constants/care-activities';

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

// ── computed helpers ──────────────────────────────────────────────────────────

export type WeeklyScore = { done: number; target: number };
export type PeriodicScore = { daysSinceLast: number | null; frequencyDays: number; lastDate: string | null };
export type DayActivity = { date: Date; hasLog: boolean };

function weeklyScore(logs: CareLog[], type: 'walking' | 'teeth', target: number): WeeklyScore {
  const monday = getMonday(new Date());
  const done = logs.filter(l => l.type === type && new Date(l.date) >= monday).length;
  return { done: Math.min(done, target), target };
}

function periodicScore(logs: CareLog[], type: 'worming' | 'vet', frequencyDays: number): PeriodicScore {
  const sorted = logs
    .filter(l => l.type === type)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  if (sorted.length === 0) return { daysSinceLast: null, frequencyDays, lastDate: null };
  const last = new Date(sorted[0].date);
  return { daysSinceLast: daysBetween(last, new Date()), frequencyDays, lastDate: sorted[0].date };
}

function computeFillPercent(data: AppData): number {
  const { dog, logs } = data;
  if (!dog) return 0;

  const scores: number[] = [];

  // Weekly: rolling 7 days for fill (feels more fair than strict Mon–Sun)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentWalks = logs.filter(l => l.type === 'walking' && new Date(l.date) >= sevenDaysAgo).length;
  const recentTeeth = logs.filter(l => l.type === 'teeth'   && new Date(l.date) >= sevenDaysAgo).length;
  scores.push(Math.min(1, recentWalks / dog.walkingPerWeek));
  scores.push(Math.min(1, recentTeeth / dog.teethPerWeek));

  // Periodic
  for (const type of PERIODIC_TYPES) {
    const cfg = CARE_ACTIVITIES[type];
    if (cfg.trackingType !== 'periodic') continue;
    const s = periodicScore(logs, type, cfg.frequencyDays);
    if (s.daysSinceLast === null) {
      scores.push(0);
    } else {
      scores.push(Math.max(0, 1 - s.daysSinceLast / cfg.frequencyDays));
    }
  }

  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

export function getWeekDays(): DayActivity[] {
  // not exported from hook, exposed separately for weekly screen
  return [];
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

// ── context ───────────────────────────────────────────────────────────────────

type AppDataContextValue = {
  dog: DogProfile | null;
  logs: CareLog[];
  isLoading: boolean;
  fillPercent: number;
  setDog: (profile: DogProfile) => Promise<void>;
  logCare: (type: CareType) => Promise<void>;
  getWeeklyScore: (type: 'walking' | 'teeth') => WeeklyScore;
  getPeriodicScore: (type: 'worming' | 'vet') => PeriodicScore;
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
    await persist({ ...dataRef.current, dog: profile });
  }, [persist]);

  const logCare = useCallback(async (type: CareType) => {
    const log: CareLog = { id: Date.now().toString(), type, date: new Date().toISOString() };
    await persist({ ...dataRef.current, logs: [...dataRef.current.logs, log] });
  }, [persist]);

  const getWeeklyScore = useCallback((type: 'walking' | 'teeth'): WeeklyScore => {
    const target = type === 'walking'
      ? (dataRef.current.dog?.walkingPerWeek ?? 4)
      : (dataRef.current.dog?.teethPerWeek ?? 7);
    return weeklyScore(dataRef.current.logs, type, target);
  }, []);

  const getPeriodicScore = useCallback((type: 'worming' | 'vet'): PeriodicScore => {
    const cfg = CARE_ACTIVITIES[type];
    return periodicScore(dataRef.current.logs, type, (cfg as { frequencyDays: number }).frequencyDays);
  }, []);

  return (
    <AppDataContext.Provider value={{
      dog: data.dog,
      logs: data.logs,
      isLoading,
      fillPercent: computeFillPercent(data),
      setDog,
      logCare,
      getWeeklyScore,
      getPeriodicScore,
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
