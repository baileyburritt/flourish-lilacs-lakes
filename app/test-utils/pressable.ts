import type { ReactTestInstance } from 'react-test-renderer';

// react-test-renderer's findAllByType(Pressable) doesn't match here — under
// jest-expo, the `Pressable` this test file imports from 'react-native' is
// not reference-equal to the one the component under test resolved via
// react-native's lazy-getter module exports, even though both come from the
// same package. Matching by the reported component name sidesteps that and
// also skips Pressable's internal host View (which re-forwards several of
// the same prop names — testID, aria-pressed, accessibilityLabel — but is
// not the element the component under test actually authored).
export function findPressables(root: ReactTestInstance): ReactTestInstance[] {
  return root.findAll((node) => {
    const type = node.type as unknown as { displayName?: string; name?: string } | string;
    if (typeof type === 'string') return false;
    return type.displayName === 'Pressable' || type.name === 'Pressable';
  });
}
