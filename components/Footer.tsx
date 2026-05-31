import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-lg">
                AI
              </div>
              <div>
                <div className="font-bold text-lg text-white">Interview AI</div>
                <div className="text-xs text-slate-400 -mt-1">Master Every Question</div>
              </div>
            </div>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              The most advanced AI-powered interview prep platform. Get instant feedback,
              practice with real questions, and land your dream job.
            </p>
            <div className="flex gap-3 mt-6">
              {['🐦', '💼', '📘', '📷'].map((icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-lg glass flex items-center justify-center text-lg hover:scale-110 transition-bounce"
                >
                  {icon}
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
              <li><a href="https://github.com/smartjaganrao/ai-interview-helper/releases" target="_blank" rel="noopener" className="text-slate-400 hover:text-white transition">Download</a></li>
              <li><Link href="/#faq" className="text-slate-400 hover:text-white transition">FAQ</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/privacy" className="text-slate-400 hover:text-white transition">Privacy</Link></li>
              <li><Link href="/terms" className="text-slate-400 hover:text-white transition">Terms</Link></li>
              <li><a href="mailto:support@aiinterview.com" className="text-slate-400 hover:text-white transition">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            © 2026 AI Interview Helper. All rights reserved.
          </p>
          <p className="text-sm text-slate-400">
            Made with 💜 for interview success
          </p>
        </div>
      </div>
    </footer>
  );
}
