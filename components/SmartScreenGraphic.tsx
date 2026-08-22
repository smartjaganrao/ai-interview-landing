// Illustrated mockup of the Windows SmartScreen "protected your PC" dialog —
// appears when running an unsigned .exe for the first time. Illustrative,
// not a literal screenshot (exact wording drifts across Windows builds).
export default function SmartScreenGraphic() {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-slate-950">
      <svg viewBox="0 0 460 270" className="w-full h-auto block" role="img" aria-label="Illustration of the Windows SmartScreen dialog with Run anyway highlighted">
        {/* Dialog window */}
        <rect x="10" y="10" width="440" height="250" rx="8" fill="#f3f3f3" stroke="#d2d2d2" />
        {/* Title bar */}
        <rect x="10" y="10" width="440" height="30" rx="8" fill="#0f6cbd" />
        <rect x="10" y="30" width="440" height="10" fill="#0f6cbd" />
        <circle cx="30" cy="25" r="9" fill="#ffffff" />
        <path d="M25 25 l3 3 l7 -7" stroke="#0f6cbd" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x="48" y="30" fontSize="13" fontWeight="700" fill="#ffffff" fontFamily="system-ui, sans-serif">Windows protected your PC</text>
        <text x="422" y="30" fontSize="14" fill="#ffffff" fontFamily="system-ui, sans-serif" textAnchor="middle">✕</text>

        {/* Body text */}
        <text x="30" y="70" fontSize="12" fill="#323130" fontFamily="system-ui, sans-serif">Microsoft Defender SmartScreen prevented an unrecognized app</text>
        <text x="30" y="88" fontSize="12" fill="#323130" fontFamily="system-ui, sans-serif">from starting. Running this app might put your PC at risk.</text>

        <text x="30" y="118" fontSize="12" fill="#0f6cbd" textDecoration="underline" fontFamily="system-ui, sans-serif">More info</text>

        {/* App info block (revealed after clicking More info) */}
        <rect x="30" y="136" width="400" height="52" rx="4" fill="#ffffff" stroke="#e1e1e1" />
        <text x="42" y="156" fontSize="11" fill="#605e5c" fontFamily="system-ui, sans-serif">App: JavihAI-v1.13.13-portable-win-x64.exe</text>
        <text x="42" y="174" fontSize="11" fill="#605e5c" fontFamily="system-ui, sans-serif">Publisher: Unknown publisher</text>

        {/* Buttons */}
        <rect x="290" y="212" width="140" height="32" rx="4" fill="#0f6cbd" />
        <text x="360" y="233" textAnchor="middle" fontSize="12" fontWeight="700" fill="#ffffff" fontFamily="system-ui, sans-serif">Run anyway</text>
        <rect x="140" y="212" width="130" height="32" rx="4" fill="#ffffff" stroke="#8a8886" />
        <text x="205" y="233" textAnchor="middle" fontSize="12" fill="#323130" fontFamily="system-ui, sans-serif">Don&apos;t run</text>

        {/* Callout 1 → More info */}
        <circle cx="100" cy="118" r="11" fill="#8B2BE2" />
        <text x="100" y="122" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">1</text>

        {/* Callout 2 → Run anyway */}
        <circle cx="360" cy="196" r="11" fill="#8B2BE2" />
        <text x="360" y="200" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">2</text>
        <path d="M360 207 L360 212" stroke="#8B2BE2" strokeWidth="2" markerEnd="url(#ssarrow)" />

        <defs>
          <marker id="ssarrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#8B2BE2" />
          </marker>
        </defs>
      </svg>
      <div className="px-4 py-3 bg-slate-950 border-t border-white/5">
        <p className="text-xs text-slate-500">
          <strong className="text-slate-300">1.</strong> Click <strong className="text-white">More info</strong>.{' '}
          <strong className="text-slate-300">2.</strong> Click <strong className="text-white">Run anyway</strong>.
          Illustrative — Microsoft&apos;s exact wording varies by Windows version.
        </p>
      </div>
    </div>
  );
}
