import { useState } from 'react';
import { Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { BottomNav, Card, Chip, FormField, Header } from '../components';
import type { NavigateFn } from '../navigation/types';
import { colors } from '../theme/tokens';
import { rad, space, textStyle } from '../theme/scale';

const MAPS_DESTINATION = 'Seneca Lake, Watkins Glen, New York';

// B6: hands off to the platform maps app instead of any in-app turn-by-turn
// navigation. Mapbox Directions stays in scope elsewhere only for
// drive-time estimates between stops — this function must never grow into
// more than a URL scheme choice (checked by scripts/check-no-navigation-sdk.js).
function platformMapsUrl(destination: string): string {
  const query = encodeURIComponent(destination);
  if (Platform.OS === 'ios') return `maps://?q=${query}`;
  if (Platform.OS === 'android') return `geo:0,0?q=${query}`;
  return `https://maps.google.com/?q=${query}`;
}

type Stop = {
  id: string;
  time: string;
  title: string;
  description: string;
  isPrivateGem?: boolean;
  note?: string;
};

const DAY_1_STOPS: Stop[] = [
  { id: 'fitts-coffee', time: '8:30 AM • 45 min', title: 'Fitts Coffee & Market Hall', description: 'Historic Rochester Public Market annex. Fresh spiced apple cider donuts & cold brew.' },
  { id: 'high-falls', time: '10:00 AM • 1 hour', title: 'High Falls Gorge Overlook', description: 'Pont de Rennes pedestrian bridge vantage. Epic industrial urban waterfall view.' },
  {
    id: 'irondequoit-kayak',
    time: '4:30 PM Sunset',
    title: 'Quiet Kayak Launch at Irondequoit Bay',
    description: 'South wetlands marsh access point away from motorboat traffic.',
    isPrivateGem: true,
    note: 'Free gravel parking near the south pier. Best golden hour mirror reflections!',
  },
];

const DAY_2_STOPS: Stop[] = [
  {
    id: 'glenora-peach',
    time: '10:00 AM • Quick Stop',
    title: 'Glenora Roadside Peach Orchard & Stand',
    description: 'Unmarked farm gate off Route 14 overlooking western Seneca Lake slopes.',
    isPrivateGem: true,
    note: 'Cash only! Arrive around 10:00 AM right after the second morning harvest.',
  },
  { id: 'watkins-glen', time: '1:30 PM • 2.5 hours', title: 'Watkins Glen Gorge Trail', description: 'Climb 800 stone steps behind 19 waterfalls through carved limestone cavern.' },
  { id: 'keuka-cider', time: '5:00 PM • 1.5 hours', title: 'Keuka Artisan Cider House', description: 'Crisp heritage dry cider flight with local sharp cheddar pairings on bluff terrace.' },
];

const DAYS = ['Day 1', 'Day 2', 'Day 3'];

type Props = { navigate: NavigateFn };

export function TripPlannerScreen({ navigate }: Props) {
  const [gemModalOpen, setGemModalOpen] = useState(false);
  const [gemName, setGemName] = useState('');
  const [gemDay, setGemDay] = useState(DAYS[1]);
  const [gemTime, setGemTime] = useState('');
  const [gemNote, setGemNote] = useState('');
  const [gemPrivate, setGemPrivate] = useState(true);
  const [addedGems, setAddedGems] = useState<Stop[]>([]);

  function resetGemForm() {
    setGemName('');
    setGemDay(DAYS[1]);
    setGemTime('');
    setGemNote('');
    setGemPrivate(true);
  }

  function submitGem() {
    if (!gemName.trim()) return;
    setAddedGems((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, time: gemTime || 'Time TBD', title: gemName.trim(), description: gemNote.trim(), isPrivateGem: gemPrivate, note: gemNote.trim() },
    ]);
    resetGemForm();
    setGemModalOpen(false);
  }

  return (
    <View style={styles.screen}>
      <Header variant="root" title="Flourish" subtitle="Lilacs & Lakes" onSearch={() => {}} onProfile={() => {}} />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.eyebrow}>Oct 14–16 • 3 Days, 7 Stops</Text>
        <Text style={styles.heading}>Weekend Getaway: ROC to Keuka & Seneca Lakes</Text>
        <Text style={styles.lede}>Autumn foliage route from High Falls gorge down through farmstands and lakeside vineyards.</Text>

        <View style={styles.statsRibbon}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Drive Window</Text>
            <Text style={styles.statValue}>2h 45m total</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Curated</Text>
            <Text style={styles.statValue}>4 Spots</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Private</Text>
            <Text style={[styles.statValue, { color: colors['secondary'] }]}>2 Gems</Text>
          </View>
        </View>

        <View style={styles.mapPreview}>
          <Text style={styles.mapLabel}>GPS Trail Ready</Text>
          <Text style={styles.mapTitle}>Canandaigua to Watkins Glen Byway</Text>
          <Pressable
            onPress={() => Linking.openURL(platformMapsUrl(MAPS_DESTINATION))}
            role="button"
            accessibilityLabel="Start Navigation"
            style={styles.startNavButton}
          >
            <Text style={styles.startNavButtonText}>Start</Text>
          </Pressable>
        </View>

        <DaySection title="Day 1 • Rochester Kickoff" subtitle="Friday, Oct 14 • 2 Curated Stops" stops={DAY_1_STOPS} />
        <DaySection title="Day 2 • Wine Country & Gorges" subtitle="Saturday, Oct 15 • Seneca & Keuka Lakes" stops={DAY_2_STOPS} />
        {addedGems.length > 0 ? <DaySection title="Your Added Stops" subtitle="Appended this session" stops={addedGems} /> : null}

        <View style={styles.gemCta}>
          <Text style={styles.cardTitle}>Know a secret spot?</Text>
          <Text style={styles.cardBody}>Add your own farm stand, kayak drop, or scenic sunset pull-off.</Text>
          <Pressable onPress={() => setGemModalOpen(true)} role="button" style={styles.gemButton}>
            <Text style={styles.gemButtonText}>+ Add Custom Hidden Gem</Text>
          </Pressable>
        </View>
      </ScrollView>
      <BottomNav active="itinerary" onNavigate={navigate} />

      <Modal visible={gemModalOpen} animationType="slide" transparent onRequestClose={() => setGemModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.cardTitle}>New Private Gem</Text>
              <Pressable onPress={() => setGemModalOpen(false)} role="button" accessibilityLabel="Close form" style={styles.closeButton}>
                <Text style={styles.closeGlyph}>×</Text>
              </Pressable>
            </View>
            <Text style={styles.cardBody}>This pin is kept completely private to your Flourish itinerary unless you choose to share it.</Text>
            <FormField label="Spot Name or Landmark" value={gemName} onChangeText={setGemName} placeholder="e.g. Lodi Point Sunset Bench" required />
            <View>
              <Text style={styles.fieldLabel}>Day</Text>
              <View style={styles.chipRow}>
                {DAYS.map((day) => (
                  <Chip key={day} label={day} selected={gemDay === day} onPress={() => setGemDay(day)} />
                ))}
              </View>
            </View>
            <FormField label="Best Time" value={gemTime} onChangeText={setGemTime} placeholder="e.g. 11:30 AM" />
            <FormField label="Personal Note & Insider Tips" value={gemNote} onChangeText={setGemNote} placeholder="e.g. Cash only stand, secret entrance behind old willow tree..." multiline numberOfLines={2} />
            <View style={styles.privacyRow}>
              <Text style={styles.fieldLabel}>Keep Secret — visible only on your device</Text>
              <Switch value={gemPrivate} onValueChange={setGemPrivate} accessibilityLabel="Keep this gem secret, visible only on your device" />
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setGemModalOpen(false)} role="button" style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={submitGem} role="button" style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Save Gem</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DaySection({ title, subtitle, stops }: { title: string; subtitle: string; stops: Stop[] }) {
  return (
    <View style={styles.daySection}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardMeta}>{subtitle}</Text>
      <View style={{ gap: space['space-sm'] }}>
        {stops.map((stop) => (
          <Card key={stop.id} style={stop.isPrivateGem ? styles.privateStopCard : undefined}>
            <View style={styles.cardFooter}>
              {stop.isPrivateGem ? <Text style={styles.privateBadge}>Personal Gem • Private</Text> : <Text style={styles.cardMeta}>{stop.time}</Text>}
              {stop.isPrivateGem ? <Text style={styles.cardMeta}>{stop.time}</Text> : null}
            </View>
            <Text style={styles.cardTitleSm}>{stop.title}</Text>
            <Text style={styles.cardBody}>{stop.description}</Text>
            {stop.note ? (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>Your Note</Text>
                <Text style={styles.cardBody}>{stop.note}</Text>
              </View>
            ) : null}
          </Card>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors['surface'] },
  body: { flex: 1 },
  bodyContent: { padding: space['margin-mobile'], gap: space['space-md'] },
  eyebrow: { ...textStyle('label-sm'), color: colors['secondary'], textTransform: 'uppercase', fontWeight: '600' },
  heading: { ...textStyle('headline-md'), color: colors['primary'] },
  lede: { ...textStyle('body-sm'), color: colors['on-surface-variant'] },
  statsRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: rad.md,
    backgroundColor: colors['surface-container-lowest'],
    padding: space['space-sm'],
  },
  statCell: { alignItems: 'center', gap: 2 },
  statLabel: { ...textStyle('label-sm'), color: colors['on-surface-variant'] },
  statValue: { ...textStyle('label-lg'), color: colors['primary'], fontWeight: '700' },
  mapPreview: {
    borderRadius: rad.md,
    backgroundColor: colors['primary'],
    padding: space['space-sm'],
    gap: 2,
  },
  mapLabel: { ...textStyle('label-sm'), color: colors['secondary-fixed'], textTransform: 'uppercase' },
  mapTitle: { ...textStyle('headline-sm'), color: colors['on-primary'] },
  startNavButton: {
    marginTop: space['space-xs'],
    alignSelf: 'flex-start',
    paddingHorizontal: space['space-md'],
    height: 40,
    justifyContent: 'center',
    borderRadius: rad.full,
    // `on-tertiary-container` behind white button text is ~3.16:1, short of
    // WCAG AA's 4.5:1. `secondary` carries the same accent role at ~5.2:1.
    backgroundColor: colors['secondary'],
  },
  startNavButtonText: { ...textStyle('label-sm'), color: colors['on-tertiary'], fontWeight: '700' },
  daySection: { gap: space['space-xs'] },
  cardTitle: { ...textStyle('headline-sm'), color: colors['primary'] },
  cardTitleSm: { ...textStyle('headline-sm'), fontSize: 16, color: colors['primary'] },
  cardBody: { ...textStyle('body-sm'), color: colors['on-surface-variant'] },
  cardMeta: { ...textStyle('label-sm'), color: colors['on-surface-variant'] },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  privateStopCard: { backgroundColor: colors['surface-container-lowest'], borderColor: colors['tertiary-fixed'], borderWidth: 1 },
  privateBadge: { ...textStyle('label-sm'), color: colors['on-tertiary-fixed-variant'], fontWeight: '700' },
  noteBox: { backgroundColor: colors['surface-container-low'], borderRadius: rad.DEFAULT, padding: space['space-xs'] },
  noteLabel: { ...textStyle('label-sm'), color: colors['primary'], fontWeight: '700' },
  gemCta: {
    borderRadius: rad.md,
    backgroundColor: colors['primary-container'],
    padding: space['space-md'],
    gap: space['space-xxs'],
  },
  gemButton: {
    marginTop: space['space-xs'],
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rad.full,
    // `on-tertiary-container` behind white button text is ~3.16:1, short of
    // WCAG AA's 4.5:1. `secondary` carries the same accent role at ~5.2:1.
    backgroundColor: colors['secondary'],
  },
  gemButtonText: { ...textStyle('label-lg'), color: colors['on-tertiary'], fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: colors['primary'], opacity: 0.98, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors['surface-container-lowest'],
    borderTopLeftRadius: rad.lg,
    borderTopRightRadius: rad.lg,
    padding: space['space-md'],
    gap: space['space-sm'],
    maxHeight: '85%',
  },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeButton: { width: 32, height: 32, borderRadius: rad.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors['surface-container'] },
  closeGlyph: { fontSize: 18, color: colors['on-surface-variant'] },
  fieldLabel: { ...textStyle('label-lg'), color: colors['primary'] },
  chipRow: { flexDirection: 'row', gap: space['space-xxs'], marginTop: space['space-xxs'] },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space['space-sm'],
    borderRadius: rad.DEFAULT,
    backgroundColor: colors['surface-container-low'],
  },
  modalActions: { flexDirection: 'row', gap: space['space-xs'] },
  secondaryButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rad.full,
    backgroundColor: colors['surface-container'],
  },
  secondaryButtonText: { ...textStyle('label-lg'), color: colors['primary'] },
  primaryButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rad.full,
    backgroundColor: colors['primary'],
  },
  primaryButtonText: { ...textStyle('label-lg'), color: colors['on-primary'] },
});
