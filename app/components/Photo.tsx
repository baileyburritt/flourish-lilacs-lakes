import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../theme/tokens';
import { rad, textStyle } from '../theme/scale';

// E10 (Stage E) replaces every lh3.googleusercontent.com reference with an
// owned, CDN-served image; until real photography lands (procured by the
// human, never sourced by an agent — see CLAUDE.md), this renders a labeled
// placeholder instead of a live third-party image request. `alt` carries the
// same real, descriptive text a finished <Image alt=...> will use, so
// meaningful photography is never invisible to screen readers even as a
// placeholder — D1's fix (real alt text) is built in from the start here,
// not bolted on later.
type Props = {
  alt: string;
  style?: StyleProp<ViewStyle>;
  caption?: string;
};

export function Photo({ alt, style, caption }: Props) {
  return (
    <View role="img" aria-label={alt} style={[styles.frame, style]}>
      {caption ? (
        <Text style={styles.caption} numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: rad.DEFAULT,
    backgroundColor: colors['surface-container-high'],
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    padding: 6,
  },
  caption: {
    ...textStyle('label-sm'),
    color: colors['on-surface-variant'],
  },
});
