import { StyleSheet, Text, View } from 'react-native';

import { formatMoneyExact } from '../lib/calc';
import { colors, fonts, radii, spacing } from '../theme';
import { CoinJar, coinsForMoney } from './CoinJar';
import { Label } from './ui';

/**
 * The coin collector: the Home screen's money-kept display. Instead of
 * a bare dollar figure, lifetime money kept shows up as coins piling
 * into a box the user can watch fill (see CoinJar for the drop
 * payoff). It renders for every user, savings goal or not, and the
 * exact total survives only as the caption line under the jar. This
 * card is the Home jar that performs coin drops on focus; the savings
 * strip's smaller jar, when present, stays passive.
 */
export function CoinCollector({ moneyKept }: { moneyKept: number }) {
  const coins = coinsForMoney(moneyKept);
  return (
    <View style={styles.card}>
      <Label color={colors.pine}>Coin collector</Label>
      <View style={styles.jarSlot}>
        <CoinJar moneyKept={moneyKept} height={170} />
      </View>
      <Text style={styles.caption}>
        {formatMoneyExact(moneyKept)} kept · {coins} coin
        {coins === 1 ? '' : 's'} in the box
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  jarSlot: { alignItems: 'center', marginTop: spacing.md },
  caption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.pine,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
