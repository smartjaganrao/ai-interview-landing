'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';

interface Job {
  id:          string;
  title:       string;
  company:     string;
  location:    string;
  salary?:     string;
  type?:       string;
  skills?:     string[];
  postedAt?:   string;
  applyUrl:    string;
  description: string;
}

const LOCATIONS = ['All India', 'Bangalore', 'Mumbai', 'Gurgaon / Delhi NCR', 'Hyderabad', 'Pune', 'Chennai', 'Remote'];
const ROLES     = ['', 'Software Engineer', 'Frontend Engineer', 'Backend Engineer', 'Full Stack', 'ML Engineer', 'DevOps', 'Data Engineer', 'React Native'];

const jobBoardSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'JavihAI Job Recommendations',
  description: 'Top tech jobs in India curated for JavihAI users. Practice for any of these with your AI coach.',
  url: 'https://www.javihai.in/jobs',
};

export default function JobsPage() {
  const router = useRouter();

  const [jobs,    setJobs]    = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState('');
  const [loc,     setLoc]     = useState('');
  const [saved,   setSaved]   = useState<Set<string>>(new Set());

  const fetchJobs = useCallback(async (q: string, l: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (l && l !== 'All India') params.set('location', l);
      const res  = await fetch(`/api/jobs?${params}`);
      const data = await res.json() as { jobs: Job[] };
      setJobs(data.jobs ?? []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs('', ''); }, [fetchJobs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(query, loc);
  };

  const toggleSave = (id: string) => {
    setSaved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobBoardSchema) }}
      />

      <div className="pt-24 pb-20 max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="badge mb-3">💼 Jobs</div>
          <h1 className="text-4xl font-black mb-2">
            Job <span className="text-gradient">Recommendations</span>
          </h1>
          <p className="text-slate-400">Top tech jobs in India — curated for JavihAI users. Practice for any of these with your AI coach.</p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="Role, skill, or company (e.g. React, Flipkart)"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <select
              className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              value={loc}
              onChange={e => setLoc(e.target.value)}
            >
              {LOCATIONS.map(l => <option key={l} value={l === 'All India' ? '' : l}>{l}</option>)}
            </select>
            <button type="submit" className="btn btn-primary px-6 whitespace-nowrap">Search</button>
          </div>

          {/* Quick role filters */}
          <div className="flex gap-2 flex-wrap mt-3">
            {ROLES.filter(Boolean).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => { setQuery(r); fetchJobs(r, loc); }}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${
                  query === r
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </form>

        {/* Saved count */}
        {saved.size > 0 && (
          <div className="mb-4 text-xs text-indigo-400">
            ⭐ {saved.size} job{saved.size > 1 ? 's' : ''} saved — open JavihAI desktop app and practice for them
          </div>
        )}

        {/* Job list */}
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-700 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            No jobs found. Try a different role or location.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {jobs.map(job => (
              <div key={job.id} className="card card-glow hover:border-indigo-500/30 transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-white font-semibold text-sm group-hover:text-indigo-300 transition-colors">{job.title}</h3>
                    <p className="text-indigo-400 text-xs font-medium mt-0.5">{job.company}</p>
                  </div>
                  <button
                    onClick={() => toggleSave(job.id)}
                    className={`text-lg transition-transform hover:scale-110 ${saved.has(job.id) ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-400'}`}
                    title={saved.has(job.id) ? 'Unsave' : 'Save'}
                  >
                    {saved.has(job.id) ? '⭐' : '☆'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-slate-400 mb-3">
                  <span>📍 {job.location}</span>
                  {job.salary   && <span>💰 {job.salary}</span>}
                  {job.type     && <span>⏱ {job.type}</span>}
                  {job.postedAt && <span>🕐 {job.postedAt}</span>}
                </div>

                <p className="text-slate-400 text-xs mb-3 line-clamp-2">{job.description}</p>

                {job.skills && job.skills.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mb-4">
                    {job.skills.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-300">{s}</span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary text-xs px-4 py-1.5 flex-1 text-center"
                  >
                    Apply →
                  </a>
                  <button
                    onClick={() => router.push(`/?practice=${encodeURIComponent(job.title + ' at ' + job.company)}`)}
                    className="btn btn-secondary text-xs px-4 py-1.5"
                    title="Practice for this role in JavihAI"
                  >
                    🎯 Practice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tip banner */}
        <div className="mt-10 card border-indigo-500/20 bg-indigo-500/5">
          <div className="flex gap-4 items-start">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-white text-sm font-semibold mb-1">Pro tip: Practice before you apply</p>
              <p className="text-slate-400 text-xs">Download JavihAI desktop app → open a mock interview → paste the JD → practice answering with real-time AI feedback. Most users report 3× more confidence after 2 sessions.</p>
              <a href="/dashboard" className="text-indigo-400 text-xs mt-2 inline-block hover:text-indigo-300">Go to dashboard → download app</a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
