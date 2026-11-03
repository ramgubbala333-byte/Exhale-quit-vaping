import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '../theme';

export interface DayCravings {
  /** Short day label, e.g. "Thu". */
  label: string;
  resisted: number;
  slipped: number;
}

/**
 * Hand-rolled stacked bar chart for the last 7 days of craving events.
 * Resisted segments sit in pine at the bottom; slips stack on top in clay.
 */
export default function CravingBarChart({ data }: { data: DayCravings[] }) {
  const max = Math.max(1, ...data.map((d) => d.resisted + d.slipped));
  const CHART_HEIGHT = 120;

  return (
    <View>
      <View style={styles.chart}>
        {data.map((d, i) => {
          const total = d.resisted + d.slipped;
          return (
            <View key={i} style={styles.column}>
              <Text style={styles.count}>{total > 0 ? total : ''}</Text>
              <View style={styles.barTrack}>
                {total > 0 ? (
                  <View style={{ height: Math.max(6, (total / max) * CHART_HEIGHT) }}>
                    {d.slipped > 0 ? (
                      <View
                        style={{
                          height: (d.slipped / total) * 100 + '%',
                          backgroundColor: colors.clay,
                          borderTopLeftRadius: 4,
                          borderTopRightRadius: 4,
                        }}
                      />
                    ) : null}
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: colors.pine,
                        borderTopLeftRadius: d.slipped > 0 ? 0 : 4,
                        borderTopRightRadius: d.slipped > 0 ? 0 : 4,
                        borderBottomLeftRadius: 4,
                        borderBottomRightRadius: 4,
                      }}
                    />
                  </View>
                ) : null}
              </View>
              <Text style={styles.dayLabel}>{d.label}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <View style={[styles.legendSwatch, { backgroundColor: colors.pine }]} />
        <Text style={styles.legendText}>Resisted</Text>
        <View
          style={[
            styles.legendSwatch,
            { backgroundColor: colors.clay, marginLeft: 16 },
          ]}
        />
        <Text style={styles.legendText}>Slipped</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 170,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lineStrong,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  count: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.ink,
    marginBottom: 4,
    height: 16,
  },
  barTrack: { width: 26, justifyContent: 'flex-end' },
  dayLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 8,
  },
  legend: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3, marginRight: 6 },
  legendText: { fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted },
});
