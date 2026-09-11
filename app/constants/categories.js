// C3: the single canonical destination / private-gem category taxonomy (§04).
//
// PRD §2.2's `destination_category` enum already covers `destinations.category`
// and `user_private_gems.category` with one shared type — the six ids below
// are that enum, unchanged. What was missing was a single set of display
// labels and icons: the two gem-entry screens each invented their own
// "vibe" list instead of reusing it, so the same spot could be filed under
// three different, non-overlapping taxonomies depending on which form was
// used. Every category-driven picker or badge must derive its options from
// this list — scripts/check-category-taxonomy.js fails if a screen defines
// its own instead.
const DESTINATION_CATEGORIES = [
  { id: 'WINERY_BREWERY', label: 'Wine & Craft Breweries', icon: 'wine_bar' },
  { id: 'NATURE_WATERFALLS', label: 'Waterfalls & Gorges', icon: 'waterfall_chart' },
  { id: 'CULTURAL_HISTORIC', label: 'Historic & Arts', icon: 'museum' },
  { id: 'DINING_MARKETS', label: 'Dining & Markets', icon: 'storefront' },
  { id: 'LIVE_VENUE', label: 'Live Music & Venues', icon: 'music_note' },
  { id: 'CIVIC_LANDMARK', label: 'City Gems', icon: 'account_balance' },
];

module.exports = { DESTINATION_CATEGORIES };
