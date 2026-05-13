export type CareType = 'teeth' | 'worming' | 'vet' | 'walking';
export type BreedId = 'corgi' | 'dachshund' | 'frenchie' | 'husky' | 'poodle';

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
  wormingFrequencyDays: number; // default 90
  vetFrequencyDays: number;     // default 365
  wormingLastDate: string | null;
  vetLastDate: string | null;
};

export type AppData = {
  dog: DogProfile | null;
  logs: CareLog[];
};
