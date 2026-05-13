import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData } from './types';

const STORAGE_KEY = '@dog_tracker_data';
const CURRENT_SCHEMA = 2;

const DEFAULT_DATA: AppData = { dog: null, logs: [], _schemaVersion: CURRENT_SCHEMA };

export async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw) as AppData;
    let migrated = false;

    // v1: add missing profile fields (pre-trackedActivities era)
    if (parsed.dog && !parsed.dog.trackedActivities) {
      parsed.dog = {
        ...parsed.dog,
        trackedActivities: ['walking', 'teeth', 'worming', 'vet'],
        walkingPerWeek: 4,
        teethPerWeek: 7,
        wormingFrequencyDays: 90,
        vetFrequencyDays: 365,
        wormingLastDate: null,
        vetLastDate: null,
      };
      migrated = true;
    }

    // v2: fix walking missing from buggy v1 migration (missing schema version means pre-v2)
    if (
      (!parsed._schemaVersion || parsed._schemaVersion < 2) &&
      parsed.dog?.trackedActivities &&
      !parsed.dog.trackedActivities.includes('walking')
    ) {
      parsed.dog.trackedActivities = ['walking', ...parsed.dog.trackedActivities];
      parsed.dog.walkingPerWeek = parsed.dog.walkingPerWeek ?? 4;
      migrated = true;
    }

    if (migrated || !parsed._schemaVersion) {
      parsed._schemaVersion = CURRENT_SCHEMA;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }

    return parsed;
  } catch {
    return DEFAULT_DATA;
  }
}

export async function saveData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, _schemaVersion: CURRENT_SCHEMA }));
}

export async function clearData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
