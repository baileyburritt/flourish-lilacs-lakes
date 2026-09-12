import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth, useUser } from '@clerk/expo';

import { fetchMe } from '../lib/api';
import { colors } from '../theme/tokens';
import { rad, space, textStyle } from '../theme/scale';
import { useAnnounce } from './LiveRegion';

type ServerCheck = 'checking' | 'verified' | 'failed';

// E2's done-when is "the API receives a verified user id on every
// authenticated request" — not just that the client and server halves each
// work in isolation. This banner is the proof: it calls the real /api/v1/me
// route with the Clerk session token and shows whether the server's
// verified userId actually came back, rather than trusting the client SDK
// alone. There's no Stitch mockup for this — it's plumbing, not a design
// pass — so it's deliberately a thin top bar rather than a new screen.
export function AccountBanner() {
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const [serverCheck, setServerCheck] = useState<ServerCheck>('checking');
  const announce = useAnnounce();

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      try {
        const token = await getToken();
        if (!token) throw new Error('No session token available.');
        await fetchMe(token);
        if (!cancelled) setServerCheck('verified');
      } catch {
        if (!cancelled) setServerCheck('failed');
      }
    }
    void verify();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  const identity = user?.primaryEmailAddress?.emailAddress ?? user?.fullName ?? 'your account';

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        Signed in as {identity}
        {serverCheck === 'checking' ? ' · checking server session…' : null}
        {serverCheck === 'verified' ? ' · server session verified' : null}
        {serverCheck === 'failed' ? ' · server could not verify this session' : null}
      </Text>
      <Pressable
        onPress={() => {
          void signOut();
          announce('Signed out.');
        }}
        role="button"
        style={styles.signOutButton}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space['space-sm'],
    paddingHorizontal: space['margin-mobile'],
    paddingVertical: space['space-xs'],
    backgroundColor: colors['surface-container-low'],
  },
  text: { ...textStyle('body-sm'), color: colors['on-surface-variant'], flexShrink: 1 },
  signOutButton: {
    paddingHorizontal: space['space-sm'],
    paddingVertical: space['space-xxs'],
    borderRadius: rad.full,
    backgroundColor: colors['surface-container'],
  },
  signOutText: { ...textStyle('label-sm'), color: colors['primary'], fontWeight: '700' },
});
