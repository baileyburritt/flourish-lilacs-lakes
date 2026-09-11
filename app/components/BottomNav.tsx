import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/tokens';
import { space, textStyle } from '../theme/scale';

export const TAB_ROUTES = [
  { key: 'explore', label: 'Explore' },
  { key: 'music', label: 'Music & Live' },
  { key: 'itinerary', label: 'Itinerary' },
  { key: 'my-spots', label: 'My Spots' },
] as const;

export type TabRoute = (typeof TAB_ROUTES)[number]['key'];

// C4 fixes two bugs this component makes structurally impossible to repeat:
// the Music screen previously shipped with no tab marked active at all, and
// Destination Detail / New Private Gem had no bottom nav whatsoever. `active`
// is nullable on purpose — a detail screen reached by drilling in from a tab
// isn't itself one of the four tab destinations, so it renders with no tab
// falsely claimed as current rather than guessing one.
type Props = {
  active: TabRoute | null;
  onNavigate: (route: TabRoute) => void;
};

export function BottomNav({ active, onNavigate }: Props) {
  return (
    <View role="tablist" accessibilityLabel="Primary" style={styles.nav}>
      {TAB_ROUTES.map((route) => {
        const selected = route.key === active;
        return (
          <Pressable
            key={route.key}
            role="tab"
            aria-selected={selected}
            accessibilityLabel={route.label}
            onPress={() => onNavigate(route.key)}
            style={styles.tab}
          >
            <Text style={[styles.label, selected ? styles.labelActive : null]}>{route.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    backgroundColor: colors['surface-container-lowest'],
    borderTopWidth: 1,
    borderTopColor: colors['outline-variant'],
  },
  tab: {
    minWidth: 64,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space['space-xxs'],
  },
  label: {
    ...textStyle('label-sm'),
    color: colors['on-surface-variant'],
  },
  labelActive: {
    color: colors['primary'],
    fontWeight: '700',
  },
});
