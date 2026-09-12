import * as React from 'react';
import { StyleSheet, Text } from 'react-native';

type AnnounceFn = (message: string) => void;

const AnnounceContext = React.createContext<AnnounceFn>(() => {});

export function useAnnounce(): AnnounceFn {
  return React.useContext(AnnounceContext);
}

// D3 (Stage D) exists because save/bookmark/error toasts were silent to
// screen readers — a sighted user saw confirmation, everyone else got
// nothing. One `aria-live="polite"` region, mounted once here (alongside
// FocusRingStyle in App.tsx), is how every screen announces status from now
// on — not a live region sprinkled per screen. `aria-live` is a real RN prop
// (maps to `accessibilityLiveRegion` on native, the DOM attribute on web),
// the same cross-platform pattern Chip/Photo already use for aria-pressed
// and aria-label.
export function LiveRegionProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = React.useState('');

  return (
    <AnnounceContext.Provider value={setMessage}>
      {children}
      <Text aria-live="polite" style={styles.hidden}>
        {message}
      </Text>
    </AnnounceContext.Provider>
  );
}

const styles = StyleSheet.create({
  // Visually hidden, not display:none — a removed-from-layout live region
  // still needs to be present in the accessibility tree before its text
  // changes for assistive tech to announce the change at all.
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },
});
