// Illustrated mockup of the browser's own download-block prompt — the step
// that happens BEFORE Windows SmartScreen, when Chrome/Edge flag the
// unsigned .exe as unusual and require an explicit "Keep" to save it at
// all. Exact wording/styling drifts across browser versions, so this is
// deliberately labeled as illustrative rather than a literal screenshot.
export default function BrowserKeepFileGraphic() {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-slate-950">
      <svg viewBox="0 0 640 210" className="w-full h-auto block" role="img" aria-label="Illustration of a browser download-blocked prompt with the Keep option highlighted">
        {/* Browser chrome edge */}
        <rect x="0" y="0" width="640" height="18" fill="#dfe1e5" />
        <circle cx="14" cy="9" r="4" fill="#f28b82" />
        <circle cx="28" cy="9" r="4" fill="#fdd663" />
        <circle cx="42" cy="9" r="4" fill="#81c995" />

        {/* Download shelf bar */}
        <rect x="0" y="18" width="640" height="60" fill="#f1f3f4" />
        <line x1="0" y1="78" x2="640" y2="78" stroke="#dadce0" strokeWidth="1" />

        {/* File icon with warning badge */}
        <rect x="20" y="34" width="30" height="30" rx="4" fill="#ffffff" stroke="#dadce0" strokeWidth="1.5" />
        <text x="35" y="55" textAnchor="middle" fontSize="10" fontWeight="700" fill="#5f6368" fontFamily="system-ui, sans-serif">.exe</text>
        <circle cx="46" cy="38" r="8" fill="#ea4335" />
        <text x="46" y="42" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">!</text>

        {/* Filename + warning text */}
        <text x="64" y="46" fontSize="13" fill="#202124" fontFamily="system-ui, sans-serif">JavihAI-v1.13.13-portable-win-x64.exe</text>
        <text x="64" y="62" fontSize="11" fill="#d93025" fontFamily="system-ui, sans-serif">This file isn&apos;t commonly downloaded and could be unsafe</text>

        {/* Chevron button */}
        <rect x="590" y="30" width="34" height="34" rx="6" fill="#e8eaed" />
        <path d="M600 42 L607 49 L614 42" stroke="#5f6368" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Callout 1 → chevron */}
        <circle cx="607" cy="100" r="12" fill="#8B2BE2" />
        <text x="607" y="105" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">1</text>
        <path d="M607 88 L607 66" stroke="#8B2BE2" strokeWidth="2" markerEnd="url(#arrow)" />

        {/* Dropdown menu */}
        <rect x="460" y="90" width="170" height="96" rx="8" fill="#ffffff" stroke="#dadce0" strokeWidth="1.5" />
        <rect x="468" y="98" width="154" height="30" rx="6" fill="#e8f0fe" />
        <text x="483" y="118" fontSize="13" fontWeight="700" fill="#1a73e8" fontFamily="system-ui, sans-serif">Keep</text>
        <text x="483" y="152" fontSize="13" fill="#5f6368" fontFamily="system-ui, sans-serif">Delete</text>
        <line x1="468" y1="166" x2="622" y2="166" stroke="#e8eaed" strokeWidth="1" />
        <text x="483" y="180" fontSize="10" fill="#80868b" fontFamily="system-ui, sans-serif">Learn more</text>

        {/* Callout 2 → Keep */}
        <circle cx="440" cy="113" r="12" fill="#8B2BE2" />
        <text x="440" y="118" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">2</text>
        <path d="M452 113 L458 113" stroke="#8B2BE2" strokeWidth="2" markerEnd="url(#arrow)" />

        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#8B2BE2" />
          </marker>
        </defs>
      </svg>
      <div className="px-4 py-3 bg-slate-950 border-t border-white/5">
        <p className="text-xs text-slate-500">
          <strong className="text-slate-300">1.</strong> Click the small arrow (⌄) next to the blocked download.{' '}
          <strong className="text-slate-300">2.</strong> Click <strong className="text-white">Keep</strong>.
          Illustrative — exact wording varies by browser, but the arrow-menu-with-Keep pattern is the same in Chrome and Edge.
        </p>
      </div>
    </div>
  );
}
