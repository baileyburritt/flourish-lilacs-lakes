import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomNav, Card, Chip, Header, Photo } from '../components';
import type { NavigateFn } from '../navigation/types';
import { colors } from '../theme/tokens';
import { rad, space, textStyle } from '../theme/scale';

const FILTERS = ['All Events', 'Jazz & Blues', 'Orchestra & Eastman', 'Outdoor Concerts', 'Winery Sessions'];

const GIGS = [
  {
    id: 'kilbourn-hall',
    alt: 'Intimate acoustic hall at Eastman School of Music, ornate wood architecture with warm chandelier glow on a grand piano.',
    tag: 'Classical & Jazz',
    title: 'Kilbourn Hall Faculty Recital',
    venue: 'Eastman School of Music • Gibbs St',
    when: 'Friday • 7:30 PM',
    sampleLength: '0:30',
  },
  {
    id: 'cmac',
    alt: 'Outdoor amphitheater concert lawn overlooking Canandaigua Lake at golden sunset.',
    tag: 'Amphitheater',
    title: 'CMAC Summer Sunset Stage',
    venue: 'Canandaigua Lakefront Grounds',
    when: 'Next Saturday • 6:00 PM Gate',
    sampleLength: '0:45',
  },
  {
    id: 'heron-hill',
    alt: 'Rustic hillside winery pavilion overlooking Keuka Lake with a solo acoustic guitarist performing.',
    tag: 'Acoustic & Tasting',
    title: 'Winery Sunset Live Sessions',
    venue: 'Heron Hill Winery • Hammondsport',
    when: 'Sunday • 4:00 PM – 7:00 PM',
    sampleLength: '0:20',
  },
  {
    id: 'hochstein',
    alt: 'Chamber ensemble string quartet performing in historic Hochstein Performance Hall, sunlight through stained glass.',
    tag: 'Lunchtime Series',
    title: 'Hochstein at Noon',
    venue: '50 N Plymouth Ave • Downtown',
    when: 'Every Wednesday • 12:10 PM',
    sampleLength: '0:25',
  },
];

type Props = { navigate: NavigateFn };

