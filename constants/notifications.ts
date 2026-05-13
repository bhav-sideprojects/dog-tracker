import * as Notifications from 'expo-notifications';
import { CareLog, CareType, DogProfile } from '@/store/types';

// ── Message pools per activity ────────────────────────────────────────────────

const MESSAGES: Partial<Record<CareType, { title: string; body: string }[]>> = {
  feeding: [
    { title: '🍽️ Feeding Time!',   body: "I'm sooooo hungry 😢" },
    { title: '🐾 Nom nom time!',    body: "My tummy is making very weird noises 🥺" },
    { title: '🦴 Dinner bell!',     body: "Did you forget about meee?! 😭" },
    { title: '🍽️ Food o\'clock!',  body: "FEED ME. PLEASE. NOW. 🐾" },
    { title: '🐾 Hungry doggo!',    body: "*stares at you with the saddest eyes* 👀" },
    { title: '🦴 Empty bowl!',      body: "My bowl is empty and so is my heart 💔" },
    { title: '🍽️ Meal time!',      body: "I promise I haven't eaten in FOREVER 😤" },
  ],
  walking: [
    { title: '🐾 Walk time!',          body: "I need to sniff ALL the things! 🐶" },
    { title: '🐾 Walkies?!',           body: "WALKIES?! YES PLEASE! 🏃" },
    { title: '🐾 Zoomies incoming!',   body: "If I don't walk soon I can't be held responsible 😤" },
    { title: '🐾 Outside time!',       body: "The world awaits... and so do my enemies (squirrels) 🐿️" },
  ],
  teeth: [
    { title: '🦷 Teeth time!',         body: "Fresh breath, happy pup 😁" },
    { title: '🦷 Brush me!',           body: "My pearly whites need attention! ✨" },
    { title: '🦷 Dental care time!',   body: "The vet said I have great teeth... let's keep it that way 😬" },
  ],
  training: [
    { title: '🎓 Training time!',      body: "Ready to be a good boi! 🌟" },
    { title: '🎓 Lesson time!',        body: "I already know sit, but let's pretend I don't 😏" },
    { title: '🎓 Practice time!',      body: "Treats available? Then I\'m SO ready! 🦴" },
  ],
  worming: [
    { title: '💊 Worming due!',        body: "Time for my worming tablet 🐾 Keep me healthy!" },
    { title: '💊 Health reminder!',    body: "Worming treatment is overdue! Stay on top of it 💊" },
  ],
  vet: [
    { title: '🏥 Vet visit due!',      body: "Time for my check-up. I'll be brave 🩺" },
    { title: '🏥 Health check time!',  body: "Annual vet visit is coming up! 🐾" },
  ],
  grooming: [
    { title: '✂️ Grooming time!',      body: "I'm starting to look a little scruffy... ✂️" },
    { title: '✂️ Spa day!',            body: "Groom me! I deserve to look fabulous 💅" },
  ],
};

function pickMessage(type: CareType, slot = 0) {
  const pool = MESSAGES[type] ?? [{ title: '🐾 Reminder!', body: `Time for ${type}!` }];
  return pool[(slot + new Date().getDay()) % pool.length];
}

const notifId = (type: CareType, slot = 0) =>
  slot > 0 ? `dog-notif-${type}-${slot}` : `dog-notif-${type}`;

async function cancelType(type: CareType, slots = 1) {
  for (let i = 0; i < slots; i++) {
    await Notifications.cancelScheduledNotificationAsync(notifId(type, i)).catch(() => {});
  }
}

// ── Main scheduling function ──────────────────────────────────────────────────

export async function scheduleAllNotifications(dog: DogProfile, logs: CareLog[]): Promise<void> {
  const notifs = dog.activityNotifications ?? {};

  // ── Feeding: one notification per configured time slot ────────────────────
  await cancelType('feeding', 3);
  if (dog.trackedActivities.includes('feeding')) {
    const cfg = notifs.feeding;
    if (!cfg || cfg.enabled) {
      for (let i = 0; i < dog.feedingTimes.length; i++) {
        const { hour, minute } = dog.feedingTimes[i];
        const msg = pickMessage('feeding', i);
        await Notifications.scheduleNotificationAsync({
          identifier: notifId('feeding', i),
          content: { title: msg.title, body: msg.body, sound: true },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
        });
      }
    }
  }

  // ── Weekly activities: daily reminder at configured time ──────────────────
  const weekly = ['walking', 'teeth', 'training'] as const;
  for (const type of weekly) {
    await cancelType(type);
    if (!dog.trackedActivities.includes(type)) continue;
    const cfg = notifs[type];
    if (!cfg?.enabled) continue;
    const msg = pickMessage(type);
    await Notifications.scheduleNotificationAsync({
      identifier: notifId(type),
      content: { title: msg.title, body: msg.body, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: cfg.hour, minute: cfg.minute },
    });
  }

  // ── Periodic activities: one-time notification at due date ────────────────
  const freqDays: Record<string, number> = {
    worming: dog.wormingFrequencyDays,
    vet:     dog.vetFrequencyDays,
    grooming: dog.groomingFrequencyDays,
  };
  const periodic = ['worming', 'vet', 'grooming'] as const;
  for (const type of periodic) {
    await cancelType(type);
    if (!dog.trackedActivities.includes(type)) continue;
    const cfg = notifs[type];
    if (!cfg?.enabled) continue;
    const lastLog = logs
      .filter(l => l.type === type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    if (!lastLog) continue;
    const due = new Date(lastLog.date);
    due.setDate(due.getDate() + freqDays[type]);
    due.setHours(cfg.hour, cfg.minute, 0, 0);
    if (due > new Date()) {
      const msg = pickMessage(type);
      const secondsUntil = Math.floor((due.getTime() - Date.now()) / 1000);
      await Notifications.scheduleNotificationAsync({
        identifier: notifId(type),
        content: { title: msg.title, body: msg.body, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secondsUntil, repeats: false },
      });
    }
  }
}

export async function cancelAllActivityNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
