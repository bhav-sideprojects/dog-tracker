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
  walkingPerWeek: number;
  teethPerWeek: number;
};

export type AppData = {
  dog: DogProfile | null;
  logs: CareLog[];
};
