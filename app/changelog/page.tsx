import type { ReactNode } from 'react';
import Footer from '@/components/Footer';
import { getAllReleases } from '@/lib/github-release';

export const metadata = {
  title: 'Changelog — JavihAI',
  description: "What's new in each JavihAI desktop release.",
};

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Inline "**bold**" only — the one piece of inline markdown our release
// notes actually use.
function renderInline(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="text-white">{part}</strong> : part
  );
}

// Renders our own `gh release create --notes` markdown (just "## " headings
// and "- " bullets — the only two things we ever write) without pulling in a
// markdown library for this narrow, self-authored input.
function renderNotes(notes: string) {
  const lines = notes.split('\n').map((l) => l.trim()).filter(Boolean);
  const blocks: { type: 'heading' | 'bullet' | 'text'; text: string }[] = [];
  for (const line of lines) {
    if (line.startsWith('## ')) blocks.push({ type: 'heading', text: line.slice(3) });
    else if (line.startsWith('- ')) blocks.push({ type: 'bullet', text: line.slice(2) });
    else blocks.push({ type: 'text', text: line });
  }

  const elements: ReactNode[] = [];
  let bulletBuffer: string[] = [];
  const flushBullets = (key: string) => {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <ul key={key} className="space-y-1.5 list-disc list-inside">
        {bulletBuffer.map((b, i) => <li key={i}>{renderInline(b)}</li>)}
      </ul>
    );
    bulletBuffer = [];
  };

  blocks.forEach((b, i) => {
    if (b.type === 'bullet') {
      bulletBuffer.push(b.text);
      return;
    }
    flushBullets(`ul-${i}`);
    if (b.type === 'heading') {
      elements.push(<h3 key={i} className="text-sm font-bold text-slate-400 uppercase tracking-wide mt-4 mb-1">{b.text}</h3>);
    } else {
      elements.push(<p key={i}>{renderInline(b.text)}</p>);
    }
  });
  flushBullets('ul-end');

  return elements;
}

export default async function ChangelogPage() {
  const releases = await getAllReleases();

  return (
    <>
      <section className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="badge mb-4">🚀 Changelog</div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">What&apos;s new</h1>
          <p className="text-slate-400 mb-12">
            Every JavihAI desktop release, in order.{' '}
            <a href="/dashboard" className="text-indigo-400 hover:text-indigo-300">Update from the dashboard</a>.
          </p>

          {releases.length === 0 ? (
            <p className="text-slate-400">Couldn&apos;t load the changelog right now — try again shortly.</p>
          ) : (
            <div className="space-y-10">
              {releases.map((r) => (
                <div key={r.version} className="border-l-2 border-slate-700 pl-6">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-white">{r.version}</h2>
                    <span className="text-sm text-slate-500">{formatDate(r.publishedAt)}</span>
                  </div>
                  <div className="text-slate-300 leading-relaxed space-y-2">
                    {r.notes ? renderNotes(r.notes) : <p className="text-slate-500">No notes for this release.</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
