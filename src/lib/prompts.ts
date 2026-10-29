/**
 * Journal bookends, in the pattern of structured journaling apps like
 * Stoic: the day opens with an intention and closes with a reflection,
 * each with one prompt so the page is never blank. Prompts rotate
 * deterministically by date. They are questions, not advice: no medical
 * claims, no therapy framing, the user writes the answers.
 */

export type PromptSlot = 'morning' | 'evening';

export const MORNING_PROMPTS: string[] = [
  'What is one thing today’s cravings will try to take from you?',
  'Where will today be hardest, and what is your plan for that moment?',
  'What would the person you are becoming do with this morning?',
  'Name one good thing that is only possible because you quit.',
  'What does your body get from you today?',
  'If a craving could talk you out of today, what would it say? Answer it now.',
  'What is worth protecting today?',
  'Which of your reasons matters most this morning?',
  'What small pleasure are you scheduling on purpose today?',
  'What did yesterday teach you about your own strength?',
  'Who could use a strong version of you today?',
  'Finish this: today, when it gets hard, I will…',
];

export const EVENING_PROMPTS: string[] = [
  'Where were you strongest today?',
  'What did today’s hardest craving actually want, underneath the craving?',
  'What helped today that you want to remember?',
  'Did anything surprise you about yourself today?',
  'What will you do the same tomorrow? What will you change?',
  'Grade the day kindly: what went right first?',
  'Which trigger showed up, and what did you learn about it?',
  'What did the money you kept today feel like?',
  'What is one sentence of credit you owe yourself tonight?',
  'How does your body feel compared with a week ago?',
  'What almost got you today, and what will you set up against it?',
  'End the day plainly: what are you proud of, however small?',
];

export function promptForSlot(slot: PromptSlot, date: Date = new Date()): string {
  const bank = slot === 'morning' ? MORNING_PROMPTS : EVENING_PROMPTS;
  const dayStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const dayIndex = Math.floor(dayStart / 86400000);
  const idx = ((dayIndex % bank.length) + bank.length) % bank.length;
  return bank[idx];
}

/** Which slot a moment belongs to: intention before noon, reflection from 6 PM. */
export function activeSlot(date: Date = new Date()): PromptSlot | null {
  const h = date.getHours();
  if (h < 12) return 'morning';
  if (h >= 18) return 'evening';
  return null;
}
