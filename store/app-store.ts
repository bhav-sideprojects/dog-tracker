import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData } from './types';

const STORAGE_KEY = '@dog_tracker_data';
const CURRENT_SCHEMA = 4;

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
        trainingPerWeek: 3,
        wormingFrequencyDays: 90,
        vetFrequencyDays: 365,
        groomingFrequencyDays: 42,
        wormingLastDate: null,
        vetLastDate: null,
        groomingLastDate: null,
      };
      migrated = true;
    }

    // v2: fix walking missing from buggy v1 migration
    if (
      (!parsed._schemaVersion || parsed._schemaVersion < 2) &&
      parsed.dog?.trackedActivities &&
      !parsed.dog.trackedActivities.includes('walking')
    ) {
      parsed.dog.trackedActivities = ['walking', ...parsed.dog.trackedActivities];
      parsed.dog.walkingPerWeek = parsed.dog.walkingPerWeek ?? 4;
      migrated = true;
    }

    // v3: add grooming/training fields
    if ((!parsed._schemaVersion || parsed._schemaVersion < 3) && parsed.dog) {
      parsed.dog.trainingPerWeek      = parsed.dog.trainingPerWeek      ?? 3;
      parsed.dog.groomingFrequencyDays = parsed.dog.groomingFrequencyDays ?? 42;
      parsed.dog.groomingLastDate     = parsed.dog.groomingLastDate     ?? null;
      migrated = true;
    }

    // v4: add feeding + notification settings (do NOT add 'feeding' to trackedActivities — user opts in)
    if ((!parsed._schemaVersion || parsed._schemaVersion < 4) && parsed.dog) {
      parsed.dog.feedingTimesPerDay      = parsed.dog.feedingTimesPerDay ?? 2;
      parsed.dog.feedingTimes            = parsed.dog.feedingTimes       ?? [{ hour: 8, minute: 0 }, { hour: 18, minute: 0 }];
      parsed.dog.activityNotifications   = parsed.dog.activityNotifications ?? {
        feeding:  { enabled: true,  hour: 8,  minute: 0 },
        worming:  { enabled: true,  hour: 9,  minute: 0 },
        vet:      { enabled: true,  hour: 9,  minute: 0 },
        grooming: { enabled: true,  hour: 9,  minute: 0 },
        walking:  { enabled: false, hour: 9,  minute: 0 },
        teeth:    { enabled: false, hour: 20, minute: 0 },
        training: { enabled: false, hour: 10, minute: 0 },
      };
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
