import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth, useUser } from '@clerk/expo';

import { deleteAccount, fetchMe } from '../lib/api';
import { colors } from '../theme/tokens';
import { rad, space, textStyle } from '../theme/scale';
import { useAnnounce } from './LiveRegion';

type ServerCheck = 'checking' | 'verified' | 'failed';
type DeleteState = 'idle' | 'confirming' | 'deleting';

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
  const [deleteState, setDeleteState] = useState<DeleteState>('idle');
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

  // E8 (§12): Apple 5.1.1(v) requires this to be reachable in-app, not just
  // an admin/support request. A two-step in-UI confirmation (rather than
  // Alert.alert) is used because react-native-web doesn't reliably render a
  // multi-button native confirm dialog, and this way both the prompt and its
  // buttons are ordinary visible, labeled controls that D2's focus ring and
  // D4's accessible-name rules already cover without any extra work.
  async function handleConfirmDelete() {
    setDeleteState('deleting');
    try {
      const token = await getToken();
      if (!token) throw new Error('No session token available.');
      await deleteAccount(token);
      announce('Account deleted.');
      await signOut();
    } catch {
      setDeleteState('idle');
      announce('Could not delete your account. Please try again.');
    }
  }

  return (
    <View>
      <View style={styles.banner}>
        <Text style={styles.text}>
          Signed in as {identity}
          {serverCheck === 'checking' ? ' · checking server session…' : null}
          {serverCheck === 'verified' ? ' · server session verified' : null}
          {serverCheck === 'failed' ? ' · server could not verify this session' : null}
        </Text>
        <View style={styles.actions}>
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
          {deleteState === 'idle' ? (
            <Pressable
              onPress={() => setDeleteState('confirming')}
              role="button"
              accessibilityLabel="Delete account"
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>Delete account</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {deleteState !== 'idle' ? (
        <View style={styles.confirmRow}>
          <Text style={styles.confirmText}>
            {deleteState === 'deleting'
              ? 'Deleting your account and all your data…'
              : "Permanently delete your account and all your data? This can't be undone."}
          </Text>
          <View style={styles.actions}>
            <Pressable
              onPress={() => setDeleteState('idle')}
              role="button"
              accessibilityLabel="Cancel"
              disabled={deleteState === 'deleting'}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => void handleConfirmDelete()}
              role="button"
              accessibilityLabel="Delete permanently"
              disabled={deleteState === 'deleting'}
              style={styles.confirmDeleteButton}
            >
              <Text style={styles.confirmDeleteText}>
                {deleteState === 'deleting' ? 'Deleting…' : 'Delete permanently'}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space['space-xs'],
  },
  signOutButton: {
    paddingHorizontal: space['space-sm'],
    paddingVertical: space['space-xxs'],
    borderRadius: rad.full,
    backgroundColor: colors['surface-container'],
  },
  signOutText: { ...textStyle('label-sm'), color: colors['primary'], fontWeight: '700' },
  deleteButton: {
    paddingHorizontal: space['space-sm'],
    paddingVertical: space['space-xxs'],
    borderRadius: rad.full,
    backgroundColor: colors['error-container'],
  },
  deleteText: { ...textStyle('label-sm'), color: colors['on-error-container'], fontWeight: '700' },
  confirmRow: {
    gap: space['space-sm'],
    paddingHorizontal: space['margin-mobile'],
    paddingVertical: space['space-sm'],
    backgroundColor: colors['error-container'],
  },
  confirmText: { ...textStyle('body-sm'), color: colors['on-error-container'] },
  cancelButton: {
    paddingHorizontal: space['space-sm'],
    paddingVertical: space['space-xxs'],
    borderRadius: rad.full,
    backgroundColor: colors['surface-container-lowest'],
  },
  cancelText: { ...textStyle('label-sm'), color: colors['on-surface-variant'], fontWeight: '700' },
  confirmDeleteButton: {
    paddingHorizontal: space['space-sm'],
    paddingVertical: space['space-xxs'],
    borderRadius: rad.full,
    backgroundColor: colors['error'],
  },
  confirmDeleteText: { ...textStyle('label-sm'), color: colors['on-error'], fontWeight: '700' },
});
