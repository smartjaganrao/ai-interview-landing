import Link from 'next/link';
import Footer from '@/components/Footer';
import InstallDownloadButtons from '@/components/InstallDownloadButtons';
import BrowserKeepFileGraphic from '@/components/BrowserKeepFileGraphic';
import { getLatestRelease } from '@/lib/github-release';

export const metadata = {
  title: { absolute: 'Installation Guide — JavihAI' },
  description: 'Step-by-step instructions to download, install, and set up the JavihAI desktop app on Windows and macOS.',
};

// Re-fetched from GitHub at most every 10 minutes (see lib/github-release.ts)
// so this page always names the actual latest release, no manual bump needed.
export const revalidate = 600;

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/20 text-[#4F46E5] font-bold text-sm flex items-center justify-center">
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
      <summary className="flex items-center justify-between cursor-pointer list-none font-bold text-[#1A1512]">
        {title}
        <span className="text-[#78716C] transition-transform duration-200 group-open:rotate-180">▾</span>
      </summary>
      <div className="mt-4 pt-4 border-t border-[rgba(26,21,18,0.1)] text-[#57534E] leading-relaxed">
        {children}
      </div>
    </details>
  );
}

const kbd = 'px-1.5 py-0.5 rounded bg-[rgba(26,21,18,0.08)] text-[#1A1512] text-xs font-mono';

