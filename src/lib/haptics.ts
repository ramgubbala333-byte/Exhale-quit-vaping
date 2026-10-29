import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * A small haptic vocabulary, in one module, fired on the finger (the
 * press), never when an animation ends. If everything buzzes, nothing
 * does, so each word has exactly one job:
 *
 * - tick:    picking things (chips, options, thresholds)
 * - tap:     ordinary buttons
 * - commit:  consequential logs (a puff logged, a mission done)
 * - success: genuine completions only (milestone reached, craving resisted)
 *
 * All calls are guarded: web and unsupported devices simply stay silent,
 * and a haptics failure can never break a flow.
 */

function fire(fn: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  try {
    fn().catch(() => {});
  } catch {
    // Haptics are garnish. Swallow everything.
  }
}

export const haptics = {
  tick: () => fire(() => Haptics.selectionAsync()),
  tap: () =>
    fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  commit: () =>
    fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () =>
    fire(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    ),
};
