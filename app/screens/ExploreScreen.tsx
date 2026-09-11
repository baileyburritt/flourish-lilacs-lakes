import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomNav, Card, Chip, Header, Photo } from '../components';
import { DESTINATION_CATEGORIES } from '../constants/categories';
import type { NavigateFn } from '../navigation/types';
import { colors } from '../theme/tokens';
import { rad, space, textStyle } from '../theme/scale';

const FILTERS = ['All', ...DESTINATION_CATEGORIES.map((c: { label: string }) => c.label)];

const SPOTLIGHTS = [
  {
    id: 'high-falls',
    alt: "Breathtaking panorama of High Falls in downtown Rochester at golden sunset hour, thundering waterfall crashing into the Genesee River gorge.",
    badge: 'Urban Wonder',
    title: 'High Falls & Genesee Gorge',
    description:
      "A 96-foot cascading torrent surging directly through Rochester's historical mill quarter. Walk the Pont de Rennes bridge for mist and rooftop pints.",
    meta: 'Urban Trailhead',
    action: 'Explore Route',
  },
  {
    id: 'letchworth',
    alt: 'Majestic view of Letchworth State Park, the "Grand Canyon of the East," with a 600-foot shale gorge and Middle Falls roaring below.',
    badge: 'State Park Jewel',
    title: 'Letchworth: Grand Canyon of the East',
    description:
      'Three sheer waterfalls plunge between 600-foot gorge walls. Hike the Gorge Rim Trail or take an unforgettable hot-air balloon drift.',
    meta: '66 Miles of Trails',
    action: 'View Guide',
  },
];

const GETAWAYS = [
  {
    id: 'canandaigua',
    alt: 'Canandaigua Lake shoreline with wooden boat docks and rolling vineyard hills in the Finger Lakes region.',
    eyebrow: 'Lake & Vine',
    title: 'Canandaigua Wine & Trail',
    description: 'Lakeside boathouses, artisan tasting rooms & Kershaw Beach boardwalk.',
    meta: '8 Finger Lakes Wineries',
  },
  {
    id: 'watkins-glen',
    alt: 'Stone bridge arches crossing the Watkins Glen State Park gorge trail with water plunging behind a stone cavern path.',
    eyebrow: 'Gorge Wonder',
    title: 'Watkins Glen Gorge Trail',
    description: '19 waterfalls woven through a stone labyrinth and rainbow spray mist.',
    meta: 'Seneca Lake Trailhead',
  },
  {
    id: 'eastman-museum',
    alt: 'Exterior of the George Eastman Museum, a historic Georgian Revival mansion on East Avenue in Rochester.',
    eyebrow: 'Historic Landmark',
    title: 'George Eastman Museum',
    description: "World's oldest photography museum & historic Eastman estate terrace.",
    meta: 'East Ave Historic District',
  },
  {
    id: 'public-market',
    alt: 'Vibrant outdoor bustle at the historic Rochester Public Market with covered vendor sheds of fresh produce.',
    eyebrow: 'Food & Culture',
    title: 'Rochester Public Market',
    description: 'Local growers, specialty food shacks, empanadas & craft roast espresso.',
    meta: 'Market District Sheds',
  },
];

export const SPOT_TITLES: Record<string, string> = Object.fromEntries(
  [...SPOTLIGHTS, ...GETAWAYS].map((spot) => [spot.id, spot.title])
);

type Props = {
  navigate: NavigateFn;
  bookmarks: Record<string, boolean>;
  onToggleBookmark: (id: string) => void;
};

