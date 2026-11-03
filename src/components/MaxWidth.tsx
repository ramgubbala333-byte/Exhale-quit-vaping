import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Responsive content column for tab screens: caps the content width at
 * ~600dp and centers it, so layouts do not stretch edge-to-edge on
 * tablets and stay readable in landscape and on foldable widths. On
 * phone widths (including narrow 320dp folds) it is a pass-through.
 * A full two-pane tablet layout is deliberately out of scope for now.
 */
export default function MaxWidth({ children }: { children: ReactNode }) {
  return <View style={styles.wrap}>{children}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
});
