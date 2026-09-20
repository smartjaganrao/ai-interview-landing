'use client';

import { usePathname } from 'next/navigation';

// Site-wide light theme rollout: every page is light except the two flagged
// as higher-risk to reskin quickly — /checkout (real payment flow) and
// /dashboard (signed-in account area). Mirrors the isHomePage/isAppPage
// route-check pattern already used in Navbar.tsx. `.home-light`'s CSS (see
// globals.css) is additive/descendant-scoped, so adding it here only
// affects pages that actually render inside this wrapper.
const DARK_PATHS = ['/checkout', '/dashboard'];

export default function ThemeScope({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDarkPage = DARK_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <div className={`bg-gradient-mesh bg-grid min-h-screen ${isDarkPage ? '' : 'home-light'}`}>
      {children}
    </div>
  );
}
