'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  user?: User | null;
  platform?: string;
}

const CATEGORIES = [
  { id: 'feature', label: '✨ Feature Request' },
  { id: 'ux', label: '🎨 UX & Design' },
  { id: 'bug', label: '🐞 Bug Report' },
  { id: 'performance', label: '⚡ Speed & AI Quality' },
  { id: 'other', label: '💬 General Feedback' },
];

export default function FeedbackModal({ open, onClose, user, platform = 'web_landing' }: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<string>('ux');
  const [message, setMessage] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user) {
      if (user.email) setEmail(user.email);
      if (user.displayName) setName(user.displayName);
    }
  }, [user]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!message.trim()) {
      setError('Please share a few details in your feedback.');
      return;
    }

    setIsSubmitting(true);
    try {
      let idToken: string | undefined = undefined;
      if (user) {
        try {
          idToken = await user.getIdToken();
        } catch { /* proceed */ }
      }

      const payload = {
        rating,
        category,
        message: message.trim(),
        userEmail: email.trim() || user?.email || '',
        userName: name.trim() || user?.displayName || '',
        platform,
        idToken,
      };

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Client-side Firestore fallback
        if (db) {
          await addDoc(collection(db, 'feedback'), {
            rating,
            category,
            message: message.trim(),
            userEmail: email.trim() || user?.email || '',
            userName: name.trim() || user?.displayName || '',
            userId: user?.uid || null,
            platform,
            status: 'new',
            createdAt: Date.now(),
          });
        }
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setMessage('');
        onClose();
      }, 2200);
    } catch {
      // Client-side fallback if fetch fails
      try {
        if (db) {
          await addDoc(collection(db, 'feedback'), {
            rating,
            category,
            message: message.trim(),
            userEmail: email.trim() || user?.email || '',
            userName: name.trim() || user?.displayName || '',
            userId: user?.uid || null,
            platform,
            status: 'new',
            createdAt: Date.now(),
          });
          setSubmitted(true);
          setTimeout(() => {
            setSubmitted(false);
            setMessage('');
            onClose();
          }, 2200);
          return;
        }
      } catch { /* silent */ }
      setError('Could not submit feedback. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10001] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <span className="text-white font-bold text-lg">We Value Your Feedback</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="text-5xl animate-bounce">🎉</div>
            <h3 className="text-xl font-bold text-white">Thank You for Your Feedback!</h3>
            <p className="text-sm text-slate-300">Your feedback directly helps us improve JavihAI for everyone.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
                ⚠️ {error}
              </div>
            )}

            {/* Star Rating */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">How would you rate your experience?</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-2xl transition-transform hover:scale-125 focus:outline-none"
                  >
                    <span className={(hoverRating || rating) >= star ? 'text-amber-400' : 'text-slate-600'}>
                      ★
                    </span>
                  </button>
                ))}
                <span className="text-xs text-slate-400 ml-2">
                  {rating === 5 ? 'Loved it! 😍' : rating === 4 ? 'Good 😊' : rating === 3 ? 'Okay 😐' : rating === 2 ? 'Needs Work 😕' : 'Poor 😞'}
                </span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`py-2 px-3 text-xs rounded-lg font-medium border transition-all text-left truncate ${
                      category === cat.id
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Message */}
            <div>
              <label htmlFor="fb-message" className="block text-xs font-bold text-slate-300 mb-1.5">
                Your Comments &amp; Suggestions <span className="text-red-400">*</span>
              </label>
              <textarea
                id="fb-message"
                rows={4}
                required
                maxLength={2000}
                placeholder="What did you like? What can we improve?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <div className="text-right text-[11px] text-slate-500 mt-1">
                {message.length}/2000
              </div>
            </div>

            {/* User Info (if not logged in) */}
            {!user && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label htmlFor="fb-email" className="block text-xs text-slate-400 mb-1">Your Email (optional)</label>
                  <input
                    id="fb-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="fb-name" className="block text-xs text-slate-400 mb-1">Your Name (optional)</label>
                  <input
                    id="fb-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2.5 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting…' : 'Submit Feedback ✨'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
