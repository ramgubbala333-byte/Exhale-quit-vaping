/**
 * One encouragement line per day on Home. Written for quitters, kept
 * plain on purpose: no promises about health, no medical advice, no
 * hype. The pick is deterministic by local date, so the line is stable
 * all day and changes at midnight.
 */
export const DAILY_LINES: string[] = [
  'The urge peaks, then it passes. You only have to outlast the peak.',
  'You already did the hardest part: you started.',
  'Cravings are weather. They move through, and the sky clears.',
  'Every hour on that clock was earned, not given.',
  'One craving at a time. That is the whole method.',
  'You do not have to feel strong. You only have to stay.',
  'The money you keep is proof you can keep a promise to yourself.',
  'Some days are loud. Quiet days are coming too.',
  'Notice how short the hard moments actually are.',
  'Your reasons were written by a clear-headed you. Trust them.',
  'A craving is a habit asking for its old routine. It can learn a new one.',
  'You are not missing out. You are opting out.',
  'Small wins stack. Today is another one.',
  'Boredom passes. So does stress. Neither needs a puff.',
  'The first weeks teach your hands new places to rest.',
  'You have ridden out every craving so far. The record is perfect.',
  'Keep the streak boring. Boring is winning.',
  'When the urge talks, let it finish. Then let it leave.',
  'Nobody regrets the puff they did not take.',
  'Your wallet has already noticed the difference.',
  'Discomfort is not danger. It is just discomfort.',
  'You are building a story you will tell with pride.',
  'Each free day is a day your old habit gets quieter.',
  'Rest counts. Sleep is part of the quit.',
  'You do not need a perfect day. Just this one.',
  'The urge exaggerates how long it will last.',
  'Progress is a pile of ordinary days, stacked.',
  'You chose this on purpose. That purpose still holds.',
  'Hands busy, mind busy, craving smaller.',
  'There is no finish line today. There is only today.',
  'The version of you from last week is rooting for this one.',
  'Slow down. Breathe out. Let the minute pass.',
];

/** The line for a given local date. Same line all day, new one tomorrow. */
export function dailyLine(date: Date = new Date()): string {
  const dayStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const dayIndex = Math.floor(dayStart / 86400000);
  const idx =
    ((dayIndex % DAILY_LINES.length) + DAILY_LINES.length) % DAILY_LINES.length;
  return DAILY_LINES[idx];
}
