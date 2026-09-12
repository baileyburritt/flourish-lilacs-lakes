import { useState } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';

import {
  DestinationDetailScreen,
  ExploreScreen,
  MusicScreen,
  MySpotsScreen,
  NewPrivateGemScreen,
  SignInScreen,
  SPOT_TITLES,
  TripPlannerScreen,
} from './screens';
import { AccountBanner, FocusRingStyle, LiveRegionProvider } from './components';
import type { Screen } from './navigation/types';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY — set it in app/.env.local (see .env.example).');
}

// E2 (§03): managed auth wrapping Google sign-in. ClerkProvider is the
// outermost wrapper so every screen (and MainApp below) can use Clerk's
// hooks; LiveRegionProvider stays inside it so SignInScreen's error
// announcements and MainApp's existing D3 status announcements share the
// same one region.
export default function App() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <LiveRegionProvider>
        <FocusRingStyle />
        <AuthGate />
        <StatusBar style="auto" />
      </LiveRegionProvider>
    </ClerkProvider>
  );
}

// e2e (Playwright/axe) tests predate E2 and exercise the five screens'
// WCAG conformance directly — that's still their job, not re-proving Clerk
// OAuth against a real Google account in CI. EXPO_PUBLIC_E2E_BYPASS_AUTH
// skips the gate for that suite; it's set solely in playwright.config.ts's own
// build command, is a client-side UI shortcut with no server trust
// implication (E5's endpoints verify a real Clerk token independently, so
// bypassing this screen grants no data access), and must never be set when
// building for a real environment. The one spec that tests the gate itself
// (e2e/sign-in-gate.spec.ts) narrows it back off per-request via a query
// param, rather than needing a whole second build+server: the param only
// ever does something when the build-time flag is already on, so it can't
// widen the bypass, only cancel it for one navigation.
const buildTimeE2EBypass = process.env.EXPO_PUBLIC_E2E_BYPASS_AUTH === 'true';

function isE2EBypassDisabledForThisRequest() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).has('e2e_no_bypass');
  } catch {
    return false;
  }
}

function AuthGate() {
  const { isLoaded, isSignedIn } = useAuth();
  if (buildTimeE2EBypass && !isE2EBypassDisabledForThisRequest()) return <MainApp />;
  if (!isLoaded) return null;
  if (!isSignedIn) return <SignInScreen />;
  return (
    <>
      <AccountBanner />
      <MainApp />
    </>
  );
}

// C4: the five screens now render from one shared component library
// (Header, BottomNav, Card, Chip, FormField) instead of five independent
// Tailwind files. There is no router yet — this is the one state machine
// that stands in for it until a real navigation library earns its place.
function MainApp() {
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
    </>
  );
}
