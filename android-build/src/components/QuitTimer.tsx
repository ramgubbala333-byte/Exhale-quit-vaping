import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { durationParts, elapsedSeconds } from '../lib/calc';
import type { Plan } from '../types';
import { colors, fonts } from '../theme';

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Ticking quit timer: large day count plus HH:MM:SS underneath. */
export default function QuitTimer({ plan }: { plan: Plan }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const parts = durationParts(elapsedSeconds(plan, now));

  return (
    <View>
      <View style={styles.dayRow}>
        <Text style={styles.days}>{parts.days}</Text>
        <Text style={styles.daysUnit}>{parts.days === 1 ? 'day' : 'days'}</Text>
      </View>
      <Text style={styles.clock}>
        {pad(parts.hours)}:{pad(parts.minutes)}:{pad(parts.seconds)}
      </Text>
      <Text style={styles.caption}>hours, minutes, seconds nicotine-free</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dayRow: { flexDirection: 'row', alignItems: 'baseline' },
  days: {
    fontFamily: fonts.displayBold,
    fontSize: 84,
    lineHeight: 88,
    color: colors.pineDeep,
  },
  daysUnit: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.pine,
    marginLeft: 10,
  },
  clock: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 24,
    letterSpacing: 3,
    color: colors.ink,
    marginTop: 2,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 4,
  },
});
