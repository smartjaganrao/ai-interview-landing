import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.svg" alt="JavihAI" className="h-10 w-10 object-contain" />
              <div>
                <div className="font-bold text-lg text-white">JavihAI</div>
                <div className="text-xs text-slate-400 -mt-1">Master Every Question</div>
              </div>
            </div>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              The most advanced AI-powered interview prep platform. Get instant feedback,
              practice with real questions, and land your dream job.
            </p>
            <div className="flex gap-3 mt-6">
              {[
                { icon: '𝕏', href: 'https://x.com/Javih_ai', label: 'Twitter / X' },
                { icon: '💼', href: 'https://www.linkedin.com/in/javih-ai/', label: 'LinkedIn' },
                { icon: '📸', href: 'https://www.instagram.com/javih.ai/', label: 'Instagram' },
                { icon: '▶️', href: 'https://www.youtube.com/@javih_ai', label: 'YouTube' },
                { icon: '💬', href: 'mailto:support@javihai.in', label: 'Email' },
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  aria-label={s.label}
                  target={s.href.startsWith('http') ? '_blank' : undefined}
                  rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="w-10 h-10 rounded-lg glass flex items-center justify-center text-lg hover:scale-110 transition-bounce"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/#features" className="text-slate-400 hover:text-white transition">Features</Link></li>
              <li><Link href="/pricing" className="text-slate-400 hover:text-white transition">Pricing</Link></li>
              <li><Link href="/mock-interview" className="text-slate-400 hover:text-white transition">Mock Interview</Link></li>
              <li><Link href="/resume" className="text-slate-400 hover:text-white transition">Resume Builder</Link></li>
              <li><Link href="/jobs" className="text-slate-400 hover:text-white transition">Job Recommendations</Link></li>
              <li><a href="https://github.com/smartjaganrao/ai-interview-helper/releases" target="_blank" rel="noopener" className="text-slate-400 hover:text-white transition">Download App</a></li>
              <li><Link href="/install" className="text-slate-400 hover:text-white transition">Installation Guide</Link></li>
              <li><Link href="/#faq" className="text-slate-400 hover:text-white transition">FAQ</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/compare" className="text-slate-400 hover:text-white transition">Compare</Link></li>
              <li><Link href="/creator" className="text-slate-400 hover:text-white transition">Creator Program 💸</Link></li>
              <li><Link href="/compare/chiku-ai" className="text-slate-400 hover:text-white transition">vs Chiku AI</Link></li>
              <li><Link href="/compare/final-round-ai" className="text-slate-400 hover:text-white transition">vs Final Round AI</Link></li>
              <li><Link href="/privacy" className="text-slate-400 hover:text-white transition">Privacy</Link></li>
              <li><Link href="/terms" className="text-slate-400 hover:text-white transition">Terms</Link></li>
              <li><Link href="/refund" className="text-slate-400 hover:text-white transition">Refund Policy</Link></li>
              <li><a href="mailto:support@javihai.in" className="text-slate-400 hover:text-white transition">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            © 2026 JavihAI. All rights reserved.
          </p>
          <p className="text-sm text-slate-400">
            Made with 💜 for interview success
          </p>
        </div>
      </div>
    </footer>
  );
}
