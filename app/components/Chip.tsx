import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/tokens';
import { rad, space, textStyle } from '../theme/scale';

// D5 (Stage D) exists because the source screens conveyed chip selection by
// color alone. Chip owns `aria-pressed` itself so every consumer — filter
// bars, category pickers, region pills — gets a real selected state in the
// accessibility tree for free, not just a background-color change. A toggle
// button rather than role="tab": these chips aren't a single tablist widget
// (several independent chip groups can appear on one screen), and
// role="tab" would need every group wrapped in its own role="tablist" to
// stay valid — aria-pressed carries the same signal without that.
type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
};

export function Chip({ label, selected, onPress, testID }: Props) {
  return (
    <Pressable
      onPress={onPress}
      role="button"
      aria-pressed={selected}
      accessibilityLabel={label}
      style={[styles.chip, selected ? styles.chipSelected : null]}
      testID={testID}
    >
      <Text style={[styles.label, selected ? styles.labelSelected : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    paddingHorizontal: space['space-md'],
    paddingVertical: space['space-xxs'],
    borderRadius: rad.full,
    backgroundColor: colors['surface-container'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors['secondary'],
  },
  label: {
    ...textStyle('label-md'),
    color: colors['on-surface-variant'],
  },
  labelSelected: {
    color: colors['on-secondary'],
  },
});
