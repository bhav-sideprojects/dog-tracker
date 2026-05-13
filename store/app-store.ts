import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData } from './types';

const STORAGE_KEY = '@dog_tracker_data';

const DEFAULT_DATA: AppData = { dog: null, logs: [] };

export async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw) as AppData;
    // Migrate old profiles that predate the trackedActivities/frequency fields
    if (parsed.dog && !parsed.dog.trackedActivities) {
      parsed.dog = {
        ...parsed.dog,
        trackedActivities: ['teeth', 'worming', 'vet'],
        walkingPerWeek: 4,
        teethPerWeek: 7,
        wormingFrequencyDays: 90,
        vetFrequencyDays: 365,
        wormingLastDate: null,
        vetLastDate: null,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return DEFAULT_DATA;
  }
}

export async function saveData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
