import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';

import { useReduceMotion } from '../lib/useReduceMotion';

/**
 * The mist clearing. A soft band of off-white mist sits at the top of
 * onboarding and thins as the user advances, fully clear by the plan
 * reveal. Three plain SVG ellipses, no glow, no gradients, no orbs.
 * `progress` runs 0 (thickest) to 1 (clear). Reduce-motion renders the
 * settled state for the current step with no animation.
 */
export default function MistVeil({ progress }: { progress: number }) {
  const reduceMotion = useReduceMotion();
  const opacity = useRef(new Animated.Value(1 - progress)).current;

  useEffect(() => {
    const target = 1 - progress;
    if (reduceMotion) {
      opacity.setValue(target);
      return;
    }
    const anim = Animated.timing(opacity, {
      toValue: target,
      duration: 650,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [progress, reduceMotion, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { opacity }]}>
      <Svg
        width="100%"
        height="150"
        viewBox="0 0 400 150"
        preserveAspectRatio="none">
        <Ellipse cx="90" cy="18" rx="230" ry="52" fill="#FFFFFF" opacity={0.55} />
        <Ellipse cx="330" cy="42" rx="240" ry="58" fill="#FFFFFF" opacity={0.45} />
        <Ellipse cx="180" cy="74" rx="260" ry="50" fill="#FFFFFF" opacity={0.35} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 5,
  },
});
