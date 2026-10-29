import { useEffect, useRef, useState } from 'react';

import { formatMoneyExact } from '../lib/calc';
import { useReduceMotion } from '../lib/useReduceMotion';
import { colors } from '../theme';
import { Display } from './ui';

/**
 * The kept-money figure, counted up. On mount/focus the number eases
 * from whatever it last showed to the true current value over ~600 ms
 * with an ease-out curve. It never overshoots: the animation is a
 * monotone interpolation that lands exactly on the real number, because
 * a money counter that invents cents is a trust bug. With the OS
 * reduce-motion setting on, the value simply appears.
 */
export default function CountUpMoney({
  value,
  focusTick = 0,
}: {
  value: number;
  /** Increment to replay the count-up (e.g. when the tab regains focus). */
  focusTick?: number;
}) {
  const reduceMotion = useReduceMotion();
  const [displayed, setDisplayed] = useState(value);
  const displayedRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = displayedRef.current;
    const to = value;
    if (reduceMotion || from === to) {
      displayedRef.current = to;
      setDisplayed(to);
      return;
    }
    const duration = 600;
    const start = Date.now();
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      displayedRef.current = current;
      setDisplayed(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        displayedRef.current = to;
        setDisplayed(to);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // focusTick intentionally replays from the last shown value.
  }, [value, focusTick, reduceMotion]);

  return (
    <Display size={44} color={colors.pineDeep}>
      {formatMoneyExact(displayed)}
    </Display>
  );
}
