import type { ReactElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { BottomNav, Header } from '../components';
import { findPressables } from '../test-utils/pressable';
import {
  DestinationDetailScreen,
  ExploreScreen,
  MusicScreen,
  MySpotsScreen,
  NewPrivateGemScreen,
  TripPlannerScreen,
} from './index';

const navigate = () => {};

// C4's done-when, checked directly: every screen renders from the shared
// components (exactly one Header, exactly one BottomNav — never a
// screen-defined duplicate), and each reflects the correct active tab.
const cases: Array<[string, ReactElement, string | null]> = [
  ['ExploreScreen', <ExploreScreen navigate={navigate} bookmarks={{}} onToggleBookmark={() => {}} />, 'Explore'],
  ['MusicScreen', <MusicScreen navigate={navigate} />, 'Music & Live'],
  ['TripPlannerScreen', <TripPlannerScreen navigate={navigate} />, 'Itinerary'],
  ['MySpotsScreen', <MySpotsScreen navigate={navigate} savedTitles={[]} />, 'My Spots'],
  ['DestinationDetailScreen', <DestinationDetailScreen navigate={navigate} />, null],
  ['NewPrivateGemScreen', <NewPrivateGemScreen navigate={navigate} />, null],
];

test.each(cases)('%s renders exactly one Header and one BottomNav with the right active tab', async (_name, element, activeLabel) => {
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(element);
  });

  expect(root.root.findAllByType(Header)).toHaveLength(1);
  expect(root.root.findAllByType(BottomNav)).toHaveLength(1);

  const tabs = findPressables(root.root).filter((p) => p.props.role === 'tab');
  const selected = tabs.filter((t) => t.props['aria-selected']);
  if (activeLabel === null) {
    expect(selected).toHaveLength(0);
  } else {
    expect(selected).toHaveLength(1);
    expect(selected[0].props.accessibilityLabel).toBe(activeLabel);
  }
});
