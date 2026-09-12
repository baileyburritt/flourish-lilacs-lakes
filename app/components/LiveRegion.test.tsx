import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Text } from 'react-native';

import { LiveRegionProvider, useAnnounce } from './LiveRegion';

function Announcer({ message }: { message: string }) {
  const announce = useAnnounce();
  return <Text onPress={() => announce(message)} testID="trigger" />;
}

function findLiveText(node: ReactTestRenderer) {
  return node.root.findByProps({ 'aria-live': 'polite' });
}

test('renders one aria-live="polite" region that starts empty', async () => {
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(
      <LiveRegionProvider>
        <Text>content</Text>
      </LiveRegionProvider>
    );
  });
  const region = findLiveText(root);
  expect(region.props.children).toBe('');
});

test('announce() from a descendant updates the shared region text', async () => {
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(
      <LiveRegionProvider>
        <Announcer message="Saved High Falls to My Spots." />
      </LiveRegionProvider>
    );
  });

  await act(async () => {
    root.root.findByProps({ testID: 'trigger' }).props.onPress();
  });

  expect(findLiveText(root).props.children).toBe('Saved High Falls to My Spots.');
});
