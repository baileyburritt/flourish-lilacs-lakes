import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { BottomNav, Card, Chip, FormField, Header, Photo, useAnnounce } from '../components';
import { DESTINATION_CATEGORIES } from '../constants/categories';
import type { NavigateFn, SavedGem } from '../navigation/types';
import { colors } from '../theme/tokens';
import { rad, space, textStyle } from '../theme/scale';

const HIGHLIGHTS = [
  { id: 'cascades', tag: 'Cascades', title: '3 Massive Waterfalls', body: 'Upper, Middle, and Lower Falls drop over 600 feet inside the towering shale gorge walls.' },
  { id: 'balloons', tag: 'Sky High', title: 'Hot Air Balloons', body: 'Early dawn lift-offs directly from the gorge floor with panoramic views of western New York.' },
  { id: 'glen-iris', tag: 'Historic Dine', title: 'Glen Iris Inn', body: 'The former home of William Pryor Letchworth, serving regional farm-to-table lunch & dinner.' },
  { id: 'gorge-trail', tag: 'Footpath', title: 'Gorge Trail (Trail #1)', body: '7-mile point-to-point stone footpath tracing the Genesee riverbed with scenic vista lookouts.' },
];

const RANGER_TIPS = [
  { id: 'restrooms', label: 'Restrooms', body: 'Located at Upper, Middle Falls & Highbanks' },
  { id: 'pets', label: 'Pet Friendly', body: 'On 6ft leashes; rabies certificate required' },
  { id: 'slippery', label: 'Slippery Stone', body: 'Stay on marked rim paths; spray creates wet surfaces' },
  { id: 'parking', label: 'Portageville Gate', body: 'Closest access point to Upper Falls trailheads' },
];

type Props = { navigate: NavigateFn };

