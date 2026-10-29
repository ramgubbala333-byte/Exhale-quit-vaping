import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import {
  FORECAST_MIN_CRAVINGS,
  cravingForecast,
} from '../lib/forecast';
import type { CravingEvent } from '../types';
import { colors, fonts, spacing } from '../theme';
import { Body, GhostButton } from './ui';

/**
 * "Your danger window": once enough cravings are logged, this card
 * names the window they cluster in so the user can get ahead of it.
 * Before that it is an honest placeholder, never a guess dressed up
 * as insight.
 */
export default function CravingForecast({
  cravings,
}: {
  cravings: CravingEvent[];
}) {
  const forecast = cravingForecast(cravings);

  if (!forecast) {
    const remaining = FORECAST_MIN_CRAVINGS - cravings.length;
    return (
      <View>
        <Body color={colors.inkMuted}>
          Log cravings to unlock your pattern. After{' '}
          {FORECAST_MIN_CRAVINGS} logged cravings, this card names the
          time of day yours cluster in, so you can be ready before it
          arrives.
        </Body>
        {cravings.length > 0 && (
          <Text style={styles.progress}>
            {cravings.length} of {FORECAST_MIN_CRAVINGS} logged,{' '}
            {remaining} to go.
          </Text>
        )}
      </View>
    );
  }

  return (
    <View>
      <Text maxFontSizeMultiplier={1.3} style={styles.headline}>
        {forecast.headline}
      </Text>
      <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
        {forecast.peakDaypartCount} of your {forecast.totalCravings} logged
        cravings landed {forecast.peakDaypart.phrase}. When that window
        approaches, open SOS before the urge peaks, or keep it one tap
        away.
      </Body>
      <View style={styles.actionRow}>
        <GhostButton title="Open SOS now" onPress={() => router.push('/sos')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headline: {
    fontFamily: fonts.display,
    fontSize: 21,
    lineHeight: 27,
    color: colors.pineDeep,
  },
  progress: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.amber,
    marginTop: spacing.sm,
  },
  actionRow: { alignItems: 'flex-start', marginLeft: -12, marginBottom: -8 },
});
