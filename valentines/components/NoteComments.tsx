'use client';

import { useState, useEffect } from 'react';

type Comment = {
  id: string;
  name: string;
  comment: string;
  created_at: string;
};

export default function NoteComments({ noteId, isExpanded }: { noteId: string; isExpanded: boolean }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);

  // Load comments on mount to get accurate count
  useEffect(() => {
    let active = true;
    const loadComments = async () => {
      try {
        const response = await fetch(`/api/love-wall/${noteId}/comments`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Unable to load comments.');
        }
        const payload = await response.json();
        if (active) {
          setComments(payload.data ?? []);
        }
      } catch (err) {
        if (active) {
          setCommentError(err instanceof Error ? err.message : 'Something went wrong.');
        }
      }
    };

    loadComments();
    return () => {
      active = false;
    };
  }, [noteId]);

  // Show loading state when expanding
  useEffect(() => {
    if (!showComments) return;
    setLoadingComments(false);
  }, [showComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);

    const trimmedName = commentName.trim();
    const trimmedComment = commentText.trim();

    if (!trimmedName || !trimmedComment) {
      setCommentError('Add a name and comment.');
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/love-wall/${noteId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          comment: trimmedComment
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'Unable to post comment.');
      }

      const payload = await response.json();
      setComments(current => [...current, payload.data]);
      setCommentName('');
      setCommentText('');
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="border-t border-white/30 pt-3">
      <button
        onClick={() => setShowComments(!showComments)}
        className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition"
      >
        {showComments ? '▼' : '▶'} {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
      </button>

      {showComments && (
        <div className="mt-4 space-y-3">
          {loadingComments ? (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">No comments yet. Be first!</div>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {comments.map(comment => (
                <div key={comment.id} className="text-xs bg-white/40 dark:bg-white/5 rounded-lg p-2">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{comment.name}</div>
                  <div className="text-zinc-700 dark:text-zinc-300 text-xs leading-relaxed">{comment.comment}</div>
                  <div className="text-zinc-500 dark:text-zinc-500 text-xs mt-1">
                    {new Date(comment.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmitComment} className="space-y-2 mt-3">
            <input
              type="text"
              value={commentName}
              onChange={e => setCommentName(e.target.value)}
              placeholder="Your name"
              maxLength={36}
              className="w-full text-xs rounded-lg border border-zinc-200 bg-white/60 px-2 py-1 text-zinc-900 outline-none focus:border-rose-300 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-rose-400"
            />
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Leave a reply..."
              maxLength={200}
              rows={2}
              className="w-full text-xs resize-none rounded-lg border border-zinc-200 bg-white/60 px-2 py-1 text-zinc-900 outline-none focus:border-rose-300 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-rose-400"
            />
            {commentError && (
              <div className="text-xs text-rose-600 dark:text-rose-200">{commentError}</div>
            )}
            <button
              type="submit"
              disabled={submittingComment}
              className="w-full text-xs font-semibold rounded-lg bg-zinc-900 px-2 py-1 text-white transition hover:bg-zinc-800 disabled:opacity-70 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {submittingComment ? 'Replying...' : 'Reply'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
