import type { TabRoute } from '../components';

// The four tab destinations plus the two screens reached by drilling in from
// them. Not a router — this scaffold is one state machine in App.tsx, matched
// to what actually exists today: five ported screens, no deep linking yet.
export type Screen = TabRoute | 'destination-detail' | 'new-private-gem';

export type NavigateFn = (screen: Screen) => void;

export type SavedGem = {
  id: string;
  name: string;
  meta: string;
};
