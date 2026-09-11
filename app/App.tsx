import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';

import {
  DestinationDetailScreen,
  ExploreScreen,
  MusicScreen,
  MySpotsScreen,
  NewPrivateGemScreen,
  SPOT_TITLES,
  TripPlannerScreen,
} from './screens';
import type { Screen } from './navigation/types';

// C4: the five screens now render from one shared component library
// (Header, BottomNav, Card, Chip, FormField) instead of five independent
// Tailwind files. There is no router yet — this is the one state machine
// that stands in for it until a real navigation library earns its place.
export default function App() {
  const [screen, setScreen] = useState<Screen>('explore');
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});

  function toggleBookmark(id: string) {
    setBookmarks((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const savedTitles = Object.keys(bookmarks)
    .filter((id) => bookmarks[id])
    .map((id) => SPOT_TITLES[id])
    .filter(Boolean);

  return (
    <>
      {screen === 'explore' ? (
        <ExploreScreen navigate={setScreen} bookmarks={bookmarks} onToggleBookmark={toggleBookmark} />
      ) : null}
      {screen === 'music' ? <MusicScreen navigate={setScreen} /> : null}
      {screen === 'itinerary' ? <TripPlannerScreen navigate={setScreen} /> : null}
      {screen === 'my-spots' ? <MySpotsScreen navigate={setScreen} savedTitles={savedTitles} /> : null}
      {screen === 'destination-detail' ? <DestinationDetailScreen navigate={setScreen} /> : null}
      {screen === 'new-private-gem' ? <NewPrivateGemScreen navigate={setScreen} /> : null}
      <StatusBar style="auto" />
    </>
  );
}