export default async function InstallPage() {
  const { version: VERSION, publishedAt, macUrl, winUrl, winPortableUrl } = await getLatestRelease();
  const isNewRelease = !!publishedAt && Date.now() - new Date(publishedAt).getTime() < 14 * 86400000;
  const downloadsReady = Boolean(macUrl || winUrl);
  return (
    <>

      <section className="pt-12 sm:pt-16 md:pt-20 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="badge">💻 Installation Guide</div>
            {isNewRelease && VERSION && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-[#0F766E] border border-emerald-500/25">
                🎉 New: {VERSION}
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Install JavihAI</h1>
          <p className="text-[#57534E] mb-6">
            Get the desktop app running in about 2 minutes{VERSION ? ` — ${VERSION}` : ''}.
          </p>

          {/* Download buttons */}
          {downloadsReady ? (
            <InstallDownloadButtons winReady={!!winUrl} macReady={!!macUrl} winPortableReady={!!winPortableUrl} />
          ) : (
            <div className="mb-4 p-4 rounded-lg bg-[rgba(26,21,18,0.04)] border border-[rgba(26,21,18,0.1)] text-center">
              <p className="text-[#57534E]">Downloads are being prepared for the latest release — check back shortly.</p>
            </div>
          )}

          {/* ==================== QUICK START ==================== */}
          <div className="card card-glow mb-8 mt-6">
            <div className="badge text-xs mb-3">⚡ Quick start</div>
            <ol className="space-y-4">
              <Step n={1}>
                <strong className="text-[#1A1512]">Run the file you downloaded.</strong>{' '}
                You may see up to two prompts along the way — your browser might ask you to <strong className="text-[#1A1512]">Keep</strong>{' '}
                the download, and Windows or macOS will show a one-time security prompt. Both are expected for a brand-new
                app, not a threat. Click <strong className="text-[#1A1512]">Run anyway</strong> (Windows) or{' '}
                <strong className="text-[#1A1512]">Open</strong> (Mac).
                Exact wording and screenshots are in the OS-specific sections below.
              </Step>
              <Step n={2}>
                <strong className="text-[#1A1512]">Sign in with Google</strong> — same account you use on this site.
              </Step>
              <Step n={3}>
                <strong className="text-[#1A1512]">Grant mic and screen permissions</strong>{' '}when the app asks for them.
              </Step>
              <Step n={4}>
                <strong className="text-[#1A1512]">Join your interview call</strong>, press <strong className="text-[#1A1512]">Start</strong>, and
                let JavihAI listen. Press <kbd className={kbd}>Alt</kbd>/<kbd className={kbd}>⌥</kbd> + <kbd className={kbd}>H</kbd>{' '}any time to show or hide the overlay.
              </Step>
            </ol>
          </div>

          {/* ==================== VIDEO GUIDES ==================== */}
          <div className="card border border-indigo-500/20 bg-indigo-950/20 mb-10">
            <div className="badge text-xs mb-3">📹 Video Walkthroughs</div>
            <h2 className="text-xl font-black text-[#1A1512] mb-2">Watch Step-by-Step Installation</h2>
            <p className="text-[#57534E] text-sm mb-6">Prefer watching a video? Check out the official installation and setup guides below.</p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-[#1A1512] mb-2 flex items-center gap-2">
                  <span>🪟</span> Windows 10/11 Setup Guide
                </h3>
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-950 border border-white/10 mb-2">
                  <iframe
                    src="https://www.youtube-nocookie.com/embed/uEDFnlf1hiw"
                    title="Javih AI Windows Installation"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
                <a href="https://www.youtube.com/watch?v=uEDFnlf1hiw" target="_blank" rel="noopener noreferrer" className="text-xs text-[#0B63C7] hover:underline">
                  Watch &quot;Windows Installation&quot; on YouTube →
                </a>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#1A1512] mb-2 flex items-center gap-2">
                  <span>🍎</span> macOS Setup Guide
                </h3>
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-950 border border-white/10 mb-2">
                  <iframe
                    src="https://www.youtube-nocookie.com/embed/LvCAOrlH8zs"
                    title="Javih AI Mac Installation"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
                <a href="https://www.youtube.com/watch?v=LvCAOrlH8zs" target="_blank" rel="noopener noreferrer" className="text-xs text-[#0B63C7] hover:underline">
                  Watch &quot;Mac Installation&quot; on YouTube →
                </a>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[rgba(26,21,18,0.1)] text-center">
              <a href="https://www.youtube.com/watch?v=QeZDYWtKnsY" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-[#1A1512] hover:text-[#0B63C7]">
                <span>🚀</span> Watch the Full Javih AI Product Tutorial Video →
              </a>
            </div>
          </div>


          <div className="prose-content space-y-4 text-slate-300 leading-relaxed">

            {/* System requirements */}
            <section className="card">
              <h2 className="text-lg font-bold text-[#1A1512] mb-3">System requirements</h2>
              <ul className="space-y-1.5 text-sm list-disc list-inside">
                <li><strong className="text-[#1A1512]">Windows</strong>: Windows 10 or 11 (64-bit).</li>
                <li><strong className="text-[#1A1512]">macOS</strong>: macOS 12 or later — works on both Apple Silicon and Intel Macs.</li>
                <li><strong className="text-[#1A1512]">Internet</strong>: required — answers are generated in the cloud.</li>
                <li><strong className="text-[#1A1512]">Account</strong>: a free JavihAI account (sign in inside the app).</li>
              </ul>
            </section>

            <p className="text-sm text-[#78716C] pt-2 pb-1">Need more detail? Expand any section below.</p>

            {/* Windows */}
            <Disclosure title="🪟  Windows 10 / 11 — detailed steps">
              <ol className="space-y-4">
                <Step n={1}>
                  <strong className="text-[#1A1512]">Your browser may block the download itself</strong> — before Windows
                  even gets involved. Chrome and Edge sometimes flag a new, unsigned <code className="text-[#0B63C7]">.exe</code>{' '}
                  as unusual and won&apos;t save it until you say so.
                  <div className="mt-3">
                    <BrowserKeepFileGraphic />
                  </div>
                </Step>
                <Step n={2}>
                  Run the downloaded <code className="text-[#0B63C7]">JavihAI{VERSION ? `-${VERSION}` : ''}-win-x64-setup.exe</code>{' '}
                  and follow the setup wizard — pick an install location if you want, then click{' '}
                  <strong className="text-[#1A1512]">Install</strong>. JavihAI launches automatically once setup finishes.
                </Step>
                <Step n={3}>
                  If Windows shows a blue <span className="text-[#57534E]">&quot;Windows protected your PC&quot;</span>{' '}
                  box, click <strong className="text-[#1A1512]">More info → Run anyway</strong>.
                  <span className="block text-sm text-[#78716C] mt-1">It&apos;s safe — the app simply isn&apos;t code-signed yet, so SmartScreen warns on first run. This is normally a one-time step; you won&apos;t see it again on future launches.</span>
                </Step>
                <Step n={4}>
                  The overlay opens near the top of your screen. Press <kbd className={kbd}>Alt</kbd> + <kbd className={kbd}>H</kbd>{' '}
                  to show or hide it any time.
                </Step>
                <Step n={5}>
                  <strong className="text-[#1A1512]">Sign in</strong>{' '}with the same account you use on this website.
                </Step>
                <Step n={6}>
                  When you start a session, click <strong className="text-[#1A1512]">Allow</strong>{' '}on the microphone permission prompt.
                </Step>
              </ol>
              <p className="text-sm text-[#57534E] mt-4">
                If you installed with the setup wizard above, the app checks for updates automatically and installs
                them in the background the next time you quit — see &quot;Auto-updates&quot; below.
                Prefer a no-install file instead? A portable <code className="text-[#0B63C7]">.exe</code>{' '}
                is also available — see the link under the download buttons at the top of this page. It doesn&apos;t
                auto-update, so you&apos;d re-download it manually for future versions.
              </p>
            </Disclosure>

            {/* macOS */}
            <Disclosure title="🍎  macOS — detailed steps">
              <ol className="space-y-4">
                <Step n={1}>
                  Open the downloaded <code className="text-[#0B63C7]">.dmg</code>, and drag <strong className="text-[#1A1512]">JavihAI</strong> into
                  your <strong className="text-[#1A1512]">Applications</strong> folder.
                  <span className="block text-sm text-[#78716C] mt-1">
                    The button above downloads the build that works best for your Mac — Apple Silicon
                    (M1/M2/M3/M4) or Intel. If you&apos;re on an older Intel Mac and want to be sure,
                    use the &quot;Intel-specific link&quot; next to the Mac button above instead.
                  </span>
                </Step>
                <Step n={2}>
                  In Applications, <strong className="text-[#1A1512]">right-click JavihAI → Open → Open</strong>.
                  <span className="block text-sm text-[#78716C] mt-1">Needed only the first time — the app isn&apos;t notarized yet, so a normal double-click is blocked.</span>
                </Step>
                <Step n={3}>
                  Still blocked? Open <strong className="text-[#1A1512]">System Settings → Privacy &amp; Security</strong>,{' '}
                  scroll down, and click <strong className="text-[#1A1512]">Open Anyway</strong>.
                </Step>
                <Step n={4}>
                  Grant <strong className="text-[#1A1512]">Screen Recording</strong>{' '}
                  permission when asked (System Settings → Privacy &amp; Security → Screen Recording).
                  <span className="block text-sm text-[#78716C] mt-1">Required to capture the interviewer&apos;s voice from your meeting app and to use Screen Analysis. Quit and reopen JavihAI after granting it.</span>
                </Step>
                <Step n={5}>
                  <strong className="text-[#1A1512]">Sign in</strong>, then press <kbd className={kbd}>⌥ Option</kbd> + <kbd className={kbd}>H</kbd>{' '}
                  to show or hide the overlay.
                </Step>
              </ol>
              <p className="text-sm text-[#57534E] mt-4">
                The app checks for updates automatically. When a new version is available, it downloads in the background and installs the next time you quit — no manual redownload needed.
              </p>
            </Disclosure>

            {/* Audio setup */}
            <Disclosure title="🎙️  Set up your audio">
              <p className="mb-3">JavihAI can listen two ways — switch between them with the <strong className="text-[#1A1512]">Mic / System</strong> toggle in the toolbar:</p>
              <ul className="space-y-3 list-disc list-inside">
                <li>
                  <strong className="text-[#1A1512]">System audio</strong> (recommended) — captures the interviewer&apos;s
                  voice directly from Google Meet, Zoom, or Teams, and answers automatically as questions are asked.
                  Works with speakers, Bluetooth, and wired headphones.
                </li>
                <li>
                  <strong className="text-[#1A1512]">Mic</strong> — you speak the question out loud; JavihAI detects when
                  you finish and answers. Use this if System audio isn&apos;t available.
                </li>
              </ul>
              <div className="mt-4 p-4 rounded-lg bg-indigo-500/8 border border-indigo-500/25 text-sm">
                <strong className="text-[#1A1512]">macOS note:</strong> System audio needs the <strong className="text-[#1A1512]">Screen Recording</strong>{' '}
                permission from the macOS steps above. If System audio stays silent on your build, switch to <strong className="text-[#1A1512]">Mic</strong>,
                or install a virtual audio device (e.g. BlackHole) to route meeting audio for capture.
              </div>
            </Disclosure>

            {/* Staying hidden */}
            <Disclosure title="🕶️  Staying invisible">
              <ul className="space-y-2 list-disc list-inside">
                <li>The overlay is excluded from screen sharing and never appears in the taskbar or Alt+Tab / App Switcher.</li>
                <li>When <strong className="text-[#1A1512]">you</strong> share your whole screen, the overlay hides itself automatically. Press <kbd className={kbd}>Alt</kbd>/<kbd className={kbd}>⌥</kbd> + <kbd className={kbd}>Shift</kbd> + <kbd className={kbd}>S</kbd> to bring it back (still hidden from the people you&apos;re sharing with).</li>
                <li>Toggle visibility any time with <kbd className={kbd}>Alt</kbd>/<kbd className={kbd}>⌥</kbd> + <kbd className={kbd}>H</kbd>.</li>
                <li>JavihAI itself never shows up in your menu bar (Mac) or system tray (Windows) — but other apps you have running still can. Before you start, glance at it and hide anything you don&apos;t want visible. On Mac: <strong className="text-[#1A1512]">System Settings → Control Center → Menu Bar</strong>.</li>
              </ul>
            </Disclosure>

            {/* Auto-updates (merged "How auto-update works" + "Updating") */}
            <Disclosure title="🔄  Auto-updates">
              <p className="mb-3">
                JavihAI checks for new versions automatically when you launch the app.
              </p>
              <p className="mb-2">On both macOS and Windows, once an update is found:</p>
              <ol className="space-y-2 list-decimal list-inside mb-4">
                <li>The new version downloads in the background — you can keep working.</li>
                <li>A small badge appears in the toolbar showing the download progress.</li>
                <li>Once downloaded, the update is ready. It installs the next time you quit the app.</li>
                <li>On your next launch, you&apos;re running the latest version.</li>
              </ol>
              <p className="text-sm text-[#57534E]">
                <strong className="text-[#1A1512]">On Windows</strong>, this needs the installer version (the main
                download button above). If you&apos;re on the portable <code className="text-[#0B63C7]">.exe</code>{' '}
                instead, there&apos;s no in-app auto-update — check back here and re-download manually when a new
                version is out.
              </p>
              <p className="mt-3 text-sm text-[#57534E]">
                You don&apos;t need to revisit this page for updates — the app handles it, or points you back to
                the download buttons above.
              </p>
            </Disclosure>

            {/* Troubleshooting */}
            <Disclosure title="🛠️  Troubleshooting">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-[#1A1512]">It can&apos;t hear the interviewer</h3>
                  <p className="text-sm text-[#57534E]">Make sure you&apos;re on <strong className="text-[#1A1512]">System</strong> mode (not Mic). On macOS, confirm Screen Recording permission is granted, then quit and reopen the app. If you&apos;re wearing headphones in Mic mode, switch to System — the mic can&apos;t hear audio that&apos;s playing into your ears.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1512]">No answers appear</h3>
                  <p className="text-sm text-[#57534E]">Check your internet connection — answers are generated in the cloud. Free accounts also have a daily answer limit; upgrade for more.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1512]">The window disappeared</h3>
                  <p className="text-sm text-[#57534E]">If you started sharing your full screen, the overlay auto-hides. Press <kbd className={kbd}>Alt</kbd>/<kbd className={kbd}>⌥</kbd> + <kbd className={kbd}>Shift</kbd> + <kbd className={kbd}>S</kbd> to restore it, or <kbd className={kbd}>Alt</kbd>/<kbd className={kbd}>⌥</kbd> + <kbd className={kbd}>H</kbd> to toggle.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1512]">&quot;An update is available but it won&apos;t install&quot;</h3>
                  <p className="text-sm text-[#57534E]">The update downloads automatically but only installs when you quit the app — close JavihAI completely and reopen it. If the problem persists, download the latest version manually from the buttons above and run it — your settings and account are preserved.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between gap-3 text-xs">
                  <div className="text-[#0F766E]">
                    <strong>🎧 Test your audio setup right now:</strong> Run our interactive in-browser mic &amp; speaker check to ensure your audio levels and permissions are 100% call-ready.
                  </div>
                  <Link
                    href="/dashboard?audiocheck=1"
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-colors"
                  >
                    Run Mic Check &rarr;
                  </Link>
                </div>
              </div>
            </Disclosure>

            {/* Help */}
            <section className="card text-center">
              <h2 className="text-lg font-bold text-[#1A1512] mb-2">Still stuck?</h2>
              <p className="text-sm">
                Email <a href="mailto:javihaiofficial@gmail.com" className="text-[#0B63C7] hover:underline">javihaiofficial@gmail.com</a>{' '}
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
