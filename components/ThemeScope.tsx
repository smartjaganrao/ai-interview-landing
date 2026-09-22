'use client';

import { usePathname } from 'next/navigation';

// Site-wide theme rollout: every page gets the dark sci-fi "HUD" theme
// (`.home-hud` in globals.css) except the two flagged as higher-risk to
// reskin quickly — /checkout (real payment flow) and /dashboard (signed-in
// account area), which keep the app's plain dark theme for now. Mirrors the
// isHomePage/isAppPage route-check pattern already used in Navbar.tsx.
// `.home-light`/`.home-hud`'s CSS (see globals.css) is additive/descendant-
// scoped, so adding it here only affects pages that actually render inside
// this wrapper. `.home-light` is kept alongside `.home-hud` (not removed)
// since `.home-hud`'s selectors mirror `.home-light`'s at equal specificity
// and win by being declared later in the file — removing `.home-light`
// isn't necessary and would be a bigger, riskier edit for no visual change.
const DARK_PATHS = ['/checkout', '/dashboard'];

export default function ThemeScope({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDarkPage = DARK_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <div className={`bg-gradient-mesh bg-grid min-h-screen ${isDarkPage ? '' : 'home-light home-hud'}`}>
      {children}
    </div>
  );
}