export function DestinationDetailScreen({ navigate }: Props) {
  const [saved, setSaved] = useState(false);
  const [gems, setGems] = useState<SavedGem[]>([
    { id: 'silver-lake-cider', name: 'Silver Lake Farm Cider Stand', meta: 'Dining & Markets • 8 mins away' },
  ]);
  const [gemName, setGemName] = useState('');
  const [gemCategory, setGemCategory] = useState(DESTINATION_CATEGORIES[1].label);
  const [gemLocation, setGemLocation] = useState('');
  const [gemNotes, setGemNotes] = useState('');
  const [gemPrivate, setGemPrivate] = useState(true);
  const announce = useAnnounce();

  function toggleSaved() {
    setSaved((v) => !v);
    announce(saved ? 'Removed Letchworth from saved journeys.' : 'Saved Letchworth to saved journeys.');
  }

  function submitGem() {
    if (!gemName.trim()) {
      announce('Enter a spot or business name before saving.');
      return;
    }
    setGems((prev) => [
      { id: `gem-${Date.now()}`, name: gemName.trim(), meta: `${gemCategory} • ${gemLocation.trim() || 'Near Castile / Letchworth'}` },
      ...prev,
    ]);
    announce(`Saved ${gemName.trim()} to My Private Gems.`);
    setGemName('');
    setGemLocation('');
    setGemNotes('');
  }

  return (
    <View style={styles.screen}>
      <Header variant="detail" title="Spot Details" subtitle="Flourish · Lilacs & Lakes" onBack={() => navigate('explore')} onProfile={() => {}} />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Card padded={false}>
          <Photo alt="Letchworth State Park Upper Falls cascading through a dramatic shale canyon surrounded by autumn foliage." style={styles.heroPhoto} caption="State Park Landmark • Castile, NY • 55m away" />
          <View style={styles.heroBody}>
            <View style={styles.cardFooter}>
              <Text style={styles.headingSm}>Letchworth & Upper Falls</Text>
              <Pressable
                onPress={toggleSaved}
                role="button"
                aria-pressed={saved}
                accessibilityLabel={saved ? 'Remove Letchworth from saved journeys' : 'Save Letchworth to saved journeys'}
                style={styles.bookmarkButton}
              >
                <Text style={styles.bookmarkGlyph}>{saved ? '★' : '☆'}</Text>
              </Pressable>
            </View>
            <Text style={styles.cardBody}>The Grand Canyon of the East • Genesee River Gorge</Text>
            <View style={styles.metricsRow}>
              <Metric label="Drive" value="55 min" />
              <Metric label="Vehicle Fee" value="$10" />
              <Metric label="Prime Light" value="Sunrise" />
              <Metric label="Trails" value="66 mi" />
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Editorial Highlights</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {HIGHLIGHTS.map((h) => (
            <Card key={h.id} style={styles.highlightCard}>
              <Photo alt={h.title} style={styles.highlightPhoto} />
              <Text style={styles.eyebrow}>{h.tag}</Text>
              <Text style={styles.headingSm}>{h.title}</Text>
              <Text style={styles.cardBody}>{h.body}</Text>
            </Card>
          ))}
        </ScrollView>

        <View style={styles.tipsCard}>
          <Text style={styles.headingSm}>Ranger Tips & Practical Amenities</Text>
          <View style={styles.tipsGrid}>
            {RANGER_TIPS.map((tip) => (
              <View key={tip.id} style={styles.tipCell}>
                <Text style={styles.tipLabel}>{tip.label}</Text>
                <Text style={styles.tipBody}>{tip.body}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.privateSection}>
          <Text style={styles.headingSm}>Personal Notes & Local Spots Nearby</Text>
          <Text style={styles.cardBody}>Saved privately to your device • Not shared publicly</Text>

          <View style={{ gap: space['space-xs'] }}>
            {gems.map((gem) => (
              <Card key={gem.id}>
                <Text style={styles.headingSm}>{gem.name}</Text>
                <Text style={styles.gemMeta}>{gem.meta}</Text>
              </Card>
            ))}
          </View>

          <Card style={styles.formCard}>
            <Text style={styles.headingSm}>Log a Personal Hidden Gem</Text>
            <FormField label="Spot or Business Name" value={gemName} onChangeText={setGemName} placeholder="e.g. Hidden gorge overlook behind Glen Iris" required />
            <View>
              <Text style={styles.fieldLabel}>Category / Vibe</Text>
              <View style={styles.chipWrap}>
                {DESTINATION_CATEGORIES.map((c: { id: string; label: string }) => (
                  <Chip key={c.id} label={c.label} selected={gemCategory === c.label} onPress={() => setGemCategory(c.label)} />
                ))}
              </View>
            </View>
            <FormField label="Location / Landmark / Cross Streets" value={gemLocation} onChangeText={setGemLocation} placeholder="e.g. Just past Perry entrance on Route 39" />
            <FormField label="Personal Reminder & Notes" value={gemNotes} onChangeText={setGemNotes} placeholder="e.g. Cash only after 3 PM; breathtaking sunset reflections." multiline numberOfLines={3} />
            <View style={styles.privacyRow}>
              <Text style={styles.fieldLabel}>Encrypted on this device — excluded from shared guides</Text>
              <Switch value={gemPrivate} onValueChange={setGemPrivate} accessibilityLabel="Keep this gem encrypted on this device" />
            </View>
            <Pressable onPress={submitGem} role="button" style={styles.submitButton}>
              <Text style={styles.submitButtonText}>Save to My Private Gems</Text>
            </Pressable>
          </Card>
        </View>
      </ScrollView>
      <BottomNav active={null} onNavigate={navigate} />
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCell}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors['surface'] },
  body: { flex: 1 },
  bodyContent: { padding: space['margin-mobile'], gap: space['space-lg'] },
  heroPhoto: { height: 220, borderRadius: 0 },
  heroBody: { padding: space['space-md'], gap: space['space-xs'] },
  headingSm: { ...textStyle('headline-sm'), color: colors['primary'] },
  cardBody: { ...textStyle('body-sm'), color: colors['on-surface-variant'] },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookmarkButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  bookmarkGlyph: { fontSize: 20, color: colors['secondary'] },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space['space-xs'] },
  metricCell: { alignItems: 'center', gap: 2 },
  metricLabel: { ...textStyle('label-sm'), color: colors['on-surface-variant'] },
  metricValue: { ...textStyle('label-md'), color: colors['primary'], fontWeight: '700' },
  sectionTitle: { ...textStyle('headline-sm'), color: colors['primary'] },
  highlightCard: { width: 220, marginRight: space['space-sm'] },
  highlightPhoto: { height: 100 },
  // `on-tertiary-container` is only ~3.16:1 here — short of WCAG AA's
  // 4.5:1 for text this small; `tertiary` passes at the same accent role.
  eyebrow: { ...textStyle('label-sm'), color: colors['tertiary'], textTransform: 'uppercase', fontWeight: '700' },
  tipsCard: {
    borderRadius: rad.md,
    backgroundColor: colors['surface-container-low'],
    padding: space['space-md'],
    gap: space['space-xs'],
  },
  tipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space['space-xs'] },
  tipCell: { width: '47%', backgroundColor: colors['surface-container-lowest'], borderRadius: rad.DEFAULT, padding: space['space-xs'], gap: 2 },
  tipLabel: { ...textStyle('label-md'), color: colors['primary'], fontWeight: '700' },
  tipBody: { ...textStyle('body-sm'), fontSize: 11, color: colors['on-surface-variant'] },
  privateSection: { gap: space['space-sm'] },
  gemMeta: { ...textStyle('label-sm'), color: colors['secondary'], fontWeight: '600' },
  formCard: { gap: space['space-sm'] },
  fieldLabel: { ...textStyle('label-md'), color: colors['primary'], fontWeight: '700' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space['space-xxs'], marginTop: space['space-xxs'] },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space['space-sm'],
    padding: space['space-sm'],
    borderRadius: rad.DEFAULT,
    backgroundColor: colors['surface-container-low'],
  },
  submitButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rad.full,
    backgroundColor: colors['primary'],
  },
  submitButtonText: { ...textStyle('label-lg'), color: colors['on-primary'], fontWeight: '700' },
});
