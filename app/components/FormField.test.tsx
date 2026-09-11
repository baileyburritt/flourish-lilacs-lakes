import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { Text, TextInput } from 'react-native';

import { FormField } from './FormField';

test('FormField renders a real visible label, not just a placeholder', async () => {
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(
      <FormField label="Spot or Business Name" value="" onChangeText={() => {}} placeholder="e.g. Hidden gorge overlook" />
    );
  });

  const texts = root.root.findAllByType(Text).map((node: ReactTestInstance) => node.props.children);
  expect(texts.flat()).toContain('Spot or Business Name');
});

test("FormField derives the input's accessible name from the label, not the placeholder", async () => {
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(
      <FormField label="Personal Reminder & Notes" value="" onChangeText={() => {}} placeholder="e.g. Cash only after 3 PM" required />
    );
  });

  const input = root.root.findByType(TextInput);
  expect(input.props.accessibilityLabel).toBe('Personal Reminder & Notes, required');
  expect(input.props.placeholder).toBe('e.g. Cash only after 3 PM');
});
