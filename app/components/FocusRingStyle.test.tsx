import { Platform } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { FocusRingStyle } from './FocusRingStyle';

const nativeOS = Platform.OS;
afterEach(() => {
  Platform.OS = nativeOS;
});

test('renders nothing on native platforms', async () => {
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(<FocusRingStyle />);
  });
  expect(root.toJSON()).toBeNull();
});

test('renders a real :focus-visible rule on web, keyed to how every interactive element already identifies itself', async () => {
  Platform.OS = 'web';

  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(<FocusRingStyle />);
  });
  const tree = root.toJSON() as unknown as { type: string; children: string[] };
  expect(tree.type).toBe('style');
  const css = tree.children.join('');
  expect(css).toContain(':focus-visible');
  expect(css).toContain('[role="button"]');
  expect(css).toContain('[role="tab"]');
  expect(css).toContain('input');
  expect(css).toContain('textarea');
});
