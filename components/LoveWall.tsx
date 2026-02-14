'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const emojiOptions = ['💗', '💘', '💝', '🌹', '✨'];
const colorOptions = [
  { label: 'Rose', value: 'rose', className: 'bg-rose-500' },
  { label: 'Pink', value: 'pink', className: 'bg-pink-500' },
  { label: 'Red', value: 'red', className: 'bg-red-500' },
  { label: 'Coral', value: 'coral', className: 'bg-orange-400' },
  { label: 'Lilac', value: 'lilac', className: 'bg-fuchsia-400' }
];

const colorStyles: Record<string, string> = colorOptions.reduce((acc, option) => {
  acc[option.value] = option.className;
  return acc;
}, {} as Record<string, string>);

const cardColorStyles: Record<string, string> = {
  rose: 'bg-rose-50/80 border-rose-100/80 dark:bg-rose-500/10 dark:border-rose-400/20',
  pink: 'bg-pink-50/80 border-pink-100/80 dark:bg-pink-500/10 dark:border-pink-400/20',
  red: 'bg-red-50/80 border-red-100/80 dark:bg-red-500/10 dark:border-red-400/20',
  coral: 'bg-orange-50/80 border-orange-100/80 dark:bg-orange-500/10 dark:border-orange-400/20',
  lilac: 'bg-fuchsia-50/80 border-fuchsia-100/80 dark:bg-fuchsia-500/10 dark:border-fuchsia-400/20'
};

type LoveNote = {
  id: string;
  name: string;
  message: string;
  emoji: string;
  color: string;
  created_at: string;
};

const maxNameLength = 36;
const maxMessageLength = 240;

export default function LoveWall() {
  const [notes, setNotes] = useState<LoveNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [emoji, setEmoji] = useState(emojiOptions[0]);
  const [color, setColor] = useState(colorOptions[0].value);
  const [recentId, setRecentId] = useState<string | null>(null);
  const recentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const remaining = useMemo(() => maxMessageLength - message.length, [message]);

  useEffect(() => {
    let active = true;
    const loadNotes = async () => {
      try {
        const response = await fetch('/api/love-wall', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Unable to load the love wall.');
        }
        const payload = await response.json();
        if (active) {
          setNotes(payload.data ?? []);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Something went wrong.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadNotes();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recentTimerRef.current) {
        clearTimeout(recentTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedMessage) {
      setError('Add a name and a message to share.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/love-wall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          message: trimmedMessage,
          emoji,
          color
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'Unable to post your note.');
      }

      const payload = await response.json();
      setNotes(current => [payload.data, ...current]);
      setRecentId(payload.data.id);
      if (recentTimerRef.current) {
        clearTimeout(recentTimerRef.current);
      }
      recentTimerRef.current = setTimeout(() => setRecentId(null), 1800);
      setName('');
      setMessage('');
      setEmoji(emojiOptions[0]);
      setColor(colorOptions[0].value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="love-wall"
      className="relative overflow-hidden bg-gradient-to-b from-rose-50 via-pink-50 to-white px-6 py-24 text-zinc-900 dark:from-[#1a0b14] dark:via-[#14080f] dark:to-black dark:text-zinc-50"
    >
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-1/2 top-[-6rem] h-48 w-[32rem] -translate-x-1/2 rounded-full bg-rose-200 blur-[120px] dark:bg-rose-500/30" />
        <div className="absolute right-[-6rem] top-20 h-40 w-56 rotate-12 rounded-[60%] bg-pink-200 blur-[100px] dark:bg-pink-500/20" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16">
        <div className="flex flex-col gap-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-rose-500/80 dark:text-rose-300/80">
            Digital Love Wall
          </p>
          <h2 className="text-balance text-3xl font-semibold sm:text-4xl">
            Leave a note. Lift the room.
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-base text-zinc-600 dark:text-zinc-300">
            Share a short message and watch the wall fill with sweet moments. Everything posts
            instantly, so keep it kind.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr),minmax(0,1.1fr)]">
          <form
            id="love-note-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 rounded-[2rem] border border-white/60 bg-white/80 p-8 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.4)] backdrop-blur dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
                Your name
              </label>
              <input
                value={name}
                onChange={event => setName(event.target.value)}
                maxLength={maxNameLength}
                placeholder="You or a nickname"
                className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-200/70 dark:border-white/10 dark:bg-white/10 dark:text-white dark:focus:border-rose-400/60"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
                Message
              </label>
              <textarea
                value={message}
                onChange={event => setMessage(event.target.value)}
                maxLength={maxMessageLength}
                placeholder="Write something sweet..."
                rows={5}
                className="resize-none rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-200/70 dark:border-white/10 dark:bg-white/10 dark:text-white dark:focus:border-rose-400/60"
                required
              />
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>{remaining} characters left</span>
                <span>Keep it cozy.</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr,1fr]">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
                  Emoji
                </label>
                <div className="flex flex-wrap gap-2">
                  {emojiOptions.map(option => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => setEmoji(option)}
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-lg transition ${
                        emoji === option
                          ? 'border-rose-300 bg-rose-50 shadow-sm dark:border-rose-400/60 dark:bg-rose-500/20'
                          : 'border-zinc-200 bg-white/70 hover:border-rose-200 dark:border-white/10 dark:bg-white/5 dark:hover:border-rose-400/40'
                      }`}
                      aria-pressed={emoji === option}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
                  Card color
                </label>
                <div className="flex flex-wrap gap-3">
                  {colorOptions.map(option => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => setColor(option.value)}
                      className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                        color === option.value
                          ? 'border-rose-300 bg-white shadow-sm dark:border-rose-400/70 dark:bg-white/10'
                          : 'border-zinc-200 bg-white/80 hover:border-rose-200 dark:border-white/10 dark:bg-white/5 dark:hover:border-rose-400/40'
                      }`}
                      aria-pressed={color === option.value}
                    >
                      <span className={`h-5 w-5 rounded-full ${option.className}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {submitting ? 'Sending...' : 'Post your note'}
            </button>
          </form>

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              <span>Live wall</span>
              <span className="text-xs tracking-[0.2em]">
                {loading ? 'Loading...' : `${notes.length} notes`}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {loading ? (
                <div className="col-span-full rounded-[2rem] border border-dashed border-zinc-300 bg-white/60 p-8 text-center text-sm text-zinc-500 dark:border-white/20 dark:bg-white/5 dark:text-zinc-300">
                  Gathering the love notes...
                </div>
              ) : notes.length === 0 ? (
                <div className="col-span-full rounded-[2rem] border border-dashed border-zinc-300 bg-white/60 p-8 text-center text-sm text-zinc-500 dark:border-white/20 dark:bg-white/5 dark:text-zinc-300">
                  Be the first to add a message.
                </div>
              ) : (
                notes.map(note => (
                  <article
                    key={note.id}
                    className={`flex h-full flex-col gap-3 rounded-[2rem] border border-white/60 p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] ${
                      cardColorStyles[note.color] ?? 'bg-white/80 dark:bg-white/5'
                    } ${note.id === recentId ? 'love-note-enter' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl text-lg text-white ${
                          colorStyles[note.color] ?? 'bg-rose-500'
                        }`}
                      >
                        {note.emoji}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {note.name}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {new Date(note.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                      {note.message}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
