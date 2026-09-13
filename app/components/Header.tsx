import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/tokens';
import { rad, space, textStyle } from '../theme/scale';

// The five source screens each hand-rolled their own header, and no two
// agreed: three brand wordmarks ("Lilacs & Lakes" / "ROC & Lakes" / "LILACS &
// LAKES"), and two of five screens fetched the logo from a live third-party
// export-host URL (retired repo-wide in E10). One component, one wordmark,
// no external image dependency — every screen renders exactly one of these
// and nothing else that looks like a header.
type Props = {
  variant: 'root' | 'detail';
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onSearch?: () => void;
  onProfile?: () => void;
  // D7: most screens carry their own on-page h1 (e.g. Explore's "Discover
  // Rochester & Finger Lakes"), so the header's brand title stays plain text
  // there. New Private Gem has no other page-level heading — its header
  // title ("Add Private Gem") IS the page heading — so it opts in here
  // rather than every screen guessing at the right default.
  titleIsHeading?: boolean;
};

export function Header({ variant, title, subtitle, onBack, onSearch, onProfile, titleIsHeading }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.leading}>
        {variant === 'detail' ? (
          <Pressable onPress={onBack} accessibilityLabel="Go back" role="button" style={styles.iconButton}>
            <Text style={styles.iconGlyph}>‹</Text>
          </Pressable>
        ) : (
          <View style={styles.monogram} accessibilityElementsHidden importantForAccessibility="no">
            <Text style={styles.monogramText}>F</Text>
          </View>
        )}
        <View style={styles.titleBlock}>
          <Text
            style={styles.title}
            numberOfLines={1}
            {...(titleIsHeading ? { role: 'heading' as const, 'aria-level': 1 } : null)}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.trailing}>
        {variant === 'root' && onSearch ? (
          <Pressable onPress={onSearch} accessibilityLabel="Search spots, trails, events" role="button" style={styles.iconButton}>
            <Text style={styles.iconGlyph}>⌕</Text>
          </Pressable>
        ) : null}
        {onProfile ? (
          <Pressable onPress={onProfile} accessibilityLabel="Open your profile" role="button" style={styles.iconButton}>
            <Text style={styles.iconGlyph}>☺</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: space['margin-mobile'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors['surface'],
    borderBottomWidth: 1,
    borderBottomColor: colors['outline-variant'],
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space['space-xs'],
    flexShrink: 1,
    minWidth: 0,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space['space-xs'],
  },
  monogram: {
    width: 32,
    height: 32,
    borderRadius: rad.full,
    backgroundColor: colors['primary'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: {
    ...textStyle('headline-sm'),
    color: colors['on-primary'],
  },
  titleBlock: {
    minWidth: 0,
    flexShrink: 1,
  },
  title: {
    ...textStyle('headline-sm'),
    color: colors['primary'],
    fontWeight: '700',
  },
  subtitle: {
    ...textStyle('label-sm'),
    // `on-tertiary-container` is only ~3.16:1 against this light background
    // — fails WCAG AA's 4.5:1 for text this small. `tertiary` carries the
    // same accent family at a contrast that passes.
    color: colors['tertiary'],
    textTransform: 'uppercase',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: rad.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 20,
    color: colors['primary'],
  },
});
