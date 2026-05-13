import { CareType } from '@/store/types';

type WeeklyActivity = {
  label: string;
  emoji: string;
  trackingType: 'weekly';
  defaultPerWeek: number;
};

type PeriodicActivity = {
  label: string;
  emoji: string;
  trackingType: 'periodic';
  frequencyDays: number;
};

export type CareActivityConfig = WeeklyActivity | PeriodicActivity;

export const CARE_ACTIVITIES: Record<CareType, CareActivityConfig> = {
  walking: { label: 'Walkies',        emoji: '🐾', trackingType: 'weekly',   defaultPerWeek: 4   },
  teeth:   { label: 'Teeth Brushing', emoji: '🦷', trackingType: 'weekly',   defaultPerWeek: 7   },
  worming: { label: 'Worming Tablet', emoji: '💊', trackingType: 'periodic', frequencyDays:  90  },
  vet:     { label: 'Vet Visit',      emoji: '🏥', trackingType: 'periodic', frequencyDays:  365 },
};

export const WEEKLY_TYPES: Array<'walking' | 'teeth'> = ['walking', 'teeth'];
export const PERIODIC_TYPES: Array<'worming' | 'vet'> = ['worming', 'vet'];
