import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { BottomNav, TAB_ROUTES } from './BottomNav';
import { findPressables } from '../test-utils/pressable';

// C4's fix for the Music screen bug: previously no tab was ever marked
// active there. This asserts BottomNav marks exactly the active route
// selected, and — for a detail screen with no matching tab — none at all,
// rather than defaulting to the first tab.
test('marks exactly the active tab as selected', async () => {
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(<BottomNav active="music" onNavigate={() => {}} />);
  });
  const tabs = findPressables(root.root);

  expect(tabs).toHaveLength(TAB_ROUTES.length);
  const selectedLabels = tabs.filter((t) => t.props['aria-selected']).map((t) => t.props.accessibilityLabel);
  expect(selectedLabels).toEqual(['Music & Live']);
});

test('reflects no active tab on a detail screen instead of guessing one', async () => {
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(<BottomNav active={null} onNavigate={() => {}} />);
  });
  const tabs = findPressables(root.root);
  const selected = tabs.filter((t) => t.props['aria-selected']);
  expect(selected).toHaveLength(0);
});

test('tapping a tab calls onNavigate with its route key', async () => {
  const calls: string[] = [];
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(<BottomNav active="explore" onNavigate={(route) => calls.push(route)} />);
  });
  const itineraryTab = findPressables(root.root).find((t) => t.props.accessibilityLabel === 'Itinerary')!;
  act(() => {
    itineraryTab.props.onPress();
  });
  expect(calls).toEqual(['itinerary']);
});
