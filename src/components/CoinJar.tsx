import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { haptics } from '../lib/haptics';
import { useReduceMotion } from '../lib/useReduceMotion';
import { useStore } from '../store/useStore';
import { colors, fonts } from '../theme';

/**
 * The coin jar: money kept becomes coins in a glass jar. One coin per
 * $2 of LIFETIME money kept (banked + current streak, so a slip never
 * takes a coin back out), capped at a full jar of 48.
 *
 * The payoff the owner asked for: when the jar is seen again after the
 * kept total has grown (a resisted craving, another day banked), the
 * newest coins visibly drop in from the jar's mouth, up to 3 animated
 * per view; any further new coins are already resting in the pile.
 * Growth is measured against the store's jarSeenMoney, so the drop
 * plays once per real increase, on whichever screen is focused first.
 *
 * Drawing is flat SVG in the app's pine/amber/paper palette: a simple
 * jar outline, coins as amber discs with one inner ring. No gradients,
 * no gloss. Pile positions are deterministic functions of the coin
 * index, so the pile never reshuffles between renders.
 */

export const DOLLARS_PER_COIN = 2;
export const MAX_COINS = 48;
const MAX_ANIMATED_DROPS = 3;

export function coinsForMoney(money: number): number {
  if (!Number.isFinite(money) || money <= 0) return 0;
  return Math.min(MAX_COINS, Math.floor(money / DOLLARS_PER_COIN));
}

// --- Jar + pile geometry, in SVG viewBox units (124 x 168) ---

const VB_W = 124;
const VB_H = 168;
const CENTER_X = 62;
const COIN_R = 8.2;
const SPACING_X = 17;
const ROW_DY = 12.4;
const ROW0_Y = 144;
/** Coins per row, bottom row first; sums to MAX_COINS. */
const ROW_CAPS = [6, 5, 6, 5, 6, 5, 6, 5, 4];

interface CoinSlot {
  x: number;
  y: number;
  r: number;
}

const SLOTS: CoinSlot[] = (() => {
  const slots: CoinSlot[] = [];
  let i = 0;
  ROW_CAPS.forEach((cap, row) => {
    const startX = CENTER_X - ((cap - 1) * SPACING_X) / 2;
    for (let k = 0; k < cap; k++) {
      // Small fixed jitters from the index (sin seeds) so the pile looks
      // hand-settled, identical on every render.
      const jx = Math.sin(i * 12.9898) * 1.5;
      const jy = Math.sin(i * 43.7) * 0.7;
      const jr = Math.sin(i * 78.233) * 0.8;
      slots.push({
        x: startX + k * SPACING_X + jx,
        y: ROW0_Y - row * ROW_DY + jy,
        r: COIN_R + jr,
      });
      i++;
    }
  });
  return slots;
})();

const JAR_PATH =
  'M 43 10 L 81 10 L 81 22 C 81 33 111 38 111 54 L 111 146 ' +
  'C 111 157 103 163 92 163 L 32 163 C 21 163 13 157 13 146 L 13 54 ' +
  'C 13 38 43 33 43 22 Z';

interface FallingCoin {
  slot: number;
  pos: Animated.ValueXY;
}

