import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomNav, Card, Header } from '../components';
import type { NavigateFn } from '../navigation/types';
import { colors } from '../theme/tokens';
import { space, textStyle } from '../theme/scale';

type Props = {
  navigate: NavigateFn;
  savedTitles: string[];
};

// The four bottom-nav tabs were part of every source screen's nav bar, but
// none of the five screens ever designed the "My Spots" destination itself.
// Rather than a placeholder ("Coming Soon" is explicitly off the table — see
// CLAUDE.md), this surfaces real session state: whatever you've actually
// bookmarked on Explore and Music & Live.
export function MySpotsScreen({ navigate, savedTitles }: Props) {
  return (
    <View style={styles.screen}>
      <Header variant="root" title="Flourish" subtitle="Lilacs & Lakes" onProfile={() => {}} />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.heading}>My Spots</Text>
        <Text style={styles.lede}>Saved by you this session.</Text>
        {savedTitles.length === 0 ? (
          <Text style={styles.empty}>Nothing saved yet — bookmark a spot from Explore or Music &amp; Live.</Text>
        ) : (
          <View style={{ gap: space['space-sm'] }}>
            {savedTitles.map((title) => (
              <Card key={title}>
                <Text style={styles.itemTitle}>{title}</Text>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
      <BottomNav active="my-spots" onNavigate={navigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors['surface'] },
  body: { flex: 1 },
  bodyContent: { padding: space['margin-mobile'], gap: space['space-md'] },
  heading: { ...textStyle('headline-lg'), color: colors['primary'] },
  lede: { ...textStyle('body-md'), color: colors['on-surface-variant'] },
  empty: { ...textStyle('body-md'), color: colors['on-surface-variant'] },
  itemTitle: { ...textStyle('headline-sm'), fontSize: 16, color: colors['primary'] },
});
