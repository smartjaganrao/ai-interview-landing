import Footer from '@/components/Footer';
import InstallDownloadButtons from '@/components/InstallDownloadButtons';
import BrowserKeepFileGraphic from '@/components/BrowserKeepFileGraphic';
import { getLatestRelease } from '@/lib/github-release';

export const metadata = {
  title: 'Installation Guide — JavihAI',
  description: 'Step-by-step instructions to download, install, and set up the JavihAI desktop app on Windows and macOS.',
};

// Re-fetched from GitHub at most every 10 minutes (see lib/github-release.ts)
// so this page always names the actual latest release, no manual bump needed.
export const revalidate = 600;

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-sm flex items-center justify-center">
        {n}
      </span>
      <div className="flex-1 pt-0.5">{children}</div>
    </li>
  );
}

// Native <details>/<summary> — accessible and keyboard-friendly with zero
// client JS. Tailwind's group-open: variant (3.4+) drives the chevron.
function Disclosure({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group card">
      <summary className="flex items-center justify-between cursor-pointer list-none font-bold text-white">
        {title}
        <span className="text-slate-500 transition-transform duration-200 group-open:rotate-180">▾</span>
      </summary>
      <div className="mt-4 pt-4 border-t border-white/10 text-slate-300 leading-relaxed">
        {children}
      </div>
    </details>
  );
}

const kbd = 'px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 text-xs font-mono';

