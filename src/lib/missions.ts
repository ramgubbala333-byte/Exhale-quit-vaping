/**
 * One daily mission. A single, small, evidence-flavoured task per day,
 * in the pattern of Smoke Free's daily missions (the one
 * gamification-adjacent feature with RCT support). The bank is static
 * and local; the pick rotates deterministically by local date so the
 * mission is stable all day. Skipping carries no penalty and no guilt
 * copy: tomorrow is simply a new mission.
 */

export interface Mission {
  id: string;
  title: string;
  detail: string;
}

export const MISSIONS: Mission[] = [
  {
    id: 'photo-kept',
    title: 'Photograph a possibility',
    detail: 'Take a photo of something your kept money could buy. Keep it in your camera roll for hard days.',
  },
  {
    id: 'walk-danger-hour',
    title: 'Walk at your usual craving hour',
    detail: 'Take a 10-minute walk at the time cravings usually visit. Show that hour a different routine.',
  },
  {
    id: 'journal-one-line',
    title: 'Write one line in your journal',
    detail: 'One honest line. That is the whole assignment.',
  },
  {
    id: 'tell-day-count',
    title: 'Tell one person your day count',
    detail: 'Out loud or by message. Saying it makes it more real, in a good way.',
  },
  {
    id: 'sweep-today',
    title: "Move today's kept money",
    detail: 'In your banking app, move what today would have cost you into savings. Watch the quit pay you.',
  },
  {
    id: 'clear-hiding-spot',
    title: 'Clean out one vape hiding spot',
    detail: 'One drawer, one pocket, one glovebox. Empty it of the old life.',
  },
  {
    id: 'new-flavour-mouth',
    title: 'Give your mouth a new flavour',
    detail: 'Try a new gum, mint, or tea today. Your taste buds are relearning the world.',
  },
  {
    id: 'practise-surf-calm',
    title: 'Practise the wave while calm',
    detail: 'Open SOS and ride the wave timer once, with no craving at all. Reps count double when they are easy.',
  },
  {
    id: 'charge-out-of-reach',
    title: 'Charge it out of reach',
    detail: 'If a device is still in the house, put its charger somewhere annoying. Friction is a feature.',
  },
  {
    id: 'water-first',
    title: 'Water before anything',
    detail: 'At your first craving today, drink a full glass of cold water before you decide anything.',
  },
  {
    id: 'hands-busy',
    title: 'Ten minutes, hands busy',
    detail: 'Cook, clean, fix, build, play. Ten minutes where your hands have a job.',
  },
  {
    id: 'breathe-square',
    title: 'One slow breathing round',
    detail: 'Open the breathing tool and do a single full round, craving or not.',
  },
  {
    id: 'note-the-trigger',
    title: 'Name a trigger before it names you',
    detail: 'Write down one situation that will probably call for a puff today, and your if-then plan for it.',
  },
  {
    id: 'morning-light',
    title: 'Get outside before noon',
    detail: 'Five minutes of daylight. Energy and sleep both thank you later.',
  },
  {
    id: 'check-the-jar',
    title: 'Look at your numbers',
    detail: 'Open Stats and read them slowly. That record is yours; you built every line of it.',
  },
  {
    id: 'text-your-person',
    title: 'Message your person a good update',
    detail: 'Tell them how the quit is going while things are calm. It makes the hard-day message easier to send.',
  },
  {
    id: 'sweeten-the-evening',
    title: 'Plan tonight, on purpose',
    detail: 'Decide now what tonight looks like without vaping. A plan made early is a craving pre-answered.',
  },
  {
    id: 'move-the-queue',
    title: 'Reorder one routine',
    detail: 'Coffee on a different chair, a different route to work. Small changes break automatic loops.',
  },
  {
    id: 'five-minute-tidy',
    title: 'Five-minute reset of one space',
    detail: 'Set a timer and tidy one small area. A calmer room is a quieter mind.',
  },
  {
    id: 'log-a-pattern',
    title: 'Catch a craving early',
    detail: 'If a craving shows up today, log it in SOS and tag the trigger. You are building your own map.',
  },
  {
    id: 'replace-the-ritual',
    title: 'Give the break a new script',
    detail: 'At your usual vape break, do the replacement on purpose: step out, breathe, come back.',
  },
  {
    id: 'sleep-on-time',
    title: 'Protect tonight’s sleep',
    detail: 'Pick a lights-out time now and keep it. Well-rested people crave less fiercely.',
  },
  {
    id: 'sugar-of-another-kind',
    title: 'Eat something you enjoy, slowly',
    detail: 'A real meal or a favourite snack, eaten like you mean it. Pleasure is allowed; it just changed address.',
  },
  {
    id: 'shower-reset',
    title: 'Take the reset shower',
    detail: 'Hot or cold, your call. A shower at the hard hour changes the channel.',
  },
  {
    id: 'read-your-reasons',
    title: 'Read your reasons out loud',
    detail: 'They are in your Why cards. Hearing your own voice make the case is different from reading it.',
  },
  {
    id: 'help-someone',
    title: 'Do one small useful thing for someone',
    detail: 'Anything. Being needed is a strong flavour of self-respect.',
  },
  {
    id: 'stretch-ten',
    title: 'Stretch for ten minutes',
    detail: 'Neck, shoulders, back, hands. Your body is doing repair work; lend it a hand.',
  },
  {
    id: 'phone-down-hour',
    title: 'One hour, phone in another room',
    detail: 'Scrolling is a craving delivery system. Starve it for an hour.',
  },
  {
    id: 'tomorrow-plan',
    title: 'Write tomorrow’s hardest moment',
    detail: 'One line in your journal: when will tomorrow push hardest, and what is your plan for it?',
  },
  {
    id: 'celebrate-small',
    title: 'Mark the day on purpose',
    detail: 'Do one small thing that says: this day counted. A good coffee, a song loud, a walk without your phone.',
  },
];

/** Local yyyy-mm-dd key for a date. Mission records are keyed by this. */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today's mission, deterministic by local date. */
export function missionForDate(date: Date = new Date()): Mission {
  const dayStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const dayIndex = Math.floor(dayStart / 86400000);
  const idx =
    ((dayIndex % MISSIONS.length) + MISSIONS.length) % MISSIONS.length;
  return MISSIONS[idx];
}
