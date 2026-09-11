import * as React from 'react';
import { Platform } from 'react-native';

import { colors } from '../theme/tokens';

// D2 (Stage D) exists because focus indicators were stripped from primary
// inputs with no replacement. Every interactive element in this app already
// emits a real `role` (Chip and every Header/BottomNav/screen Pressable use
// role="button" or role="tab") or is a native <input>/<textarea> (FormField,
// Switch) — so one real `:focus-visible` rule keyed to those selectors
// reaches all of them at once, the same "fix it once" approach C4 used for
// the components themselves. A JS onFocus/onBlur flag was the alternative,
// but it can't distinguish keyboard focus from a mouse click the way the
// real CSS pseudo-class does, so it would ring on every tap too. Native
// platforms get their own OS-level focus ring for free and render nothing
// here.
const FOCUS_RING_CSS = `
[role="button"]:focus-visible,
[role="tab"]:focus-visible,
input:focus-visible,
textarea:focus-visible {
  outline: 3px solid ${colors.secondary};
  outline-offset: 2px;
}
`;

export function FocusRingStyle() {
  if (Platform.OS !== 'web') return null;
  return React.createElement('style', { id: 'focus-ring-style' }, FOCUS_RING_CSS);
}
