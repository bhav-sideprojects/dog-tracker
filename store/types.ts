export type CareType = 'teeth' | 'worming' | 'vet' | 'walking' | 'grooming' | 'training';
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
  trainingPerWeek: number;
  wormingFrequencyDays: number;
  vetFrequencyDays: number;
  groomingFrequencyDays: number;
  wormingLastDate: string | null;
  vetLastDate: string | null;
  groomingLastDate: string | null;
};

export type AppData = {
  dog: DogProfile | null;
  logs: CareLog[];
  _schemaVersion?: number;
};
