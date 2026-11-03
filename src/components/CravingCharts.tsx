import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { CravingEvent } from '../types';
import { colors, fonts, radii, spacing } from '../theme';

/**
 * PulseBuddy-style charts for Stats, built from the real craving log:
 *
 * 1. CravingWaveChart — the signature thin wavy line: cravings by
 *    hour of day across the whole log, drawn as a smooth curve with a
 *    peach-to-lavender gradient stroke, a soft gradient area fill,
 *    white dot markers, and a vertical "now" line at the current
 *    hour. Time labels run 12a / 6a / 12p / 6p.
 *
 * 2. TrendBarChart — a dense vertical-bar trend with 1D / 1W / 1M /
 *    3M range switching and the reference's "Average — value —
 *    status" headline. 1D shows today's 24 hours; 1W the last 7 days;
 *    1M and 3M roll up by week. Bars are gradient-tinted (periwinkle
 *    into lavender); slipped cravings stack on top in warm peach.
 */

function chartWidth(windowWidth: number): number {
  // Screen padding (lg x2) + card padding (md x2) inside a 600dp cap.
  return Math.max(240, Math.min(600, windowWidth) - spacing.lg * 2 - spacing.md * 2);
}

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length < 3) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function CravingWaveChart({ cravings }: { cravings: CravingEvent[] }) {
  const { width: windowWidth } = useWindowDimensions();
  const W = chartWidth(windowWidth);
  const H = 148;
  const PAD_X = 8;
  const TOP = 14;
  const BOTTOM = 26;

  const { line, area, dots, nowX, max } = useMemo(() => {
    const byHour = new Array(24).fill(0) as number[];
    cravings.forEach((c) => {
      byHour[new Date(c.timestamp).getHours()] += 1;
    });
    const peak = Math.max(1, ...byHour);
    const innerW = W - PAD_X * 2;
    const innerH = H - TOP - BOTTOM;
    const pts = byHour.map((v, h) => ({
      x: PAD_X + (h / 23) * innerW,
      y: TOP + innerH - (v / peak) * innerH,
    }));
    const linePath = smoothPath(pts);
    return {
      line: linePath,
      area: `${linePath} L ${pts[pts.length - 1].x} ${H - BOTTOM} L ${pts[0].x} ${H - BOTTOM} Z`,
      dots: pts,
      nowX: PAD_X + (new Date().getHours() / 23) * innerW,
      max: peak,
    };
  }, [cravings, W, H]);

  return (
    <View>
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="waveStroke" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#F2A65A" />
            <Stop offset="1" stopColor="#A7A9DF" />
          </LinearGradient>
          <LinearGradient id="waveFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#A7A9DF" stopOpacity="0.35" />
            <Stop offset="1" stopColor="#D8D7F6" stopOpacity="0.04" />
          </LinearGradient>
        </Defs>
        <Path d={area} fill="url(#waveFill)" />
        <Line
          x1={nowX}
          y1={6}
          x2={nowX}
          y2={H - BOTTOM}
          stroke={colors.amberBright}
          strokeWidth={1.5}
          strokeDasharray="3 4"
        />
        <Path
          d={line}
          stroke="url(#waveStroke)"
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
        />
        {dots.map((p, i) =>
          i % 3 === 0 ? (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={3}
              fill={colors.white}
              stroke={colors.periwinkle}
              strokeWidth={1.6}
            />
          ) : null,
        )}
      </Svg>
      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>12a</Text>
        <Text style={styles.timeLabel}>6a</Text>
        <Text style={styles.timeLabel}>12p</Text>
        <Text style={styles.timeLabel}>6p</Text>
        <Text style={styles.timeLabel}>11p</Text>
      </View>
      <Text style={styles.chartNote}>
        Cravings by hour of day, all logged days. Peak hour saw {max}. The
        dashed line is now.
      </Text>
    </View>
  );
}

type RangeKey = '1D' | '1W' | '1M' | '3M';
const RANGES: RangeKey[] = ['1D', '1W', '1M', '3M'];

