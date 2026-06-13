'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/* ── Types ────────────────────────────────────────────────────────────────── */
interface Experience {
  id:        string;
  title:     string;
  company:   string;
  location:  string;
  startDate: string;
  endDate:   string;
  current:   boolean;
  bullets:   string[];
}

interface Education {
  id:       string;
  degree:   string;
  school:   string;
  location: string;
  year:     string;
  gpa:      string;
}

interface Project {
  id:          string;
  name:        string;
  tech:        string;
  description: string;
  link:        string;
}

interface ResumeData {
  name:        string;
  email:       string;
  phone:       string;
  location:    string;
  linkedin:    string;
  github:      string;
  summary:     string;
  skills:      string;
  experience:  Experience[];
  education:   Education[];
  projects:    Project[];
}

const BLANK: ResumeData = {
  name: '', email: '', phone: '', location: '', linkedin: '', github: '',
  summary: '', skills: '',
  experience: [],
  education: [],
  projects: [],
};

const TEMPLATES = [
  { id: 'classic',  label: 'Classic',    free: true,  accent: '#1e40af' },
  { id: 'modern',   label: 'Modern',     free: true,  accent: '#7c3aed' },
  { id: 'minimal',  label: 'Minimal',    free: true,  accent: '#374151' },
  { id: 'bold',     label: 'Bold',       free: false, accent: '#0f766e' },
  { id: 'elegant',  label: 'Elegant',    free: false, accent: '#9f1239' },
];

function uid() { return Math.random().toString(36).slice(2, 9); }