export function CoinJar({
  moneyKept,
  height = 150,
  percentLabel,
  animateDrops = true,
}: {
  moneyKept: number;
  /** Rendered height in px; width follows the jar's own aspect. */
  height?: number;
  /** Optional big percent shown over the jar (full-size Stats jar). */
  percentLabel?: string;
  /**
   * When false, this jar is a passive picture of the pile: it always
   * shows every coin and never performs drops or touches the shared
   * jarSeenMoney marker. Used where a second jar shares a screen with
   * the jar that owns the payoff (e.g. the Home savings strip beside
   * the coin collector), so only one jar ever consumes the growth.
   */
  animateDrops?: boolean;
}) {
  const jarSeenMoney = useStore((s) => s.jarSeenMoney);
  const setJarSeenMoney = useStore((s) => s.setJarSeenMoney);
  const reduceMotion = useReduceMotion();

  const totalCoins = coinsForMoney(moneyKept);
  const [settled, setSettled] = useState(() =>
    animateDrops
      ? Math.min(totalCoins, coinsForMoney(jarSeenMoney))
      : totalCoins,
  );
  const [falling, setFalling] = useState<FallingCoin[]>([]);
  const [layout, setLayout] = useState<{ w: number; h: number } | null>(null);

  const moneyRef = useRef(moneyKept);
  moneyRef.current = moneyKept;
  const seenRef = useRef(jarSeenMoney);
  seenRef.current = jarSeenMoney;
  const reduceRef = useRef(reduceMotion);
  reduceRef.current = reduceMotion;
  const dropsRef = useRef(animateDrops);
  dropsRef.current = animateDrops;
  const focusedRef = useRef(false);
  const animatingRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Compare the pile against what the jar last saw settled. Only the
   * focused jar performs (and consumes) the drop; an unfocused jar
   * leaves the growth untouched so the screen the user actually opens
   * gets the payoff.
   */
  const check = useCallback(() => {
    if (!dropsRef.current) {
      // Passive jar: mirror the full pile, leave the growth marker
      // (and the drop payoff) to the jar that owns it.
      setSettled(coinsForMoney(moneyRef.current));
      return;
    }
    if (animatingRef.current || !focusedRef.current) return;
    const money = moneyRef.current;
    const total = coinsForMoney(money);
    const seen = coinsForMoney(seenRef.current);
    if (total <= seen) {
      setSettled(total);
      if (seenRef.current !== money) setJarSeenMoney(money);
      return;
    }
    const dropCount = reduceRef.current
      ? 0
      : Math.min(MAX_ANIMATED_DROPS, total - seen);
    if (dropCount === 0) {
      // Reduce-motion (or nothing new worth animating): final state.
      setSettled(total);
      setJarSeenMoney(money);
      return;
    }
    // New coins beyond the animated few are already resting in the pile.
    const base = total - dropCount;
    setSettled(base);
    animatingRef.current = true;
    const coins: FallingCoin[] = [];
    for (let s = base; s < total; s++) {
      coins.push({ slot: s, pos: new Animated.ValueXY({ x: 0, y: 0 }) });
    }
    setFalling(coins);
  }, [setJarSeenMoney]);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      check();
      return () => {
        focusedRef.current = false;
      };
    }, [check]),
  );

  // Money also grows while a screen sits open (the streak keeps
  // earning); re-check when a whole new coin's worth has accrued.
  useEffect(() => {
    check();
  }, [totalCoins, check]);

  // Run the drop once the falling coins are placed and the jar's pixel
  // size is measured (coin targets are computed in real pixels).
  const batchKey = falling.map((f) => f.slot).join(',');
  const startedBatchRef = useRef('');
  useEffect(() => {
    if (falling.length === 0 || !layout || startedBatchRef.current === batchKey) {
      return;
    }
    startedBatchRef.current = batchKey;
    const scale = layout.w / VB_W;
    falling.forEach((coin, idx) => {
      const slot = SLOTS[coin.slot];
      const d = slot.r * 2 * scale;
      const targetX = slot.x * scale - d / 2;
      const targetY = slot.y * scale - d / 2;
      coin.pos.setValue({ x: targetX, y: -d - 10 });
      const fall = Animated.timing(coin.pos, {
        toValue: { x: targetX, y: targetY },
        duration: 430,
        delay: idx * 190,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      });
      const bounceUp = Animated.timing(coin.pos, {
        toValue: { x: targetX, y: targetY - 4 * scale },
        duration: 110,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      });
      const settleDown = Animated.timing(coin.pos, {
        toValue: { x: targetX, y: targetY },
        duration: 140,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      });
      Animated.sequence([fall, bounceUp, settleDown]).start(({ finished }) => {
        if (!finished || !mountedRef.current) return;
        setSettled((prev) => Math.max(prev, coin.slot + 1));
        if (idx === falling.length - 1) {
          // The haptics vocabulary normally fires on the press, never
          // when an animation ends; the coin landing is the one
          // deliberate exception, because the landing IS the payoff
          // for the craving that was resisted earlier.
          haptics.success();
          animatingRef.current = false;
          setFalling([]);
          setJarSeenMoney(moneyRef.current);
        }
      });
    });
  }, [falling, layout, batchKey, setJarSeenMoney]);

  const width = (height * VB_W) / VB_H;

  return (
    <View
      style={{ width, height }}
      onLayout={(e) => {
        const { width: w, height: h } = e.nativeEvent.layout;
        setLayout((prev) =>
          prev && prev.w === w && prev.h === h ? prev : { w, h },
        );
      }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`}>
        {/* Jar back: a pale glass body behind the coins. */}
        <Path d={JAR_PATH} fill={colors.surface} />
        {/* The pile. */}
        {SLOTS.slice(0, settled).map((slot, i) => (
          <Circle
            key={i}
            cx={slot.x}
            cy={slot.y}
            r={slot.r}
            fill={colors.amberBright}
            stroke={colors.amber}
            strokeWidth={1.4}
          />
        ))}
        {SLOTS.slice(0, settled).map((slot, i) => (
          <Circle
            key={`ring-${i}`}
            cx={slot.x}
            cy={slot.y}
            r={slot.r * 0.6}
            fill="none"
            stroke={colors.amber}
            strokeWidth={1}
            opacity={0.55}
          />
        ))}
        {/* Glass front: a whisper of white + the pine outline + one
            quiet highlight line, so the coins read as inside the jar. */}
        <Path
          d={JAR_PATH}
          fill={colors.white}
          fillOpacity={0.14}
          stroke={colors.pine}
          strokeWidth={2.5}
        />
        <Path
          d="M 25 62 L 25 138"
          stroke={colors.white}
          strokeWidth={3}
          opacity={0.35}
          strokeLinecap="round"
        />
      </Svg>

      {/* Coins mid-drop, above the glass, falling through the mouth. */}
      {layout &&
        falling.map((coin) => {
          const slot = SLOTS[coin.slot];
          const d = slot.r * 2 * (layout.w / VB_W);
          return (
            <Animated.View
              key={coin.slot}
              pointerEvents="none"
              style={[
                styles.fallingCoin,
                {
                  width: d,
                  height: d,
                  borderRadius: d / 2,
                  transform: coin.pos.getTranslateTransform(),
                },
              ]}>
              <View
                style={[
                  styles.fallingCoinRing,
                  { borderRadius: d / 2 },
                ]}
              />
            </Animated.View>
          );
        })}

      {percentLabel ? (
        <View style={styles.percentWrap} pointerEvents="none">
          <Text
            maxFontSizeMultiplier={1.2}
            style={[styles.percent, { fontSize: Math.round(height * 0.17) }]}>
            {percentLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fallingCoin: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: colors.amberBright,
    borderWidth: 1.5,
    borderColor: colors.amber,
  },
  fallingCoinRing: {
    position: 'absolute',
    top: '24%',
    left: '24%',
    right: '24%',
    bottom: '24%',
    borderWidth: 1,
    borderColor: colors.amber,
    opacity: 0.7,
  },
  percentWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    fontFamily: fonts.displayBold,
    color: colors.pineDeep,
    textAlign: 'center',
  },
});
