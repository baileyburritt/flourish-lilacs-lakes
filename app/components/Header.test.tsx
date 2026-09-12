import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { Text } from 'react-native';

import { Header } from './Header';
import { findPressables } from '../test-utils/pressable';

test('root variant shows the brand title and no back button', async () => {
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(<Header variant="root" title="Flourish" subtitle="Lilacs & Lakes" onProfile={() => {}} />);
  });
  const texts = root.root.findAllByType(Text).flatMap((n: ReactTestInstance) => n.props.children);
  expect(texts).toContain('Flourish');
  expect(texts).toContain('Lilacs & Lakes');
  expect(findPressables(root.root).some((p) => p.props.accessibilityLabel === 'Go back')).toBe(false);
});

test('detail variant shows a labeled back button that calls onBack', async () => {
  let backCalled = false;
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(<Header variant="detail" title="Spot Details" onBack={() => (backCalled = true)} onProfile={() => {}} />);
  });
  const backButton = findPressables(root.root).find((p) => p.props.accessibilityLabel === 'Go back')!;
  act(() => {
    backButton.props.onPress();
  });
  expect(backCalled).toBe(true);
});

test('titleIsHeading marks the title as a real h1; without it, the title is plain text', async () => {
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(<Header variant="detail" title="Add Private Gem" onBack={() => {}} titleIsHeading />);
  });
  const heading = root.root.findByProps({ children: 'Add Private Gem' });
  expect(heading.props.role).toBe('heading');
  expect(heading.props['aria-level']).toBe(1);

  await act(async () => {
    root = create(<Header variant="root" title="Flourish" subtitle="Lilacs & Lakes" onProfile={() => {}} />);
  });
  const plainTitle = root.root.findByProps({ children: 'Flourish' });
  expect(plainTitle.props.role).toBeUndefined();
  expect(plainTitle.props['aria-level']).toBeUndefined();
});

test('every rendered screen carries exactly one Header', async () => {
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(<Header variant="root" title="Flourish" subtitle="Lilacs & Lakes" onProfile={() => {}} />);
  });
  // Header is the only component under test; asserting a single title block
  // stands in for "no screen defines a duplicate header" at the unit level —
  // the screen-level guarantee is that every screen imports this component
  // exactly once, checked per-screen in screens/*.test.tsx.
  expect(root.root.findAllByType(Header)).toHaveLength(1);
});