/* ── Resume Preview ───────────────────────────────────────────────────────── */
function ResumePreview({ data, template }: { data: ResumeData; template: string }) {
  const t = TEMPLATES.find(t => t.id === template) ?? TEMPLATES[0];
  const accent = t.accent;

  return (
    <div id="resume-print" style={{
      fontFamily: template === 'modern' ? 'system-ui, sans-serif' : 'Georgia, serif',
      fontSize: '11px', lineHeight: 1.5, color: '#111', background: '#fff',
      padding: '32px 36px', minHeight: '297mm', width: '210mm', boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{
        borderBottom: template === 'minimal' ? '1px solid #e5e7eb' : `3px solid ${accent}`,
        paddingBottom: '12px', marginBottom: '16px',
      }}>
        <h1 style={{ margin: 0, fontSize: template === 'bold' ? '26px' : '22px', fontWeight: 700, color: template === 'bold' ? accent : '#111' }}>
          {data.name || 'Your Name'}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px', fontSize: '10px', color: '#555' }}>
          {data.email    && <span>{data.email}</span>}
          {data.phone    && <span>· {data.phone}</span>}
          {data.location && <span>· {data.location}</span>}
          {data.linkedin && <span>· linkedin.com/in/{data.linkedin}</span>}
          {data.github   && <span>· github.com/{data.github}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <Section title="Summary" accent={accent} template={template}>
          <p style={{ margin: 0, color: '#333' }}>{data.summary}</p>
        </Section>
      )}

      {/* Skills */}
      {data.skills && (
        <Section title="Skills" accent={accent} template={template}>
          <p style={{ margin: 0, color: '#333' }}>{data.skills}</p>
        </Section>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <Section title="Experience" accent={accent} template={template}>
          {data.experience.map(exp => (
            <div key={exp.id} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: '#111' }}>{exp.title}</strong>
                <span style={{ color: '#555', fontSize: '10px' }}>
                  {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                </span>
              </div>
              <div style={{ color: accent, fontWeight: 600, fontSize: '10px' }}>
                {exp.company}{exp.location ? ` · ${exp.location}` : ''}
              </div>
              {exp.bullets.filter(Boolean).length > 0 && (
                <ul style={{ margin: '4px 0 0 16px', padding: 0, color: '#333' }}>
                  {exp.bullets.filter(Boolean).map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <Section title="Projects" accent={accent} template={template}>
          {data.projects.map(p => (
            <div key={p.id} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{p.name}</strong>
                {p.link && <span style={{ color: accent, fontSize: '10px' }}>{p.link}</span>}
              </div>
              {p.tech && <div style={{ color: '#555', fontSize: '10px' }}>{p.tech}</div>}
              {p.description && <div style={{ color: '#333', marginTop: '2px' }}>{p.description}</div>}
            </div>
          ))}
        </Section>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <Section title="Education" accent={accent} template={template}>
          {data.education.map(edu => (
            <div key={edu.id} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{edu.degree}</strong>
                <span style={{ color: '#555', fontSize: '10px' }}>{edu.year}</span>
              </div>
              <div style={{ color: accent, fontSize: '10px' }}>
                {edu.school}{edu.location ? ` · ${edu.location}` : ''}{edu.gpa ? ` · GPA: ${edu.gpa}` : ''}
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, accent, template, children }: { title: string; accent: string; template: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <h2 style={{
        fontSize: '12px', fontWeight: 700, margin: '0 0 6px',
        color: template === 'minimal' ? '#111' : accent,
        textTransform: template === 'bold' ? 'uppercase' : 'none',
        letterSpacing: template === 'bold' ? '0.05em' : 0,
        borderBottom: template === 'elegant' ? `1px solid ${accent}` : 'none',
        paddingBottom: template === 'elegant' ? '3px' : 0,
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
export default function ResumePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ResumeData>(BLANK);
  const [template, setTemplate] = useState('classic');
  const [activeTab, setActiveTab] = useState<'basics' | 'experience' | 'education' | 'projects' | 'preview'>('basics');

  const set = (patch: Partial<ResumeData>) => setData(prev => ({ ...prev, ...patch }));

  /* Experience */
  const addExp = () => set({ experience: [...data.experience, { id: uid(), title: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: [''] }] });
  const updExp = (id: string, patch: Partial<Experience>) => set({ experience: data.experience.map(e => e.id === id ? { ...e, ...patch } : e) });
  const delExp = (id: string) => set({ experience: data.experience.filter(e => e.id !== id) });

  /* Education */
  const addEdu = () => set({ education: [...data.education, { id: uid(), degree: '', school: '', location: '', year: '', gpa: '' }] });
  const updEdu = (id: string, patch: Partial<Education>) => set({ education: data.education.map(e => e.id === id ? { ...e, ...patch } : e) });
  const delEdu = (id: string) => set({ education: data.education.filter(e => e.id !== id) });

  /* Projects */
  const addPrj = () => set({ projects: [...data.projects, { id: uid(), name: '', tech: '', description: '', link: '' }] });
  const updPrj = (id: string, patch: Partial<Project>) => set({ projects: data.projects.map(p => p.id === id ? { ...p, ...patch } : p) });
  const delPrj = (id: string) => set({ projects: data.projects.filter(p => p.id !== id) });

  const handlePrint = () => {
    window.print();
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-400 mb-4">Sign in to use the resume builder.</p>
            <button onClick={() => router.push('/auth/login')} className="btn btn-primary">Sign In</button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const inputCls = 'w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500';
  const labelCls = 'block text-xs text-slate-400 mb-1';
  const tabs: Array<{ id: typeof activeTab; label: string }> = [
    { id: 'basics',     label: 'Basics'     },
    { id: 'experience', label: 'Experience' },
    { id: 'education',  label: 'Education'  },
    { id: 'projects',   label: 'Projects'   },
    { id: 'preview',    label: '👁 Preview'  },
  ];

  return (
    <>
      {/* Print stylesheet — hides everything except the resume */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #resume-print-wrapper { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
          #resume-print-wrapper * { display: revert !important; }
        }
      `}</style>

      <Navbar />

      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4">
        {/* Page header */}
        <div className="mb-8">
          <div className="badge mb-3">📄 Resume Builder</div>
          <h1 className="text-4xl font-black mb-2">
            Build Your <span className="text-gradient">ATS-Ready Resume</span>
          </h1>
          <p className="text-slate-400">Fill in your details, pick a template, download as PDF. Free for all plans.</p>
        </div>

        {/* Template picker */}
        <div className="mb-6">
          <p className="text-xs text-slate-400 mb-2">Template</p>
          <div className="flex gap-2 flex-wrap">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => { if (t.free || true) setTemplate(t.id); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  template === t.id
                    ? 'border-indigo-500 bg-indigo-500/20 text-white'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
                style={template === t.id ? { borderColor: t.accent } : {}}
              >
                <span style={{ color: template === t.id ? t.accent : undefined }}>{t.label}</span>
                {!t.free && <span className="ml-1 text-xs text-yellow-400">Pro</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ── Left: Editor ──────────────────────────────────────────────── */}
          <div>
            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-slate-800/50 p-1 rounded-lg">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Basics ── */}
            {activeTab === 'basics' && (
              <div className="card space-y-4">
                <h3 className="text-sm font-semibold text-white">Personal Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Full Name *</label><input className={inputCls} placeholder="Rahul Sharma" value={data.name} onChange={e => set({ name: e.target.value })} /></div>
                  <div><label className={labelCls}>Email *</label><input className={inputCls} type="email" placeholder="rahul@gmail.com" value={data.email} onChange={e => set({ email: e.target.value })} /></div>
                  <div><label className={labelCls}>Phone</label><input className={inputCls} placeholder="+91 98765 43210" value={data.phone} onChange={e => set({ phone: e.target.value })} /></div>
                  <div><label className={labelCls}>Location</label><input className={inputCls} placeholder="Bangalore, India" value={data.location} onChange={e => set({ location: e.target.value })} /></div>
                  <div><label className={labelCls}>LinkedIn (username)</label><input className={inputCls} placeholder="rahul-sharma" value={data.linkedin} onChange={e => set({ linkedin: e.target.value })} /></div>
                  <div><label className={labelCls}>GitHub (username)</label><input className={inputCls} placeholder="rahulsharma" value={data.github} onChange={e => set({ github: e.target.value })} /></div>
                </div>
                <div>
                  <label className={labelCls}>Professional Summary</label>
                  <textarea className={inputCls} rows={3} placeholder="3+ years building scalable React/Node apps at product companies. Strong in system design and agile delivery." value={data.summary} onChange={e => set({ summary: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Skills (comma-separated)</label>
                  <textarea className={inputCls} rows={2} placeholder="React, Node.js, TypeScript, AWS, PostgreSQL, Redis, Docker" value={data.skills} onChange={e => set({ skills: e.target.value })} />
                </div>
              </div>
            )}

            {/* ── Experience ── */}
            {activeTab === 'experience' && (
              <div className="space-y-4">
                {data.experience.map((exp, idx) => (
                  <div key={exp.id} className="card">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-300">Experience #{idx + 1}</span>
                      <button onClick={() => delExp(exp.id)} className="text-slate-500 hover:text-red-400 text-xs">✕ Remove</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div><label className={labelCls}>Job Title</label><input className={inputCls} placeholder="Software Engineer" value={exp.title} onChange={e => updExp(exp.id, { title: e.target.value })} /></div>
                      <div><label className={labelCls}>Company</label><input className={inputCls} placeholder="Flipkart" value={exp.company} onChange={e => updExp(exp.id, { company: e.target.value })} /></div>
                      <div><label className={labelCls}>Location</label><input className={inputCls} placeholder="Bangalore" value={exp.location} onChange={e => updExp(exp.id, { location: e.target.value })} /></div>
                      <div><label className={labelCls}>Start Date</label><input className={inputCls} placeholder="Jan 2022" value={exp.startDate} onChange={e => updExp(exp.id, { startDate: e.target.value })} /></div>
                      <div>
                        <label className={labelCls}>End Date</label>
                        <input className={inputCls} placeholder="Dec 2024" value={exp.endDate} disabled={exp.current} onChange={e => updExp(exp.id, { endDate: e.target.value })} />
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                          <input type="checkbox" checked={exp.current} onChange={e => updExp(exp.id, { current: e.target.checked })} />
                          Currently working here
                        </label>
                      </div>
                    </div>
                    <label className={labelCls}>Bullet Points (one per line — start with action verbs)</label>
                    {exp.bullets.map((b, bi) => (
                      <div key={bi} className="flex gap-2 mb-2">
                        <input className={inputCls} placeholder={`Built payment retry system reducing failures by 40%`} value={b} onChange={e => { const next = [...exp.bullets]; next[bi] = e.target.value; updExp(exp.id, { bullets: next }); }} />
                        <button onClick={() => { const next = exp.bullets.filter((_, i) => i !== bi); updExp(exp.id, { bullets: next.length ? next : [''] }); }} className="text-slate-500 hover:text-red-400 text-xs px-1">✕</button>
                      </div>
                    ))}
                    <button onClick={() => updExp(exp.id, { bullets: [...exp.bullets, ''] })} className="text-indigo-400 hover:text-indigo-300 text-xs">+ Add bullet</button>
                  </div>
                ))}
                <button onClick={addExp} className="btn btn-secondary w-full">+ Add Experience</button>
              </div>
            )}

            {/* ── Education ── */}
            {activeTab === 'education' && (
              <div className="space-y-4">
                {data.education.map((edu, idx) => (
                  <div key={edu.id} className="card">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-300">Education #{idx + 1}</span>
                      <button onClick={() => delEdu(edu.id)} className="text-slate-500 hover:text-red-400 text-xs">✕ Remove</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2"><label className={labelCls}>Degree / Course</label><input className={inputCls} placeholder="B.Tech Computer Science" value={edu.degree} onChange={e => updEdu(edu.id, { degree: e.target.value })} /></div>
                      <div><label className={labelCls}>College / University</label><input className={inputCls} placeholder="IIT Bombay" value={edu.school} onChange={e => updEdu(edu.id, { school: e.target.value })} /></div>
                      <div><label className={labelCls}>Location</label><input className={inputCls} placeholder="Mumbai" value={edu.location} onChange={e => updEdu(edu.id, { location: e.target.value })} /></div>
                      <div><label className={labelCls}>Year</label><input className={inputCls} placeholder="2021" value={edu.year} onChange={e => updEdu(edu.id, { year: e.target.value })} /></div>
                      <div><label className={labelCls}>CGPA / Percentage</label><input className={inputCls} placeholder="8.5 / 10" value={edu.gpa} onChange={e => updEdu(edu.id, { gpa: e.target.value })} /></div>
                    </div>
                  </div>
                ))}
                <button onClick={addEdu} className="btn btn-secondary w-full">+ Add Education</button>
              </div>
            )}

            {/* ── Projects ── */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                {data.projects.map((prj, idx) => (
                  <div key={prj.id} className="card">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-300">Project #{idx + 1}</span>
                      <button onClick={() => delPrj(prj.id)} className="text-slate-500 hover:text-red-400 text-xs">✕ Remove</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={labelCls}>Project Name</label><input className={inputCls} placeholder="E-commerce Platform" value={prj.name} onChange={e => updPrj(prj.id, { name: e.target.value })} /></div>
                      <div><label className={labelCls}>GitHub / Live Link</label><input className={inputCls} placeholder="github.com/user/project" value={prj.link} onChange={e => updPrj(prj.id, { link: e.target.value })} /></div>
                      <div className="col-span-2"><label className={labelCls}>Tech Stack</label><input className={inputCls} placeholder="React, Node.js, MongoDB, Redis" value={prj.tech} onChange={e => updPrj(prj.id, { tech: e.target.value })} /></div>
                      <div className="col-span-2"><label className={labelCls}>Description (1–2 lines)</label><textarea className={inputCls} rows={2} placeholder="Built a full-stack e-commerce app with payment integration and real-time inventory tracking." value={prj.description} onChange={e => updPrj(prj.id, { description: e.target.value })} /></div>
                    </div>
                  </div>
                ))}
                <button onClick={addPrj} className="btn btn-secondary w-full">+ Add Project</button>
              </div>
            )}

            {/* ── Preview tab (mobile) ── */}
            {activeTab === 'preview' && (
              <div className="lg:hidden">
                <div className="card overflow-auto">
                  <div style={{ transform: 'scale(0.55)', transformOrigin: 'top left', width: '182%' }}>
                    <ResumePreview data={data} template={template} />
                  </div>
                </div>
                <button onClick={handlePrint} className="btn btn-primary w-full mt-4">⬇ Download PDF</button>
              </div>
            )}

            {/* Download button */}
            {activeTab !== 'preview' && (
              <button onClick={handlePrint} className="btn btn-primary w-full mt-4">
                ⬇ Download as PDF
              </button>
            )}
          </div>

          {/* ── Right: Live Preview (desktop) ─────────────────────────────── */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 font-medium">Live Preview</span>
                <button onClick={handlePrint} className="btn btn-primary text-xs px-4 py-1.5">⬇ Download PDF</button>
              </div>
              <div className="border border-slate-700 rounded-xl overflow-auto bg-white" style={{ maxHeight: '80vh' }}>
                <div style={{ transform: 'scale(0.65)', transformOrigin: 'top left', width: '154%' }}>
                  <div id="resume-print-wrapper">
                    <ResumePreview data={data} template={template} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ATS Tips */}
        <div className="mt-10 card">
          <h3 className="text-sm font-semibold text-white mb-3">✅ ATS Tips for Indian Job Market</h3>
          <div className="grid md:grid-cols-3 gap-3 text-xs text-slate-400">
            <div>• Use exact keywords from the job description</div>
            <div>• No tables, columns, headers, or footers in the file</div>
            <div>• Quantify achievements (%, ₹, users, ms)</div>
            <div>• List skills as plain text, not icons or ratings</div>
            <div>• Include CGPA if 7.5+ (most Indian JDs ask)</div>
            <div>• One page for &lt;5 YOE, two pages max for senior</div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
