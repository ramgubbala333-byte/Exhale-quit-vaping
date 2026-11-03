import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useReduceMotion } from '../lib/useReduceMotion';
import { colors, gradients } from '../theme';

/**
 * The status blob: PulseBuddy's signature device — a soft glossy
 * amorphous shape whose pastel gradient shifts with state. Calm
 * (pale blue-white into lavender) is the resting state of a quit
 * going well; warm (peach into soft yellow) is the needs-attention
 * state used in craving/SOS contexts. Two overlapping organic SVG
 * paths give the amorphous edge; a white gloss streak across the
 * upper left sells the soft-gloss finish. Sizes are viewBox-relative
 * so the blob scales cleanly from hero to SOS.
 */
export default function StateBlob({
  tone = 'calm',
  size = 168,
}: {
  tone?: 'calm' | 'warm';
  size?: number;
}) {
  const reduceMotion = useReduceMotion();
  const pair = tone === 'warm' ? gradients.warm : gradients.calm;
  // viewBox is 200x200; the blob path is drawn once and scaled.
  const w = size;
  const h = size;

  return (
    <View
      style={{ width: w, height: h }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Svg width={w} height={h} viewBox="0 0 200 200">
        {/* Back mass, slightly rotated feel via offset path. */}
        <Path
          d="M100 14 C146 10 184 44 186 88 C188 130 160 152 128 172 C96 192 52 186 30 156 C8 126 14 76 38 46 C58 22 70 16 100 14 Z"
          fill={pair[1]}
          opacity={0.65}
        />
        {/* Front mass. */}
        <Path
          d="M102 26 C140 24 172 52 174 92 C176 128 148 158 114 172 C80 186 40 168 28 134 C16 100 30 58 56 40 C72 29 84 27 102 26 Z"
          fill={pair[0]}
          opacity={0.9}
        />
      </Svg>
      {/* Gloss: a soft white sheen laid over the upper-left mass. */}
      <LinearGradient
        colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.75, y: 0.7 }}
        style={[
          styles.gloss,
          {
            width: w * 0.72,
            height: h * 0.72,
            borderRadius: w * 0.36,
            left: w * 0.1,
            top: h * 0.06,
            opacity: reduceMotion ? 0.8 : 0.9,
          },
        ]}
        pointerEvents="none"
      />
      {/* Inner core tint so the centre reads as one calm pool. */}
      <View
        pointerEvents="none"
        style={[
          styles.core,
          {
            width: w * 0.44,
            height: w * 0.44,
            borderRadius: w * 0.22,
            left: w * 0.3,
            top: h * 0.3,
            backgroundColor:
              tone === 'warm' ? colors.amberSoft : colors.calmSoft,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  gloss: { position: 'absolute' },
  core: { position: 'absolute', opacity: 0.55 },
});
