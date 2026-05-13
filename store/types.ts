export type CareType = 'teeth' | 'worming' | 'vet' | 'walking' | 'grooming' | 'training' | 'feeding';
export type BreedId = 'corgi' | 'dachshund' | 'frenchie' | 'husky' | 'poodle';

export type FeedingTime = { hour: number; minute: number }; // 24-hour

export type ActivityNotification = {
  enabled: boolean;
  hour: number;   // 24-hour
  minute: number;
};

export type CareLog = {
  id: string;
  type: CareType;
  date: string; // ISO date string
};

export type DogProfile = {
  name: string;
  breed: BreedId;
  trackedActivities: CareType[];
  walkingPerWeek: number;
  teethPerWeek: number;
  trainingPerWeek: number;
  wormingFrequencyDays: number;
  vetFrequencyDays: number;
  groomingFrequencyDays: number;
  wormingLastDate: string | null;
  vetLastDate: string | null;
  groomingLastDate: string | null;
  feedingTimesPerDay: number;
  feedingTimes: FeedingTime[];
  activityNotifications: Partial<Record<CareType, ActivityNotification>>;
};

export type AppData = {
  dog: DogProfile | null;
  logs: CareLog[];
  _schemaVersion?: number;
};