export function ExploreScreen({ navigate, bookmarks, onToggleBookmark }: Props) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <View style={styles.screen}>
      <Header variant="root" title="Flourish" subtitle="Lilacs & Lakes" onSearch={() => {}} onProfile={() => {}} />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Gorges, riesling trails, artisan cafes..."
          placeholderTextColor={colors['on-surface-variant']}
          accessibilityLabel="Search spots, trails, events"
          style={styles.search}
        />

        <Text style={styles.eyebrow}>Regional Discovery Journal</Text>
        <Text style={styles.heading}>Discover Rochester & Finger Lakes</Text>
        <Text style={styles.lede}>
          Waterfalls, sunlit vineyards, historic mansions & untold gems across Western NY.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {FILTERS.map((label: string) => (
            <Chip key={label} label={label} selected={activeFilter === label} onPress={() => setActiveFilter(label)} />
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Signature Wonders</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SPOTLIGHTS.map((spot) => (
            <Card key={spot.id} style={styles.spotlightCard}>
              <Photo alt={spot.alt} style={styles.spotlightPhoto} caption={spot.badge} />
              <Text style={styles.cardTitle}>{spot.title}</Text>
              <Text style={styles.cardBody}>{spot.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>{spot.meta}</Text>
                <View style={styles.footerActions}>
                  <Pressable
                    onPress={() => onToggleBookmark(spot.id)}
                    role="button"
                    aria-pressed={!!bookmarks[spot.id]}
                    accessibilityLabel={bookmarks[spot.id] ? `Remove ${spot.title} from My Spots` : `Save ${spot.title} to My Spots`}
                    style={styles.bookmarkButton}
                  >
                    <Text style={styles.bookmarkGlyph}>{bookmarks[spot.id] ? '★' : '☆'}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => spot.id === 'letchworth' && navigate('destination-detail')}
                    role="button"
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryButtonText}>{spot.action}</Text>
                  </Pressable>
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>

        <View style={styles.seasonalBanner}>
          <Text style={styles.seasonalEyebrow}>Seasonal Bloom Alert</Text>
          <Text style={styles.cardTitle}>Highland Park Lilac Season</Text>
          <View style={styles.seasonalPhotoRow}>
            <Photo alt="Dense purple lilac clusters in full bloom at Highland Park." style={styles.seasonalPhoto} />
            <Photo alt="The Lamberton Conservatory glasshouse at Highland Park with blooming spring azaleas." style={styles.seasonalPhoto} />
            <Photo alt="Sunlit rolling hills of Highland Park with blooming pink dogwood and white lilac trees." style={styles.seasonalPhoto} />
          </View>
          <Text style={styles.cardBody}>
            Over 1,200 fragrant lilac shrubs spanning 500 varieties across Olmsted-designed hills. Peak blooms forecasted over the next 10 days.
          </Text>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Curated Quick Getaways</Text>
        </View>
        <View style={styles.getawayList}>
          {GETAWAYS.map((spot) => (
            <Card key={spot.id} style={styles.getawayCard}>
              <Photo alt={spot.alt} style={styles.getawayPhoto} />
              <View style={styles.getawayBody}>
                <View style={styles.cardFooter}>
                  <Text style={styles.eyebrow}>{spot.eyebrow}</Text>
                  <Pressable
                    onPress={() => onToggleBookmark(spot.id)}
                    role="button"
                    aria-pressed={!!bookmarks[spot.id]}
                    accessibilityLabel={bookmarks[spot.id] ? `Remove ${spot.title} from My Spots` : `Save ${spot.title} to My Spots`}
                    style={styles.bookmarkButton}
                  >
                    <Text style={styles.bookmarkGlyph}>{bookmarks[spot.id] ? '★' : '☆'}</Text>
                  </Pressable>
                </View>
                <Text style={styles.cardTitleSm}>{spot.title}</Text>
                <Text style={styles.cardBody}>{spot.description}</Text>
                <Text style={styles.cardMeta}>{spot.meta}</Text>
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.gemCta}>
          <Text style={styles.gemEyebrow}>Local Cartographer</Text>
          <Text style={styles.gemTitle}>Know an unlisted favorite?</Text>
          <Text style={styles.gemBody}>
            Save a secluded swimming hole, cidery patio, or vintage vinyl haunt directly to your private map.
          </Text>
          <Pressable onPress={() => navigate('new-private-gem')} role="button" style={styles.gemButton}>
            <Text style={styles.gemButtonText}>Add Private Gem</Text>
          </Pressable>
          <Text style={styles.gemFootnote}>Only visible to you</Text>
        </View>
      </ScrollView>
      <BottomNav active="explore" onNavigate={navigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors['surface'] },
  body: { flex: 1 },
  bodyContent: { padding: space['margin-mobile'], gap: space['space-md'] },
  search: {
    height: 48,
    borderRadius: rad.full,
    backgroundColor: colors['surface-container-lowest'],
    paddingHorizontal: space['space-md'],
    color: colors['on-surface'],
    ...textStyle('body-md'),
  },
  eyebrow: {
    ...textStyle('label-sm'),
    // `on-tertiary-container` only reaches ~3.16:1 against this light
    // background, short of WCAG AA's 4.5:1 for small text.
    color: colors['tertiary'],
    textTransform: 'uppercase',
  },
  heading: {
    ...textStyle('headline-lg'),
    color: colors['primary'],
  },
  lede: {
    ...textStyle('body-md'),
    color: colors['on-surface-variant'],
  },
  chipRow: { flexDirection: 'row' },
  sectionTitle: {
    ...textStyle('headline-sm'),
    color: colors['primary'],
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  spotlightCard: { width: 300, marginRight: space['space-md'] },
  spotlightPhoto: { height: 160 },
  getawayPhoto: { width: 96, height: 96 },
  cardTitle: { ...textStyle('headline-sm'), color: colors['primary'] },
  cardTitleSm: { ...textStyle('headline-sm'), fontSize: 16, color: colors['primary'] },
  cardBody: { ...textStyle('body-sm'), color: colors['on-surface-variant'] },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { ...textStyle('body-sm'), color: colors['primary'], fontWeight: '600' },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: space['space-xs'] },
  bookmarkButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  bookmarkGlyph: { fontSize: 18, color: colors['secondary'] },
  primaryButton: {
    paddingHorizontal: space['space-md'],
    paddingVertical: space['space-xxs'],
    borderRadius: rad.full,
    backgroundColor: colors['primary'],
  },
  primaryButtonText: { ...textStyle('label-md'), color: colors['on-primary'] },
  seasonalBanner: {
    borderRadius: rad.md,
    backgroundColor: colors['secondary-fixed'],
    padding: space['space-md'],
    gap: space['space-xs'],
  },
  seasonalEyebrow: { ...textStyle('label-sm'), color: colors['secondary'], textTransform: 'uppercase', fontWeight: '700' },
  seasonalPhotoRow: { flexDirection: 'row', gap: space['space-xxs'] },
  seasonalPhoto: { flex: 1, height: 72 },
  getawayList: { gap: space['space-sm'] },
  getawayCard: { flexDirection: 'row', gap: space['space-sm'], alignItems: 'center' },
  getawayBody: { flex: 1, gap: 2, minWidth: 0 },
  gemCta: {
    borderRadius: rad.md,
    backgroundColor: colors['primary'],
    padding: space['space-lg'],
    gap: space['space-xxs'],
  },
  gemEyebrow: { ...textStyle('label-sm'), color: colors['tertiary-fixed-dim'], textTransform: 'uppercase', fontWeight: '700' },
  gemTitle: { ...textStyle('headline-md'), color: colors['on-primary'] },
  gemBody: { ...textStyle('body-sm'), color: colors['surface-variant'] },
  gemButton: {
    marginTop: space['space-xs'],
    alignSelf: 'flex-start',
    paddingHorizontal: space['space-lg'],
    paddingVertical: space['space-xs'],
    borderRadius: rad.full,
    // `on-tertiary-container` behind white button text is ~3.16:1, short of
    // WCAG AA's 4.5:1. `secondary` carries the same accent role at ~5.2:1.
    backgroundColor: colors['secondary'],
  },
  gemButtonText: { ...textStyle('label-md'), color: colors['on-primary'], fontWeight: '700' },
  gemFootnote: { ...textStyle('label-sm'), color: colors['surface-variant'] },
});
