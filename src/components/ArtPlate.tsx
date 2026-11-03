import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

import { radii, spacing } from '../theme';

/**
 * A watercolor illustration shown as a whole plate inside a rounded
 * card frame: resizeMode "contain" on a white card, so the painting
 * is NEVER cropped (Ram hit a cover-cropping bug in an earlier round;
 * contain is the rule everywhere art appears now). Frame aspect
 * follows each painting's real aspect (1:2 or 2:3) so the plate fills
 * its card edge-to-edge with the whole image visible.
 */
export default function ArtPlate({
  source,
  aspect,
  widthPct = 52,
  label,
  style,
}: {
  source: ImageSourcePropType;
  /** Real width/height of the painting: 0.5 for 1:2, 0.667 for 2:3. */
  aspect: number;
  /** Frame width as a percent of the content column. */
  widthPct?: number;
  label: string;
  style?: object;
}) {
  return (
    <View
      style={[
        styles.frame,
        { width: `${widthPct}%`, aspectRatio: aspect },
        style,
      ]}>
      <Image
        source={source}
        style={styles.img}
        resizeMode="contain"
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginVertical: spacing.sm,
  },
  img: { width: '100%', height: '100%' },
});
