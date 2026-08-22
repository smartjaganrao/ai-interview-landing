// Illustrated mockup of the macOS Gatekeeper flow — right-click → Open →
// confirm Open, needed the first time because the app isn't notarized yet.
// Illustrative, not a literal screenshot (exact wording drifts by macOS version).
export default function MacGatekeeperGraphic() {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-slate-950">
      <svg viewBox="0 0 500 240" className="w-full h-auto block" role="img" aria-label="Illustration of the macOS right-click Open flow with the confirm dialog's Open button highlighted">
        {/* Finder-ish backdrop */}
        <rect x="10" y="10" width="200" height="220" rx="8" fill="#e9e9eb" stroke="#d2d2d4" />
        <rect x="10" y="10" width="200" height="28" rx="8" fill="#f6f6f7" />
        <circle cx="24" cy="24" r="4" fill="#ff5f57" />
        <circle cx="36" cy="24" r="4" fill="#febc2e" />
        <circle cx="48" cy="24" r="4" fill="#28c840" />

        {/* App icon */}
        <rect x="70" y="60" width="60" height="60" rx="14" fill="url(#appgrad)" />
        <text x="100" y="98" textAnchor="middle" fontSize="20" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">J</text>
        <text x="100" y="135" textAnchor="middle" fontSize="11" fill="#1d1d1f" fontFamily="system-ui, sans-serif">JavihAI</text>

        {/* Context menu */}
        <rect x="150" y="76" width="150" height="128" rx="8" fill="#ffffff" stroke="#d2d2d4" />
        <rect x="158" y="84" width="134" height="24" rx="4" fill="#0a84ff" />
        <text x="170" y="100" fontSize="12" fontWeight="700" fill="#ffffff" fontFamily="system-ui, sans-serif">Open</text>
        <text x="170" y="128" fontSize="11" fill="#1d1d1f" fontFamily="system-ui, sans-serif">Get Info</text>
        <text x="170" y="150" fontSize="11" fill="#1d1d1f" fontFamily="system-ui, sans-serif">Rename</text>
        <text x="170" y="172" fontSize="11" fill="#1d1d1f" fontFamily="system-ui, sans-serif">Move to Trash</text>
        <line x1="158" y1="184" x2="284" y2="184" stroke="#e5e5e7" strokeWidth="1" />
        <text x="170" y="198" fontSize="11" fill="#1d1d1f" fontFamily="system-ui, sans-serif">Compress</text>

        {/* Callout 1 → Open in context menu */}
        <circle cx="315" cy="96" r="11" fill="#8B2BE2" />
        <text x="315" y="100" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">1</text>
        <path d="M303 96 L294 96" stroke="#8B2BE2" strokeWidth="2" markerEnd="url(#gkarrow)" />

        {/* Confirm dialog */}
        <rect x="230" y="10" width="260" height="110" rx="8" fill="#f6f6f7" stroke="#d2d2d4" />
        <text x="250" y="36" fontSize="12" fontWeight="700" fill="#1d1d1f" fontFamily="system-ui, sans-serif">&quot;JavihAI&quot; can&apos;t be opened because</text>
        <text x="250" y="52" fontSize="12" fontWeight="700" fill="#1d1d1f" fontFamily="system-ui, sans-serif">Apple cannot check it for malicious</text>
        <text x="250" y="68" fontSize="12" fontWeight="700" fill="#1d1d1f" fontFamily="system-ui, sans-serif">software.</text>
        <rect x="250" y="82" width="60" height="26" rx="5" fill="#ffffff" stroke="#c7c7c9" />
        <text x="280" y="99" textAnchor="middle" fontSize="11" fill="#1d1d1f" fontFamily="system-ui, sans-serif">Cancel</text>
        <rect x="320" y="82" width="60" height="26" rx="5" fill="#0a84ff" />
        <text x="350" y="99" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff" fontFamily="system-ui, sans-serif">Open</text>

        {/* Callout 2 → Open in confirm dialog */}
        <circle cx="410" cy="95" r="11" fill="#8B2BE2" />
        <text x="410" y="99" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">2</text>
        <path d="M398 95 L385 95" stroke="#8B2BE2" strokeWidth="2" markerEnd="url(#gkarrow)" />

        <defs>
          <linearGradient id="appgrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1E90FF" />
            <stop offset="100%" stopColor="#8B2BE2" />
          </linearGradient>
          <marker id="gkarrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#8B2BE2" />
          </marker>
        </defs>
      </svg>
      <div className="px-4 py-3 bg-slate-950 border-t border-white/5">
        <p className="text-xs text-slate-500">
          <strong className="text-slate-300">1.</strong> Right-click JavihAI in Applications, click <strong className="text-white">Open</strong>.{' '}
          <strong className="text-slate-300">2.</strong> Click <strong className="text-white">Open</strong>{' '}
          again to confirm. First time only — Apple&apos;s exact wording varies by macOS version.
        </p>
      </div>
    </div>
  );
}