export function MusicScreen({ navigate }: Props) {
  const [activeFilter, setActiveFilter] = useState('All Events');
  const [favorited, setFavorited] = useState<Record<string, boolean>>({});
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [festivalSaved, setFestivalSaved] = useState(false);

  return (
    <View style={styles.screen}>
      <Header variant="root" title="Flourish" subtitle="Lilacs & Lakes" onSearch={() => {}} onProfile={() => {}} />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.eyebrow}>Finger Lakes & ROC Stages</Text>
        <Text style={styles.heading}>Live Sounds & Festivals</Text>
        <Text style={styles.lede}>From world-class jazz club corners to sun-drenched lakeside amphitheaters.</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {FILTERS.map((label) => (
            <Chip key={label} label={label} selected={activeFilter === label} onPress={() => setActiveFilter(label)} />
          ))}
        </ScrollView>

        <Card style={styles.headliner}>
          <Photo alt="Vibrant night jazz festival concert at Gibbs Street East End, brass performer on stage under blue and warm spotlights." style={styles.headlinerPhoto} />
          <View style={styles.headlinerTop}>
            <Text style={styles.headlinerBadge}>Signature Festival</Text>
            <Pressable
              onPress={() => setFestivalSaved((v) => !v)}
              role="button"
              aria-pressed={festivalSaved}
              accessibilityLabel={festivalSaved ? 'Remove Rochester International Jazz Festival from My Spots' : 'Save Rochester International Jazz Festival to My Spots'}
              style={styles.bookmarkButton}
            >
              <Text style={styles.bookmarkGlyph}>{festivalSaved ? '★' : '☆'}</Text>
            </Pressable>
          </View>
          <Text style={styles.headlinerDate}>June 20–28, 2025 • 9 Days of World Talent</Text>
          <Text style={styles.cardTitle}>Rochester International Jazz Festival (RIJF)</Text>
          <Text style={styles.headlinerBody}>
            East End District & Kodak Hall at Eastman Theatre. 300+ concerts spanning world-class luminaries to free street stages.
          </Text>
          <Text style={styles.linkLikeText}>Festival Passes & Lineup</Text>
        </Card>

        <Text style={styles.sectionTitle}>Curated Upcoming Gigs</Text>
        <View style={styles.gigList}>
          {GIGS.map((gig) => {
            const isPlaying = playingId === gig.id;
            return (
              <Card key={gig.id} style={styles.gigCard}>
                <View style={styles.gigRow}>
                  <Photo alt={gig.alt} style={styles.gigPhoto} />
                  <View style={styles.gigBody}>
                    <View style={styles.cardFooter}>
                      <Text style={styles.eyebrow}>{gig.tag}</Text>
                      <Pressable
                        onPress={() => setFavorited((f) => ({ ...f, [gig.id]: !f[gig.id] }))}
                        role="button"
                        aria-pressed={!!favorited[gig.id]}
                        accessibilityLabel={favorited[gig.id] ? `Remove ${gig.title} from favorites` : `Favorite ${gig.title}`}
                        style={styles.bookmarkButton}
                      >
                        <Text style={styles.bookmarkGlyph}>{favorited[gig.id] ? '♥' : '♡'}</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.cardTitleSm}>{gig.title}</Text>
                    <Text style={styles.cardBody}>{gig.venue}</Text>
                    <Text style={styles.cardMeta}>{gig.when}</Text>
                  </View>
                </View>
                <View style={styles.gigActionRow}>
                  <Pressable
                    onPress={() => setPlayingId(isPlaying ? null : gig.id)}
                    role="button"
                    aria-pressed={isPlaying}
                    accessibilityLabel={isPlaying ? `Stop sample for ${gig.title}` : `Play sample for ${gig.title}`}
                    style={styles.sampleButton}
                  >
                    <Text style={styles.sampleButtonText}>{isPlaying ? 'Playing…' : `Sample (${gig.sampleLength})`}</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </View>

        <View style={styles.reminderCallout}>
          <Text style={styles.cardTitleSm}>Heard of a popup gig or open mic?</Text>
          <Text style={styles.cardBody}>
            Save underground park jams, microbrewery buskers, and East End jazz jams directly into your private travel notebook.
          </Text>
          <Pressable onPress={() => navigate('itinerary')} role="button" style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Add to Itinerary Notes</Text>
          </Pressable>
        </View>
      </ScrollView>
      <BottomNav active="music" onNavigate={navigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors['surface'] },
  body: { flex: 1 },
  bodyContent: { padding: space['margin-mobile'], gap: space['space-md'] },
  // `on-tertiary-container` is only ~3.16:1 here — short of WCAG AA's
  // 4.5:1 for text this small; `tertiary` passes at the same accent role.
  eyebrow: { ...textStyle('label-sm'), color: colors['tertiary'], textTransform: 'uppercase' },
  heading: { ...textStyle('headline-lg'), color: colors['primary'] },
  lede: { ...textStyle('body-md'), color: colors['on-surface-variant'] },
  chipRow: { flexDirection: 'row' },
  sectionTitle: { ...textStyle('headline-sm'), color: colors['primary'] },
  headliner: { backgroundColor: colors['primary'] },
  headlinerPhoto: { height: 160, backgroundColor: colors['primary-container'] },
  headlinerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headlinerBadge: {
    ...textStyle('label-sm'),
    color: colors['on-secondary'],
    backgroundColor: colors['secondary'],
    paddingHorizontal: space['space-sm'],
    paddingVertical: 2,
    borderRadius: rad.full,
    overflow: 'hidden',
  },
  headlinerDate: { ...textStyle('label-sm'), color: colors['tertiary-fixed'] },
  cardTitle: { ...textStyle('headline-sm'), color: colors['on-primary'] },
  // `cardBody`'s dark gray reads fine on light cards but is ~1.55:1 on this
  // card's dark navy background — a distinct light body color for text that
  // sits directly on `headliner`'s `primary` fill.
  headlinerBody: { ...textStyle('body-sm'), color: colors['surface-variant'] },
  cardTitleSm: { ...textStyle('headline-sm'), fontSize: 16, color: colors['primary'] },
  cardBody: { ...textStyle('body-sm'), color: colors['on-surface-variant'] },
  linkLikeText: { ...textStyle('label-md'), color: colors['tertiary-fixed-dim'], fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { ...textStyle('body-sm'), color: colors['on-surface-variant'] },
  bookmarkButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  bookmarkGlyph: { fontSize: 18, color: colors['secondary-fixed-dim'] },
  gigList: { gap: space['space-md'] },
  gigCard: { gap: space['space-sm'] },
  gigRow: { flexDirection: 'row', gap: space['space-sm'] },
  gigPhoto: { width: 88, height: 88 },
  gigBody: { flex: 1, gap: 2, minWidth: 0 },
  gigActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    backgroundColor: colors['surface-container-low'],
    borderRadius: rad.DEFAULT,
    padding: space['space-xxs'],
  },
  sampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space['space-sm'],
    paddingVertical: space['space-xxs'],
    borderRadius: rad.full,
    backgroundColor: colors['surface-container-lowest'],
  },
  sampleButtonText: { ...textStyle('label-sm'), color: colors['primary'] },
  reminderCallout: {
    borderRadius: rad.md,
    backgroundColor: colors['surface-container-high'],
    padding: space['space-md'],
    gap: space['space-xs'],
  },
  primaryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: space['space-md'],
    paddingVertical: space['space-xs'],
    borderRadius: rad.full,
    backgroundColor: colors['primary'],
  },
  primaryButtonText: { ...textStyle('label-sm'), color: colors['on-primary'] },
});
