'use client';

import { Provider } from 'react-redux';
import { store } from '@/lib/redux-store';

// PersistGate intentionally not used: it withholds rendering `children`
// until redux-persist rehydrates from localStorage, which only exists in
// the browser. During SSR that meant every page's <body> content (hero,
// FAQ, pricing — everything under this provider) was empty in the raw HTML,
// invisible to Googlebot's fast pass and to AI search crawlers that don't
// execute JS. persistStore() in redux-store.ts still rehydrates the store
// in the background regardless of PersistGate; we just don't gate the
// initial render on it. Trade-off: returning users get one render with
// default slice state before the persisted state swaps in a few ms after
// mount.
export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
