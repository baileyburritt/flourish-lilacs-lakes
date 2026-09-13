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

// E11 (§04, §16): expo-audio wraps native recording/playback APIs this test
// environment doesn't have — the real module hung the whole suite rather
// than failing loudly. NewPrivateGemScreen.test.tsx exercises the actual
// recording/playback behavior against a more detailed version of this same
// mock; this file only needs NewPrivateGemScreen to render without crashing.
jest.mock('expo-audio', () => ({
  RecordingPresets: { HIGH_QUALITY: {}, LOW_QUALITY: {} },
  requestRecordingPermissionsAsync: jest.fn().mockResolvedValue({ granted: false, status: 'denied' }),
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  useAudioRecorder: jest.fn(() => ({ prepareToRecordAsync: jest.fn(), record: jest.fn(), stop: jest.fn(), uri: null })),
  useAudioPlayer: jest.fn(() => ({ play: jest.fn(), seekTo: jest.fn() })),
}));

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
