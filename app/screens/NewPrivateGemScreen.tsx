import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { BottomNav, Card, Chip, FormField, Header, Photo } from '../components';
import { DESTINATION_CATEGORIES } from '../constants/categories';
import type { NavigateFn } from '../navigation/types';
import { colors } from '../theme/tokens';
import { rad, space, textStyle } from '../theme/scale';

const REGIONS = ['Rochester Metro', 'Canandaigua Lake', 'Keuka Lake Bluff', 'Seneca & Watkins', 'Genesee Valley & Letchworth Gorge'];

type Props = { navigate: NavigateFn };

export function NewPrivateGemScreen({ navigate }: Props) {
  const [category, setCategory] = useState(DESTINATION_CATEGORIES[1].label);
  const [region, setRegion] = useState(REGIONS[1]);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [landmarkClue, setLandmarkClue] = useState('');
  const [notes, setNotes] = useState('');
  const [keepSecret, setKeepSecret] = useState(true);
  const [photoAttached, setPhotoAttached] = useState(false);
  const [hasMemo, setHasMemo] = useState(false);

  function save() {
    if (!name.trim()) return;
    navigate('explore');
  }

  return (
    <View style={styles.screen}>
      <Header variant="detail" title="Add Private Gem" subtitle="New Discovery" onBack={() => navigate('explore')} />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.introCard}>
          <Text style={styles.cardBody}>
            Safeguard your unlisted Western NY sanctuaries: secluded swimming coves, generational farm stands, misted gorge overlooks, and lantern-lit tavern nooks.
          </Text>
        </View>

        <View style={styles.privacyCard}>
          <View style={styles.privacyHeaderRow}>
            <Text style={styles.privacyHeading}>Privacy & Sharing Mode</Text>
            <Text style={styles.vaultBadge}>Vault Mode</Text>
          </View>
          <View style={styles.privacyToggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.privacyToggleLabel}>Keep 100% Secret</Text>
              <Text style={styles.privacyToggleBody}>Stored offline on this device only. Zero cloud sync or indexed coordinates.</Text>
            </View>
            <Switch value={keepSecret} onValueChange={setKeepSecret} accessibilityLabel="Keep this gem 100 percent secret, stored only on this device" />
          </View>
        </View>

        <View>
          <Text style={styles.fieldLabel}>Category & Atmosphere</Text>
          <View style={styles.chipWrap}>
            {DESTINATION_CATEGORIES.map((c: { id: string; label: string }) => (
              <Chip key={c.id} label={c.label} selected={category === c.label} onPress={() => setCategory(c.label)} />
            ))}
          </View>
        </View>

        <FormField label="Gem / Spot Name" value={name} onChangeText={setName} placeholder="e.g. Bare Hill Sunset Ledge" required />

        <View>
          <Text style={styles.fieldLabel}>Sub-Region / Lake Corridor</Text>
          <View style={styles.chipWrap}>
            {REGIONS.map((r) => (
              <Chip key={r} label={r} selected={region === r} onPress={() => setRegion(r)} />
            ))}
          </View>
        </View>

        <FormField label="Location & Coordinates" value={location} onChangeText={setLocation} placeholder="e.g. 42.6074, -77.6892" />
        <FormField label="Landmark Clue" value={landmarkClue} onChangeText={setLandmarkClue} placeholder="e.g. Behind the red fruit packing barn off Route 21" />

        <View style={styles.mapPreview}>
          <Photo alt="Map waypoint preview near Stony Brook State Park, Dansville, NY." style={styles.mapPhoto} caption="Encrypted Coordinates" />
        </View>

        {/* Committed decision (CLAUDE.md): this field is the equivalent path
            that keeps the audio memo below accessible — it stays visible,
            unhidden, and un-demoted, not folded behind a tab or toggle. */}
        <FormField label="Insider Tips & Route Logistics" value={notes} onChangeText={setNotes} placeholder="e.g. Best light at 6:30 PM; cash only box for farm peaches; steep shale incline." multiline numberOfLines={3} />

        <View>
          <Text style={styles.fieldLabel}>Field Captures & Audio Memo</Text>
          <View style={styles.captureRow}>
            <Pressable
              onPress={() => setPhotoAttached((v) => !v)}
              role="button"
              aria-pressed={photoAttached}
              accessibilityLabel={photoAttached ? 'Remove attached photo' : 'Add a photo'}
              style={styles.captureButton}
            >
              <Text style={styles.captureButtonText}>{photoAttached ? '1 Photo Attached' : '+ Add Photo'}</Text>
            </Pressable>
            {/* The audio-memo capture itself — a real, committed feature (not
                a cut candidate) per CLAUDE.md. */}
            <Pressable
              onPress={() => setHasMemo((v) => !v)}
              role="button"
              aria-pressed={hasMemo}
              accessibilityLabel={hasMemo ? 'Stop recording audio memo' : 'Record an audio memo'}
              style={styles.captureButton}
            >
              <Text style={styles.captureButtonText}>{hasMemo ? 'Recording… Tap to Stop' : 'Record Memo'}</Text>
            </Pressable>
          </View>
        </View>

        <Pressable onPress={save} role="button" style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save to My Private Gems</Text>
        </Pressable>
      </ScrollView>
      <BottomNav active={null} onNavigate={navigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors['surface'] },
  body: { flex: 1 },
  bodyContent: { padding: space['margin-mobile'], gap: space['space-md'] },
  introCard: {
    borderRadius: rad.lg,
    backgroundColor: colors['surface-container-low'],
    padding: space['space-md'],
  },
  cardBody: { ...textStyle('body-md'), color: colors['on-surface'] },
  privacyCard: {
    borderRadius: rad.lg,
    backgroundColor: colors['primary-container'],
    padding: space['space-md'],
    gap: space['space-sm'],
  },
  privacyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  privacyHeading: { ...textStyle('headline-sm'), color: colors['surface-container-lowest'], fontWeight: '700' },
  vaultBadge: {
    ...textStyle('label-sm'),
    color: colors['on-secondary'],
    backgroundColor: colors['secondary'],
    paddingHorizontal: space['space-xs'],
    paddingVertical: 2,
    borderRadius: rad.full,
    overflow: 'hidden',
    textTransform: 'uppercase',
  },
  privacyToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space['space-sm'],
    padding: space['space-sm'],
    borderRadius: rad.DEFAULT,
    backgroundColor: colors['primary'],
  },
  privacyToggleLabel: { ...textStyle('label-lg'), color: colors['surface-container-lowest'], fontWeight: '600' },
  privacyToggleBody: { ...textStyle('body-sm'), color: colors['primary-fixed-dim'] },
  fieldLabel: { ...textStyle('label-lg'), color: colors['primary'], fontWeight: '700' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space['space-xxs'], marginTop: space['space-xxs'] },
  mapPreview: {
    borderRadius: rad.lg,
    backgroundColor: colors['surface-container-low'],
    padding: space['space-sm'],
  },
  mapPhoto: { height: 120 },
  captureRow: { flexDirection: 'row', gap: space['space-xs'], marginTop: space['space-xxs'] },
  captureButton: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rad.DEFAULT,
    backgroundColor: colors['surface-container-low'],
    paddingHorizontal: space['space-xs'],
  },
  captureButtonText: { ...textStyle('label-sm'), color: colors['primary'], fontWeight: '600', textAlign: 'center' },
  saveButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rad.full,
    backgroundColor: colors['primary'],
  },
  saveButtonText: { ...textStyle('label-lg'), color: colors['on-primary'], fontWeight: '700' },
});
