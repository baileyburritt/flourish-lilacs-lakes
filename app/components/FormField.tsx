import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { colors } from '../theme/tokens';
import { rad, space, textStyle } from '../theme/scale';

// D6 (Stage D) exists specifically because screens shipped with placeholder
// text standing in as the only label. FormField makes that mistake
// unavailable: `label` always renders as real, visible text, and the input's
// accessibilityLabel is always derived from it — placeholder is decoration.
type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: KeyboardTypeOptions;
  testID?: string;
};

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  helperText,
  required,
  multiline,
  numberOfLines,
  keyboardType,
  testID,
}: Props) {
  const accessibleLabel = required ? `${label}, required` : label;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors['outline']}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        accessibilityLabel={accessibleLabel}
        style={[styles.input, multiline ? styles.multiline : null]}
        testID={testID}
      />
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: space['space-xxs'],
  },
  label: {
    ...textStyle('label-lg'),
    color: colors['primary'],
  },
  required: {
    color: colors['error'],
  },
  input: {
    minHeight: 44,
    paddingHorizontal: space['space-md'],
    paddingVertical: space['space-xs'],
    borderRadius: rad.md,
    backgroundColor: colors['surface-container-low'],
    color: colors['on-surface'],
    ...textStyle('body-md'),
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  helper: {
    ...textStyle('body-sm'),
    color: colors['on-surface-variant'],
  },
});