export default async function InstallPage() {
  const { version: VERSION, publishedAt, macUrl, winUrl } = await getLatestRelease();
  const isNewRelease = !!publishedAt && Date.now() - new Date(publishedAt).getTime() < 14 * 86400000;
  const downloadsReady = Boolean(macUrl || winUrl);
  return (
    <>

      <section className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="badge">💻 Installation Guide</div>
            {isNewRelease && VERSION && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                🎉 New: {VERSION}
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Install JavihAI</h1>
          <p className="text-slate-400 mb-6">
            Get the desktop app running in about 2 minutes{VERSION ? ` — ${VERSION}` : ''}.
          </p>

          {/* Download buttons */}
          {downloadsReady ? (
            <InstallDownloadButtons winReady={!!winUrl} macReady={!!macUrl} />
          ) : (
            <div className="mb-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700 text-center">
              <p className="text-slate-300">Downloads are being prepared for the latest release — check back shortly.</p>
            </div>
          )}

          {/* ==================== QUICK START ==================== */}
          <div className="card card-glow mb-10 mt-6">
            <div className="badge text-xs mb-3">⚡ Quick start</div>
            <ol className="space-y-4">
              <Step n={1}>
                <strong className="text-white">Run the file you downloaded.</strong>{' '}
                You may see up to two prompts along the way — your browser might ask you to <strong className="text-white">Keep</strong>{' '}
                the download, and Windows or macOS will show a one-time security prompt. Both are expected for a brand-new
                app, not a threat. Click <strong className="text-white">Run anyway</strong> (Windows) or{' '}
                <strong className="text-white">Open</strong> (Mac).
                Exact wording and screenshots are in the OS-specific sections below.
              </Step>
              <Step n={2}>
                <strong className="text-white">Sign in with Google</strong> — same account you use on this site.
              </Step>
              <Step n={3}>
                <strong className="text-white">Grant mic and screen permissions</strong>{' '}when the app asks for them.
              </Step>
              <Step n={4}>
                <strong className="text-white">Join your interview call</strong>, press <strong className="text-white">Start</strong>, and
                let JavihAI listen. Press <kbd className={kbd}>Alt</kbd>/<kbd className={kbd}>⌥</kbd> + <kbd className={kbd}>H</kbd>{' '}any time to show or hide the overlay.
              </Step>
            </ol>
          </div>

          <div className="prose-content space-y-4 text-slate-300 leading-relaxed">

            {/* System requirements */}
            <section className="card">
              <h2 className="text-lg font-bold text-white mb-3">System requirements</h2>
              <ul className="space-y-1.5 text-sm list-disc list-inside">
                <li><strong className="text-white">Windows</strong>: Windows 10 or 11 (64-bit).</li>
                <li><strong className="text-white">macOS</strong>: macOS 12 or later — works on both Apple Silicon and Intel Macs.</li>
                <li><strong className="text-white">Internet</strong>: required — answers are generated in the cloud.</li>
                <li><strong className="text-white">Account</strong>: a free JavihAI account (sign in inside the app).</li>
              </ul>
            </section>

            <p className="text-sm text-slate-500 pt-2 pb-1">Need more detail? Expand any section below.</p>

            {/* Windows */}
            <Disclosure title="🪟  Windows 10 / 11 — detailed steps">
              <ol className="space-y-4">
                <Step n={1}>
                  <strong className="text-white">Your browser may block the download itself</strong> — before Windows
                  even gets involved. Chrome and Edge sometimes flag a new, unsigned <code className="text-indigo-300">.exe</code>{' '}
                  as unusual and won&apos;t save it until you say so.
                  <div className="mt-3">
                    <BrowserKeepFileGraphic />
                  </div>
                </Step>
                <Step n={2}>
                  Run the downloaded <code className="text-indigo-300">JavihAI{VERSION ? `-${VERSION}` : ''}-portable-win-x64.exe</code>.
                </Step>
                <Step n={3}>
                  If Windows shows a blue <span className="text-slate-200">&quot;Windows protected your PC&quot;</span>{' '}
                  box, click <strong className="text-white">More info → Run anyway</strong>.
                  <span className="block text-sm text-slate-500 mt-1">It&apos;s safe — the app simply isn&apos;t code-signed yet, so SmartScreen warns on first run. This is normally a one-time step; you won&apos;t see it again on future launches.</span>
                </Step>
                <Step n={4}>
                  The overlay opens near the top of your screen. Press <kbd className={kbd}>Alt</kbd> + <kbd className={kbd}>H</kbd>{' '}
                  to show or hide it any time.
                </Step>
                <Step n={5}>
                  <strong className="text-white">Sign in</strong>{' '}with the same account you use on this website.
                </Step>
                <Step n={6}>
                  When you start a session, click <strong className="text-white">Allow</strong>{' '}on the microphone permission prompt.
                </Step>
              </ol>
              <p className="text-sm text-slate-400 mt-4">
                The app checks for updates automatically and shows a badge in the toolbar when a new version is out — click it to grab the latest build. (Silent background install-on-quit is currently a macOS-only capability; see &quot;Auto-updates&quot; below.)
              </p>
            </Disclosure>

            {/* macOS */}
            <Disclosure title="🍎  macOS — detailed steps">
              <ol className="space-y-4">
                <Step n={1}>
                  Open the downloaded <code className="text-indigo-300">.dmg</code>, and drag <strong className="text-white">JavihAI</strong> into
                  your <strong className="text-white">Applications</strong> folder.
                  <span className="block text-sm text-slate-500 mt-1">
                    The button above downloads the build that works best for your Mac — Apple Silicon
                    (M1/M2/M3/M4) or Intel. If you&apos;re on an older Intel Mac and want to be sure,{' '}
                    <a href="/api/download/mac?arch=x64" className="text-indigo-300 hover:underline">use the Intel-specific link</a>{' '}instead.
                  </span>
                </Step>
                <Step n={2}>
                  In Applications, <strong className="text-white">right-click JavihAI → Open → Open</strong>.
                  <span className="block text-sm text-slate-500 mt-1">Needed only the first time — the app isn&apos;t notarized yet, so a normal double-click is blocked.</span>
                </Step>
                <Step n={3}>
                  Still blocked? Open <strong className="text-white">System Settings → Privacy &amp; Security</strong>,{' '}
                  scroll down, and click <strong className="text-white">Open Anyway</strong>.
                </Step>
                <Step n={4}>
                  Grant <strong className="text-white">Screen Recording</strong>{' '}
                  permission when asked (System Settings → Privacy &amp; Security → Screen Recording).
                  <span className="block text-sm text-slate-500 mt-1">Required to capture the interviewer&apos;s voice from your meeting app and to use Screen Analysis. Quit and reopen JavihAI after granting it.</span>
                </Step>
                <Step n={5}>
                  <strong className="text-white">Sign in</strong>, then press <kbd className={kbd}>⌥ Option</kbd> + <kbd className={kbd}>H</kbd>{' '}
                  to show or hide the overlay.
                </Step>
              </ol>
              <p className="text-sm text-slate-400 mt-4">
                The app checks for updates automatically. When a new version is available, it downloads in the background and installs the next time you quit — no manual redownload needed.
              </p>
            </Disclosure>

            {/* Audio setup */}
            <Disclosure title="🎙️  Set up your audio">
              <p className="mb-3">JavihAI can listen two ways — switch between them with the <strong className="text-white">Mic / System</strong> toggle in the toolbar:</p>
              <ul className="space-y-3 list-disc list-inside">
                <li>
                  <strong className="text-white">System audio</strong> (recommended) — captures the interviewer&apos;s
                  voice directly from Google Meet, Zoom, or Teams, and answers automatically as questions are asked.
                  Works with speakers, Bluetooth, and wired headphones.
                </li>
                <li>
                  <strong className="text-white">Mic</strong> — you speak the question out loud; JavihAI detects when
                  you finish and answers. Use this if System audio isn&apos;t available.
                </li>
              </ul>
              <div className="mt-4 p-4 rounded-lg bg-indigo-500/8 border border-indigo-500/25 text-sm">
                <strong className="text-white">macOS note:</strong> System audio needs the <strong className="text-white">Screen Recording</strong>{' '}
                permission from the macOS steps above. If System audio stays silent on your build, switch to <strong className="text-white">Mic</strong>,
                or install a virtual audio device (e.g. BlackHole) to route meeting audio for capture.
              </div>
            </Disclosure>

            {/* Staying hidden */}
            <Disclosure title="🕶️  Staying invisible">
              <ul className="space-y-2 list-disc list-inside">
                <li>The overlay is excluded from screen sharing and never appears in the taskbar or Alt+Tab / App Switcher.</li>
                <li>When <strong className="text-white">you</strong> share your whole screen, the overlay hides itself automatically. Press <kbd className={kbd}>Alt</kbd>/<kbd className={kbd}>⌥</kbd> + <kbd className={kbd}>Shift</kbd> + <kbd className={kbd}>S</kbd> to bring it back (still hidden from the people you&apos;re sharing with).</li>
                <li>Toggle visibility any time with <kbd className={kbd}>Alt</kbd>/<kbd className={kbd}>⌥</kbd> + <kbd className={kbd}>H</kbd>.</li>
              </ul>
            </Disclosure>

            {/* Auto-updates (merged "How auto-update works" + "Updating") */}
            <Disclosure title="🔄  Auto-updates">
              <p className="mb-3">
                JavihAI checks for new versions automatically when you launch the app.
              </p>
              <p className="mb-2"><strong className="text-white">On macOS</strong>, once an update is found:</p>
              <ol className="space-y-2 list-decimal list-inside mb-4">
                <li>The new version downloads in the background — you can keep working.</li>
                <li>A small badge appears in the toolbar showing the download progress.</li>
                <li>Once downloaded, the update is ready. It installs the next time you quit the app.</li>
                <li>On your next launch, you&apos;re running the latest version.</li>
              </ol>
              <p className="text-sm text-slate-400">
                <strong className="text-white">On Windows</strong>, the toolbar badge tells you a new version is
                out — click it to download the latest portable build and run it in place of the old one. Silent
                background install-on-quit isn&apos;t available for the portable build yet.
              </p>
              <p className="mt-3 text-sm text-slate-400">
                You don&apos;t need to revisit this page for updates — the app handles it, or points you back to
                the download buttons above.
              </p>
            </Disclosure>

            {/* Troubleshooting */}
            <Disclosure title="🛠️  Troubleshooting">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white">It can&apos;t hear the interviewer</h3>
                  <p className="text-sm text-slate-400">Make sure you&apos;re on <strong className="text-slate-200">System</strong> mode (not Mic). On macOS, confirm Screen Recording permission is granted, then quit and reopen the app. If you&apos;re wearing headphones in Mic mode, switch to System — the mic can&apos;t hear audio that&apos;s playing into your ears.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white">No answers appear</h3>
                  <p className="text-sm text-slate-400">Check your internet connection — answers are generated in the cloud. Free accounts also have a daily answer limit; upgrade for more.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white">The window disappeared</h3>
                  <p className="text-sm text-slate-400">If you started sharing your full screen, the overlay auto-hides. Press <kbd className={kbd}>Alt</kbd>/<kbd className={kbd}>⌥</kbd> + <kbd className={kbd}>Shift</kbd> + <kbd className={kbd}>S</kbd> to restore it, or <kbd className={kbd}>Alt</kbd>/<kbd className={kbd}>⌥</kbd> + <kbd className={kbd}>H</kbd> to toggle.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white">&quot;An update is available but it won&apos;t install&quot;</h3>
                  <p className="text-sm text-slate-400">On macOS, the update downloads automatically but only installs when you quit the app — close JavihAI completely and reopen it. On Windows, clicking the update badge downloads the latest portable build; run it in place of the old one. If the problem persists on either platform, download the latest version manually from the buttons above — your settings and account are preserved.</p>
                </div>
              </div>
            </Disclosure>

            {/* Help */}
            <section className="card text-center">
              <h2 className="text-lg font-bold text-white mb-2">Still stuck?</h2>
              <p className="text-sm">
                Email <a href="mailto:support@javihai.in" className="text-indigo-300 hover:underline">support@javihai.in</a>{' '}
                and we&apos;ll get you sorted — usually within a few hours.
              </p>
            </section>

          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
