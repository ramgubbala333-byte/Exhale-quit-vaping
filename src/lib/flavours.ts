import type { Plan } from '../types';

/**
 * Flavour library for onboarding and Settings.
 *
 * Built from the flavour menus of the major disposable/pod brands
 * (Elf Bar, Lost Mary, Geek Bar, Raz, Hyde, Esco Bar) and retailer
 * best-seller roundups, October 2026. Names are generic flavour names
 * only, no brand names, grouped the way shops group them. Watermelon
 * Ice and Blue Razz Ice lead because they lead every sales list.
 */
export interface FlavourCategory {
  id: string;
  label: string;
  flavours: string[];
}

export const FLAVOUR_CATEGORIES: FlavourCategory[] = [
  {
    id: 'fruit',
    label: 'Fruit',
    flavours: [
      'Blueberry Sour Raspberry',
      'Strawberry Raspberry Cherry',
      'Kiwi Passionfruit Guava',
      'Peach Mango',
      'Strawberry Banana',
      'Strawberry Mango',
      'Strawberry Watermelon',
      'Peach Mango Watermelon',
      'Kiwi Dragon Berry',
      'Pineapple Mango',
      'Aloe Grape',
    ],
  },
  {
    id: 'ice-mint',
    label: 'Ice & Mint',
    flavours: [
      'Watermelon Ice',
      'Blue Razz Ice',
      'Cool Mint',
      'Menthol',
      'Spearmint',
      'Grape Ice',
      'Peach Ice',
      'Banana Ice',
      'Strawberry Ice',
      'Fuji Apple Ice',
      'Lychee Ice',
    ],
  },
  {
    id: 'dessert',
    label: 'Dessert',
    flavours: [
      'Vanilla Custard',
      'Strawberry Custard',
      'Blueberry Custard',
      'Strawberry Shortcake',
      'Strawberry Milkshake',
      'Key Lime Pie',
    ],
  },
  {
    id: 'drinks',
    label: 'Drinks',
    flavours: [
      'Cola Ice',
      'Cherry Cola',
      'Pink Lemonade',
      'Blue Razz Lemonade',
      'Root Beer Float',
      'Coffee',
    ],
  },
  {
    id: 'candy',
    label: 'Candy',
    flavours: [
      'Cotton Candy',
      'White Gummy',
      'Gummy Bear',
      'Bubblegum Ice',
      'Watermelon Bubblegum',
      'Sour Apple',
    ],
  },
  {
    id: 'tobacco-classics',
    label: 'Tobacco & Classics',
    flavours: [
      'Classic Tobacco',
      'Virginia Tobacco',
      'Classic Menthol',
      'Unflavoured',
    ],
  },
];

/** Every known flavour name, flat. */
export const ALL_FLAVOURS: string[] = FLAVOUR_CATEGORIES.flatMap(
  (c) => c.flavours,
);

/**
 * The flavours on a plan, as a clean array. Handles every stored shape:
 * the current `flavours` array, the legacy single `flavour` string from
 * before the library existed, and plans with neither. Never throws.
 */
export function planFlavours(plan: Plan | null | undefined): string[] {
  if (!plan) return [];
  const list = (plan as Plan).flavours;
  if (Array.isArray(list)) {
    const clean = list.filter(
      (f): f is string => typeof f === 'string' && f.trim().length > 0,
    );
    if (clean.length > 0) return clean;
  }
  const legacy = (plan as Plan).flavour;
  if (typeof legacy === 'string' && legacy.trim().length > 0) {
    return [legacy.trim()];
  }
  return [];
}
