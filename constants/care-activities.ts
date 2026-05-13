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
  walking:  { label: 'Walkies',        emoji: '🐾', trackingType: 'weekly',   defaultPerWeek: 4  },
  teeth:    { label: 'Teeth Brushing', emoji: '🦷', trackingType: 'weekly',   defaultPerWeek: 7  },
  training: { label: 'Training',       emoji: '🎓', trackingType: 'weekly',   defaultPerWeek: 3  },
  worming:  { label: 'Worming Tablet', emoji: '💊', trackingType: 'periodic', frequencyDays: 90  },
  vet:      { label: 'Vet Visit',      emoji: '🏥', trackingType: 'periodic', frequencyDays: 365 },
  grooming: { label: 'Grooming',       emoji: '✂️', trackingType: 'periodic', frequencyDays: 42  },
};

// Dot colour shown in calendar/charts for each activity type
export const ACTIVITY_COLORS: Record<CareType, string> = {
  walking:  '#0033FF',
  teeth:    '#00C853',
  training: '#FF9500',
  worming:  '#AF52DE',
  vet:      '#FF3B30',
  grooming: '#34AADC',
};

export const WEEKLY_TYPES:   Array<'walking' | 'teeth' | 'training'>     = ['walking', 'teeth', 'training'];
export const PERIODIC_TYPES: Array<'worming' | 'vet' | 'grooming'>        = ['worming', 'vet', 'grooming'];
