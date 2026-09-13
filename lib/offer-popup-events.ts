// Coordinates NewCustomerOfferPopup with two independent siblings that would
// otherwise duplicate/collide with it:
//   - Navbar's OfferBanner (same "get a discount" pitch as a persistent
//     strip) — hidden while the modal is actually on screen, so a visitor
//     never sees the same offer pushed at them twice at once.
//   - LandingClient's exit-intent FreeTrialModal — must not arm its
//     listener until the popup's own async eligibility check has finished,
//     otherwise a very early exit-intent can race the check and show both
//     modals together.
const CHECKED_EVENT = 'javihai:offer-popup-checked';
const VISIBILITY_EVENT = 'javihai:offer-popup-visibility';

/** Fired exactly once, whether or not the popup ends up eligible — signals
 *  that `localStorage`'s trial-modal-suppression flag (if any) is now settled. */
export function announceOfferPopupChecked(): void {
  window.dispatchEvent(new Event(CHECKED_EVENT));
}

export function onOfferPopupChecked(handler: () => void): () => void {
  window.addEventListener(CHECKED_EVENT, handler);
  return () => window.removeEventListener(CHECKED_EVENT, handler);
}

/** Fired whenever the popup's actual on-screen visibility changes. */
export function announceOfferPopupVisibility(open: boolean): void {
  window.dispatchEvent(new CustomEvent<{ open: boolean }>(VISIBILITY_EVENT, { detail: { open } }));
}

export function onOfferPopupVisibility(handler: (open: boolean) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<{ open: boolean }>).detail.open);
  window.addEventListener(VISIBILITY_EVENT, listener);
  return () => window.removeEventListener(VISIBILITY_EVENT, listener);
}
