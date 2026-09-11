import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { Chip } from './Chip';
import { findPressables } from '../test-utils/pressable';

test('Chip exposes selection as aria-pressed, not just color', async () => {
  let selected = false;
  const onPress = () => {
    selected = true;
  };

  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(<Chip label="Waterfalls & Gorges" selected={selected} onPress={onPress} testID="chip" />);
  });
  let [pressable] = findPressables(root.root);
  expect(pressable.props['aria-pressed']).toBe(false);

  act(() => {
    pressable.props.onPress();
  });
  expect(selected).toBe(true);

  await act(async () => {
    root = create(<Chip label="Waterfalls & Gorges" selected={selected} onPress={onPress} testID="chip" />);
  });
  [pressable] = findPressables(root.root);
  expect(pressable.props['aria-pressed']).toBe(true);
});

test('Chip always carries an accessible name equal to its visible label', async () => {
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(<Chip label="City Gems" selected={false} onPress={() => {}} testID="chip" />);
  });
  const [pressable] = findPressables(root.root);
  expect(pressable.props.accessibilityLabel).toBe('City Gems');
});
