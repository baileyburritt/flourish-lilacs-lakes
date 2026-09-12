import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { useAuth, useUser } from '@clerk/expo';

import { AccountBanner } from './AccountBanner';
import { deleteAccount, fetchMe } from '../lib/api';
import { LiveRegionProvider } from './LiveRegion';
import { findPressables } from '../test-utils/pressable';

// E8 (§12): Apple 5.1.1(v) requires account deletion to be reachable
// in-app. These tests cover the client half of E8's own done-when (the
// server e2e test in server/test/accountDeletion.test.ts covers the
// storage/DB half): the destructive action needs a real confirmation step
// before it calls the API, a cancel path that never calls it at all, and a
// failure that leaves the user signed in rather than silently doing nothing.

jest.mock('@clerk/expo', () => ({
  useAuth: jest.fn(),
  useUser: jest.fn(),
}));

jest.mock('../lib/api', () => ({
  fetchMe: jest.fn(),
  deleteAccount: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockUseUser = useUser as jest.Mock;
const mockFetchMe = fetchMe as jest.Mock;
const mockDeleteAccount = deleteAccount as jest.Mock;

let getToken: jest.Mock;
let signOut: jest.Mock;

beforeEach(() => {
  getToken = jest.fn().mockResolvedValue('test-session-token');
  signOut = jest.fn().mockResolvedValue(undefined);
  mockUseAuth.mockReturnValue({ getToken, signOut });
  mockUseUser.mockReturnValue({ user: { primaryEmailAddress: { emailAddress: 'visitor@example.com' } } });
  mockFetchMe.mockResolvedValue({ userId: 'user_1' });
  mockDeleteAccount.mockReset().mockResolvedValue(undefined);
});

function findByLabel(root: ReactTestRenderer, label: string) {
  return findPressables(root.root).find((p) => p.props.accessibilityLabel === label);
}

function findLiveText(root: ReactTestRenderer) {
  return root.root.findByProps({ 'aria-live': 'polite' }).props.children;
}

async function renderBanner(): Promise<ReactTestRenderer> {
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(
      <LiveRegionProvider>
        <AccountBanner />
      </LiveRegionProvider>,
    );
  });
  return root;
}

test('the destructive action is not reachable in one tap — it requires a confirmation step', async () => {
  const root = await renderBanner();

  expect(findByLabel(root, 'Delete permanently')).toBeUndefined();

  await act(async () => {
    findByLabel(root, 'Delete account')!.props.onPress();
  });

  expect(findByLabel(root, 'Delete permanently')).toBeDefined();
  expect(findByLabel(root, 'Cancel')).toBeDefined();
  expect(mockDeleteAccount).not.toHaveBeenCalled();
});

test('cancelling the confirmation never calls the delete API', async () => {
  const root = await renderBanner();

  await act(async () => {
    findByLabel(root, 'Delete account')!.props.onPress();
  });
  await act(async () => {
    findByLabel(root, 'Cancel')!.props.onPress();
  });

  expect(findByLabel(root, 'Delete permanently')).toBeUndefined();
  expect(findByLabel(root, 'Delete account')).toBeDefined();
  expect(mockDeleteAccount).not.toHaveBeenCalled();
});

test('confirming deletes the account, announces it, and signs the user out', async () => {
  const root = await renderBanner();

  await act(async () => {
    findByLabel(root, 'Delete account')!.props.onPress();
  });
  await act(async () => {
    await findByLabel(root, 'Delete permanently')!.props.onPress();
  });

  expect(mockDeleteAccount).toHaveBeenCalledWith('test-session-token');
  expect(signOut).toHaveBeenCalled();
  expect(findLiveText(root)).toBe('Account deleted.');
});

test('a failed deletion announces an error, does not sign out, and stays recoverable', async () => {
  mockDeleteAccount.mockRejectedValueOnce(new Error('DELETE /api/v1/account failed: 500'));
  const root = await renderBanner();

  await act(async () => {
    findByLabel(root, 'Delete account')!.props.onPress();
  });
  await act(async () => {
    await findByLabel(root, 'Delete permanently')!.props.onPress();
  });

  expect(signOut).not.toHaveBeenCalled();
  expect(findLiveText(root)).toBe('Could not delete your account. Please try again.');
  // Back to idle, not stuck mid-confirmation or silently doing nothing.
  expect(findByLabel(root, 'Delete account')).toBeDefined();
  expect(findByLabel(root, 'Delete permanently')).toBeUndefined();
});
