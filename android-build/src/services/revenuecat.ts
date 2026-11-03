/**
 * RevenueCat integration point, intentionally dormant in v1.
 *
 * Exhale is fully free in v1 for legal reasons: no purchases are offered,
 * no SDK key is configured, and every function here is a safe no-op that
 * reports "unavailable". When monetization is approved:
 *
 *   1. `npm install react-native-purchases`
 *   2. Put the public SDK keys in app config (expo-constants extra) and
 *      pass them to `configurePurchases()`.
 *   3. Replace the stub bodies below with the real Purchases calls
 *      (configure / getOfferings / purchasePackage / getCustomerInfo).
 *   4. The paywall screen already consumes `getPlusOfferings()` and
 *      `purchasePlus()`, so only this file needs to change.
 */

export interface PlusOffering {
  id: string;
  label: string;
  priceLabel: string;
  period: 'monthly' | 'yearly';
  note: string;
}

/** Display data for the dormant paywall. Prices are illustrative only. */
export const PLUS_OFFERINGS: PlusOffering[] = [
  {
    id: 'exhale_plus_monthly',
    label: 'Monthly',
    priceLabel: '$4.99 / month',
    period: 'monthly',
    note: 'Full flexibility, cancel anytime.',
  },
  {
    id: 'exhale_plus_yearly',
    label: 'Yearly',
    priceLabel: '$29.99 / year',
    period: 'yearly',
    note: 'About $2.50 a month, billed once a year.',
  },
];

export type PurchaseResult =
  | { status: 'success' }
  | { status: 'unavailable'; reason: string };

export function configurePurchases(): void {
  // No-op in v1: no SDK key exists and the purchases SDK is not installed.
}

export async function getPlusOfferings(): Promise<PlusOffering[]> {
  return PLUS_OFFERINGS;
}

export async function purchasePlus(_offeringId: string): Promise<PurchaseResult> {
  return {
    status: 'unavailable',
    reason: 'Exhale Plus is not on sale yet. Everything in Exhale is free.',
  };
}

export async function hasPlusEntitlement(): Promise<boolean> {
  return false;
}