interface Bucket {
  label: string;
  resisted: number;
  slipped: number;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function bucketsFor(range: RangeKey, cravings: CravingEvent[]): Bucket[] {
  const now = new Date();
  const buckets: Bucket[] = [];
  const push = (label: string, from: Date, to: Date) => {
    buckets.push({
      label,
      resisted: cravings.filter((c) => {
        const t = new Date(c.timestamp);
        return t >= from && t < to && c.outcome === 'resisted';
      }).length,
      slipped: cravings.filter((c) => {
        const t = new Date(c.timestamp);
        return t >= from && t < to && c.outcome === 'slipped';
      }).length,
    });
  };
  if (range === '1D') {
    for (let h = 0; h < 24; h++) {
      const from = startOfDay(now);
      from.setHours(h);
      const to = new Date(from);
      to.setHours(h + 1);
      push(h % 6 === 0 ? `${h}` : '', from, to);
    }
  } else if (range === '1W') {
    for (let i = 6; i >= 0; i--) {
      const from = startOfDay(now);
      from.setDate(from.getDate() - i);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      push(from.toLocaleDateString('en-US', { weekday: 'narrow' }), from, to);
    }
  } else {
    const weeks = range === '1M' ? 4 : 12;
    for (let i = weeks - 1; i >= 0; i--) {
      const from = startOfDay(now);
      from.setDate(from.getDate() - (i + 1) * 7 + 1);
      const to = new Date(from);
      to.setDate(to.getDate() + 7);
      push(
        i === 0 ? 'now' : from.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        from,
        to,
      );
    }
  }
  return buckets;
}

export function TrendBarChart({ cravings }: { cravings: CravingEvent[] }) {
  const { width: windowWidth } = useWindowDimensions();
  const [range, setRange] = useState<RangeKey>('1W');
  const W = chartWidth(windowWidth);
  const H = 168;
  const BOTTOM = 22;
  const TOP = 10;

  const buckets = useMemo(() => bucketsFor(range, cravings), [range, cravings]);
  const total = buckets.reduce((a, b) => a + b.resisted + b.slipped, 0);
  const daysInRange = range === '1D' ? 1 : range === '1W' ? 7 : range === '1M' ? 28 : 84;
  const average = total / daysInRange;
  const status = useMemo(() => {
    if (total === 0) return 'no cravings logged in this window';
    const mid = Math.floor(buckets.length / 2);
    const first = buckets.slice(0, mid).reduce((a, b) => a + b.resisted + b.slipped, 0);
    const second = buckets.slice(mid).reduce((a, b) => a + b.resisted + b.slipped, 0);
    if (second < first) return 'easing off lately';
    if (second > first) return 'busier lately, worth a plan';
    return 'holding steady';
  }, [buckets, total]);

  const max = Math.max(1, ...buckets.map((b) => b.resisted + b.slipped));
  const gap = buckets.length > 12 ? 2 : 5;
  const barW = Math.max(4, (W - gap * (buckets.length - 1)) / buckets.length);
  const innerH = H - TOP - BOTTOM;

  return (
    <View>
      <Text maxFontSizeMultiplier={1.25} style={styles.averageHeadline}>
        Average — {average < 10 ? average.toFixed(1) : Math.round(average)}{' '}
        craving{average === 1 ? '' : 's'} a day
      </Text>
      <Text style={styles.averageStatus}>{status}</Text>

      <Svg width={W} height={H} style={{ marginTop: spacing.sm }}>
        <Defs>
          <LinearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#A7A9DF" />
            <Stop offset="1" stopColor="#D8D7F6" />
          </LinearGradient>
        </Defs>
        {buckets.map((b, i) => {
          const x = i * (barW + gap);
          const totalH = ((b.resisted + b.slipped) / max) * innerH;
          const resH = (b.resisted / max) * innerH;
          const slipH = totalH - resH;
          const yBase = TOP + innerH;
          return (
            <G key={i}>
              {resH > 0 && (
                <Rect
                  x={x}
                  y={yBase - resH}
                  width={barW}
                  height={resH}
                  rx={Math.min(4, barW / 2)}
                  fill="url(#barFill)"
                />
              )}
              {slipH > 0 && (
                <Rect
                  x={x}
                  y={yBase - totalH}
                  width={barW}
                  height={slipH}
                  rx={Math.min(4, barW / 2)}
                  fill={colors.amberBright}
                />
              )}
              {b.resisted + b.slipped === 0 && (
                <Rect
                  x={x}
                  y={yBase - 3}
                  width={barW}
                  height={3}
                  rx={1.5}
                  fill={colors.surfaceMuted}
                />
              )}
            </G>
          );
        })}
      </Svg>
      <View style={styles.bucketRow}>
        {buckets.map((b, i) => (
          <Text
            key={i}
            style={[styles.bucketLabel, { width: barW, marginRight: i < buckets.length - 1 ? gap : 0 }]}>
            {b.label}
          </Text>
        ))}
      </View>

      <View style={styles.rangeRow}>
        {RANGES.map((r) => (
          <Pressable
            key={r}
            onPress={() => setRange(r)}
            style={[
              styles.rangePill,
              range === r && styles.rangePillActive,
            ]}>
            <Text
              style={[
                styles.rangeText,
                range === r && styles.rangeTextActive,
              ]}>
              {r}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={[styles.legendSwatch, { backgroundColor: colors.periwinkle }]} />
        <Text style={styles.legendText}>Resisted</Text>
        <View style={[styles.legendSwatch, { backgroundColor: colors.amberBright, marginLeft: 16 }]} />
        <Text style={styles.legendText}>Slipped</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timeLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.inkFaint },
  chartNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkFaint,
    marginTop: spacing.sm,
  },
  averageHeadline: {
    fontFamily: fonts.display,
    fontSize: 21,
    lineHeight: 27,
    color: colors.charcoal,
  },
  averageStatus: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.violetGray,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  bucketRow: { flexDirection: 'row', marginTop: 4 },
  bucketLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkFaint,
    textAlign: 'center',
  },
  rangeRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    padding: 4,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  rangePill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  rangePillActive: { backgroundColor: colors.white },
  rangeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkMuted,
  },
  rangeTextActive: { color: colors.charcoal },
  legend: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3, marginRight: 6 },
  legendText: { fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted },
});
