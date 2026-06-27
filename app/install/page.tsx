import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
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

const kbd = 'px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 text-xs font-mono';

export default async function InstallPage() {
  const { version: VERSION, publishedAt } = await getLatestRelease();
  const isNewRelease = !!publishedAt && Date.now() - new Date(publishedAt).getTime() < 14 * 86400000;
  return (
    <>
      <Navbar />

      <section className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="badge">💻 Installation Guide</div>
            {isNewRelease && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                🎉 New: {VERSION}
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Install JavihAI</h1>
          <p className="text-slate-400 mb-8">
            Get the desktop app running in about 2 minutes. Pick your operating system below — {VERSION}.
          </p>

          {/* Download buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-12">
            <a href="/api/download/win" className="btn btn-primary btn-lg flex-1 text-center">⬇ Download for Windows</a>
            <a href="/api/download/mac" className="btn btn-primary btn-lg flex-1 text-center">⬇ Download for Mac</a>
          </div>

          <div className="prose-content space-y-12 text-slate-300 leading-relaxed">

            {/* System requirements */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">System requirements</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong className="text-white">Windows</strong>: Windows 10 or 11 (64-bit).</li>
                <li><strong className="text-white">macOS</strong>: macOS 12 or later (Apple Silicon and Intel — universal build).</li>
                <li><strong className="text-white">Internet</strong>: required — answers are generated in the cloud.</li>
                <li><strong className="text-white">Account</strong>: a free JavihAI account (sign in inside the app).</li>
              </ul>
            </section>

            {/* Windows */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🪟</span> Windows 10 / 11
              </h2>
              <ol className="space-y-4">
                <Step n={1}>
                  Click <strong className="text-white">Download for Windows</strong> above and run the
                  downloaded <code className="text-indigo-300">JavihAI-{VERSION}-portable-win-x64.exe</code>.
                </Step>
                <Step n={2}>
                  If Windows shows a blue <span className="text-slate-200">&quot;Windows protected your PC&quot;</span> box,
                  click <strong className="text-white">More info → Run anyway</strong>.
                  <span className="block text-sm text-slate-500 mt-1">It&apos;s safe — the app simply isn&apos;t code-signed yet, so SmartScreen warns on first run.</span>
                </Step>
                <Step n={3}>
                  The overlay opens near the top of your screen. Press <kbd className={kbd}>Alt</kbd> + <kbd className={kbd}>H</kbd> to
                  show or hide it any time.
                </Step>
                <Step n={4}>
                  <strong className="text-white">Sign in</strong> with the same account you use on this website.
                </Step>
                <Step n={5}>
                  When you start a session, click <strong className="text-white">Allow</strong> on the microphone permission prompt.
                </Step>
              </ol>
            </section>

            {/* macOS */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🍎</span> macOS
              </h2>
              <ol className="space-y-4">
                <Step n={1}>
                  Click <strong className="text-white">Download for Mac</strong> above, open the
                  downloaded <code className="text-indigo-300">.dmg</code>, and drag <strong className="text-white">JavihAI</strong> into
                  your <strong className="text-white">Applications</strong> folder.
                </Step>
                <Step n={2}>
                  In Applications, <strong className="text-white">right-click JavihAI → Open → Open</strong>.
                  <span className="block text-sm text-slate-500 mt-1">Needed only the first time — the app isn&apos;t notarized yet, so a normal double-click is blocked.</span>
                </Step>
                <Step n={3}>
                  Still blocked? Open <strong className="text-white">System Settings → Privacy &amp; Security</strong>,
                  scroll down, and click <strong className="text-white">Open Anyway</strong>.
                </Step>
                <Step n={4}>
                  Grant <strong className="text-white">Screen Recording</strong> permission when asked
                  (System Settings → Privacy &amp; Security → Screen Recording).
                  <span className="block text-sm text-slate-500 mt-1">Required to capture the interviewer&apos;s voice from your meeting app and to use Screen Analysis. Quit and reopen JavihAI after granting it.</span>
                </Step>
                <Step n={5}>
                  <strong className="text-white">Sign in</strong>, then press <kbd className={kbd}>⌥ Option</kbd> + <kbd className={kbd}>H</kbd> to
                  show or hide the overlay.
                </Step>
              </ol>
            </section>

            {/* Audio setup */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Set up your audio</h2>
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
                <strong className="text-white">macOS note:</strong> System audio needs the <strong className="text-white">Screen Recording</strong> permission
                from step 4 above. If System audio stays silent on your build, switch to <strong className="text-white">Mic</strong>,
                or install a virtual audio device (e.g. BlackHole) to route meeting audio for capture.
              </div>
            </section>

            {/* First answer */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Your first answer in 3 steps</h2>
              <ol className="space-y-4">
                <Step n={1}>Join your interview call (Meet, Zoom, or Teams) and open JavihAI.</Step>
                <Step n={2}>Leave the audio source on <strong className="text-white">System</strong> (the default).</Step>
                <Step n={3}>Click <strong className="text-white">Start</strong>. Questions get answered automatically. Prefer to speak the question yourself? Switch to <strong className="text-white">Mic</strong>.</Step>
              </ol>
            </section>

            {/* Staying hidden */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Staying invisible</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>The overlay is excluded from screen sharing and never appears in the taskbar or Alt+Tab / App Switcher.</li>
                <li>When <strong className="text-white">you</strong> share your whole screen, the overlay hides itself automatically. Press <kbd className={kbd}>Alt</kbd>/<kbd className={kbd}>⌥</kbd> + <kbd className={kbd}>Shift</kbd> + <kbd className={kbd}>S</kbd> to bring it back (still hidden from the people you&apos;re sharing with).</li>
                <li>Toggle visibility any time with <kbd className={kbd}>Alt</kbd>/<kbd className={kbd}>⌥</kbd> + <kbd className={kbd}>H</kbd>.</li>
              </ul>
            </section>

            {/* Troubleshooting */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Troubleshooting</h2>
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
                  <h3 className="font-semibold text-white">&quot;Please update&quot; message</h3>
                  <p className="text-sm text-slate-400">You&apos;re on an older version. Download the latest build from the buttons above and reinstall — your settings and account are preserved.</p>
                </div>
              </div>
            </section>

            {/* Updating */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Updating</h2>
              <p>
                Windows builds update automatically when a new version is available. On macOS, download the
                latest <code className="text-indigo-300">.dmg</code> from the buttons above and replace the app in Applications.
                You can always find every release on{' '}
                <a href="https://github.com/smartjaganrao/ai-interview-helper/releases" target="_blank" rel="noopener" className="text-indigo-300 hover:underline">GitHub Releases</a>.
              </p>
            </section>

            {/* Help */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Need help?</h2>
              <p>
                Stuck on a step? Email <a href="mailto:support@javihai.in" className="text-indigo-300 hover:underline">support@javihai.in</a> and
                we&apos;ll get you sorted.
              </p>
            </section>

          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
