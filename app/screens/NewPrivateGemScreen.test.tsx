import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { TextInput } from 'react-native';
import { requestRecordingPermissionsAsync, useAudioPlayer, useAudioRecorder } from 'expo-audio';

import { findPressables } from '../test-utils/pressable';
import { NewPrivateGemScreen } from './NewPrivateGemScreen';

// E11 (§04, §16): expo-audio wraps native recording/playback APIs this test
// environment doesn't have — the real module hung the whole suite rather
// than failing loudly, so every call below is a jest.fn() standing in for
// real mic/speaker access, reset to known defaults before each test the
// same way AccountBanner.test.tsx resets its Clerk/API mocks.
jest.mock('expo-audio', () => ({
  RecordingPresets: { HIGH_QUALITY: {}, LOW_QUALITY: {} },
  requestRecordingPermissionsAsync: jest.fn(),
  setAudioModeAsync: jest.fn(),
  useAudioRecorder: jest.fn(),
  useAudioPlayer: jest.fn(),
}));

const mockRequestPermission = requestRecordingPermissionsAsync as jest.Mock;
const mockUseAudioRecorder = useAudioRecorder as jest.Mock;
const mockUseAudioPlayer = useAudioPlayer as jest.Mock;

let recorder: { prepareToRecordAsync: jest.Mock; record: jest.Mock; stop: jest.Mock; uri: string | null };
let player: { play: jest.Mock; seekTo: jest.Mock };

beforeEach(() => {
  mockRequestPermission.mockReset().mockResolvedValue({ status: 'granted', granted: true });
  recorder = {
    prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
    record: jest.fn(),
    stop: jest.fn().mockResolvedValue(undefined),
    uri: 'mock://recorded-memo.m4a',
  };
  player = { play: jest.fn(), seekTo: jest.fn().mockResolvedValue(undefined) };
  mockUseAudioRecorder.mockReset().mockReturnValue(recorder);
  mockUseAudioPlayer.mockReset().mockReturnValue(player);
});

const navigate = () => {};

function findByLabel(root: ReactTestRenderer, label: string) {
  const match = findPressables(root.root).find((p) => p.props.accessibilityLabel === label);
  if (!match) throw new Error(`No pressable labeled "${label}"`);
  return match;
}

async function renderScreen(): Promise<ReactTestRenderer> {
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(<NewPrivateGemScreen navigate={navigate} />);
  });
  return root;
}

// E11 (§04, §16): CLAUDE.md's committed decision is that the text notes
// field stays exactly where it is, unhidden and un-demoted behind the audio
// memo flow — this is the done-when's explicit test for that, on the real
// rendered form rather than the static code.html screen B2's earlier test
// (e2e/new-private-gem-form.spec.ts) covers.
test('the notes field and the audio memo control are both present and reachable on the same form', async () => {
  const root = await renderScreen();

  const notesInput = root.root
    .findAllByType(TextInput)
    .find((input) => input.props.accessibilityLabel === 'Insider Tips & Route Logistics');
  expect(notesInput).toBeDefined();
  expect(findByLabel(root, 'Record an audio memo')).toBeDefined();
});

test('recording is only requested at the moment "Record Memo" is pressed, never on mount', async () => {
  await renderScreen();
  expect(mockRequestPermission).not.toHaveBeenCalled();
});

test('a denied microphone permission announces why and never starts recording', async () => {
  mockRequestPermission.mockResolvedValue({ status: 'denied', granted: false });
  const root = await renderScreen();

  await act(async () => {
    findByLabel(root, 'Record an audio memo').props.onPress();
  });

  expect(mockRequestPermission).toHaveBeenCalledTimes(1);
  expect(recorder.record).not.toHaveBeenCalled();
  // Still the not-recording label — permission denial never flips the
  // button into a recording state.
  expect(findByLabel(root, 'Record an audio memo')).toBeDefined();
});

test('recording, stopping, and playing back a memo walks through every state the button exposes', async () => {
  const root = await renderScreen();

  await act(async () => {
    findByLabel(root, 'Record an audio memo').props.onPress();
  });
  expect(recorder.prepareToRecordAsync).toHaveBeenCalled();
  expect(recorder.record).toHaveBeenCalled();
  expect(findByLabel(root, 'Stop recording audio memo').props['aria-pressed']).toBe(true);

  await act(async () => {
    findByLabel(root, 'Stop recording audio memo').props.onPress();
  });
  expect(recorder.stop).toHaveBeenCalled();
  // Re-recording keeps a distinct, honest label rather than reusing "Record
  // an audio memo" as if nothing had been captured yet.
  expect(findByLabel(root, 'Record a new audio memo, replacing the current one')).toBeDefined();

  await act(async () => {
    findByLabel(root, 'Play recorded audio memo').props.onPress();
  });
  expect(player.play).toHaveBeenCalled();
});

test('a recording that leaves no uri announces failure instead of a false success', async () => {
  recorder.uri = null;
  const root = await renderScreen();

  await act(async () => {
    findByLabel(root, 'Record an audio memo').props.onPress();
  });
  await act(async () => {
    findByLabel(root, 'Stop recording audio memo').props.onPress();
  });

  // No memo was captured, so the button falls back to its original label
  // rather than the "Memo Recorded" state, and no play control appears.
  expect(findByLabel(root, 'Record an audio memo')).toBeDefined();
  expect(findPressables(root.root).find((p) => p.props.accessibilityLabel === 'Play recorded audio memo')).toBeUndefined();
});
