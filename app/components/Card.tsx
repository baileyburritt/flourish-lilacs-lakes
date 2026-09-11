import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../theme/tokens';
import { rad, space } from '../theme/scale';

// A plain styled surface, deliberately not itself pressable: every card in
// the source screens carries its own primary-action control (a "Details" /
// "Tickets" link, a bookmark button) alongside its content, and wrapping the
// whole card in one more Pressable would nest interactive controls inside
// each other — invalid semantics assistive tech has to guess its way through.
// Screens compose their own actions inside Card instead.
type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
};

export function Card({ children, style, padded = true }: Props) {
  return <View style={[styles.card, padded ? styles.padded : null, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: rad.md,
    backgroundColor: colors['surface-container-lowest'],
    overflow: 'hidden',
  },
  padded: {
    padding: space['space-md'],
    gap: space['space-xs'],
  },
});
