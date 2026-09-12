import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useSSO } from '@clerk/expo';

import { useAnnounce } from '../components';
import { colors } from '../theme/tokens';
import { rad, space, textStyle } from '../theme/scale';

// Required once, outside any component, so a redirect back from the OAuth
// browser session actually resolves the pending promise instead of hanging.
WebBrowser.maybeCompleteAuthSession();

function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

type Strategy = 'oauth_google';

// E2 (§03): managed auth, bought not built. There's no Stitch mockup for
// this screen — none of the five original screens designed one — so this is
// plumbing (wired to real Clerk OAuth) rather than a polished design pass.
// Google only for now — Apple sign-in was cut as not important.
export function SignInScreen() {
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();
  const [pending, setPending] = useState<Strategy | null>(null);
  const announce = useAnnounce();

  const signInWith = useCallback(
    async (strategy: Strategy) => {
      setPending(strategy);
      try {
        const { createdSessionId, setActive } = await startSSOFlow({
          strategy,
          redirectUrl: Linking.createURL('/sso-callback'),
        });
        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
        } else {
          announce('Sign-in did not complete. Please try again.');
        }
      } catch {
        announce('Sign-in failed. Please try again.');
      } finally {
        setPending(null);
      }
    },
    [startSSOFlow, announce],
  );

  return (
    <View style={styles.screen}>
      <Text style={styles.title} role="heading" aria-level={1}>
        Flourish: Lilacs &amp; Lakes
      </Text>
      <Text style={styles.subtitle}>Sign in to save private gems and plan trips across the Finger Lakes.</Text>
      <Pressable
        onPress={() => signInWith('oauth_google')}
        role="button"
        disabled={pending !== null}
        style={styles.button}
      >
        <Text style={styles.buttonText}>{pending === 'oauth_google' ? 'Signing in…' : 'Continue with Google'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors['surface'],
    alignItems: 'center',
    justifyContent: 'center',
    padding: space['margin-mobile'],
    gap: space['space-md'],
  },
  title: { ...textStyle('headline-sm'), color: colors['primary'], textAlign: 'center' },
  subtitle: { ...textStyle('body-md'), color: colors['on-surface-variant'], textAlign: 'center' },
  button: {
    width: '100%',
    maxWidth: 320,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rad.full,
    backgroundColor: colors['primary'],
  },
  buttonText: { ...textStyle('label-lg'), color: colors['on-primary'], fontWeight: '700' },
});
