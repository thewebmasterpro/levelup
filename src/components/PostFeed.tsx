"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";

type Post = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author: {
    full_name: string;
    headline: string | null;
    avatar_url: string | null;
  } | null;
  chapter: { name: string; slug: string } | null;
  comments: { count: number }[];
  reactions: { profile_id: string }[];
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  author: { full_name: string } | null;
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PostCard({
  post,
  me,
  onChanged,
}: {
  post: Post;
  me: string;
  onChanged: () => void;
}) {
  const supabase = createClient();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [newComment, setNewComment] = useState("");
  const liked = post.reactions.some((r) => r.profile_id === me);
  const commentCount = post.comments[0]?.count ?? 0;

  async function toggleLike() {
    if (liked) {
      await supabase
        .from("reactions")
        .delete()
        .eq("post_id", post.id)
        .eq("profile_id", me);
    } else {
      await supabase
        .from("reactions")
        .insert({ post_id: post.id, profile_id: me });
    }
    onChanged();
  }

  async function loadComments() {
    const { data } = await supabase
      .from("comments")
      .select("id, content, created_at, author:profiles(full_name)")
      .eq("post_id", post.id)
      .order("created_at");
    setComments((data as unknown as Comment[]) ?? []);
  }

  async function toggleComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && comments === null) await loadComments();
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    await supabase
      .from("comments")
      .insert({ post_id: post.id, author_id: me, content: newComment.trim() });
    setNewComment("");
    await loadComments();
    onChanged();
  }

  async function deletePost() {
    await supabase.from("posts").delete().eq("id", post.id);
    onChanged();
  }

  async function report(targetType: "post" | "comment", targetId: string, excerpt: string) {
    const reason = window.prompt(
      "Pourquoi signalez-vous ce contenu ? (spam, propos inappropriés…)"
    );
    if (reason === null) return;
    await supabase.from("reports").insert({
      reporter_id: me,
      target_type: targetType,
      target_id: targetId,
      reason: reason || null,
      excerpt: excerpt.slice(0, 140),
    });
    window.alert("Merci, le signalement a été transmis à la modération.");
  }

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/espace/membres/${post.author_id}`}
          className="flex min-w-0 items-center gap-2.5"
        >
          <Avatar
            url={post.author?.avatar_url}
            name={post.author?.full_name ?? "?"}
            size="sm"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold hover:text-amber-400">
              {post.author?.full_name}
            </span>
            {post.author?.headline && (
              <span className="block truncate text-xs text-zinc-400">
                {post.author.headline}
              </span>
            )}
          </span>
        </Link>
        <div className="text-right text-xs text-zinc-500">
          {formatDate(post.created_at)}
          {post.chapter && (
            <span className="ml-2 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-amber-400">
              {post.chapter.name}
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
        {post.content}
      </p>

      <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1 transition ${liked ? "text-amber-400" : "hover:text-zinc-200"}`}
        >
          👍 {post.reactions.length > 0 && post.reactions.length}{" "}
          {liked ? "Aimé" : "J'aime"}
        </button>
        <button onClick={toggleComments} className="transition hover:text-zinc-200">
          💬 {commentCount > 0 && commentCount} Commenter
        </button>
        {post.author_id === me ? (
          <button
            onClick={deletePost}
            className="ml-auto text-zinc-600 transition hover:text-red-400"
          >
            Supprimer
          </button>
        ) : (
          <button
            onClick={() => report("post", post.id, post.content)}
            className="ml-auto text-zinc-600 transition hover:text-red-400"
          >
            Signaler
          </button>
        )}
      </div>

      {showComments && (
        <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
          {(comments ?? []).map((c) => (
            <div key={c.id} className="rounded-xl bg-zinc-800/60 px-3 py-2">
              <p className="text-xs font-semibold">
                {c.author?.full_name}{" "}
                <span className="font-normal text-zinc-500">
                  · {formatDate(c.created_at)}
                </span>
              </p>
              <p className="mt-0.5 text-sm text-zinc-200">{c.content}</p>
            </div>
          ))}
          <form onSubmit={addComment} className="flex gap-2 pt-1">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Votre commentaire…"
              className="min-w-0 flex-1 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="rounded-full bg-amber-400 px-4 py-1.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300"
            >
              Publier
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

export default function PostFeed({
  chapterId = null,
  canPost = true,
  cantPostHint,
}: {
  chapterId?: string | null;
  canPost?: boolean;
  cantPostHint?: string;
}) {
  const supabase = createClient();
  const [me, setMe] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    let query = supabase
      .from("posts")
      .select(
        "id, content, created_at, author_id, author:profiles(full_name, headline, avatar_url), chapter:chapters(name, slug), comments(count), reactions(profile_id)"
      )
      .order("created_at", { ascending: false })
      .limit(50);
    if (chapterId) query = query.eq("chapter_id", chapterId);
    const { data } = await query;
    setPosts((data as unknown as Post[]) ?? []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setMe(data.user?.id ?? null));
    load();
  }, [load]);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !me) return;
    setPosting(true);
    await supabase
      .from("posts")
      .insert({ author_id: me, chapter_id: chapterId, content: draft.trim() });
    setDraft("");
    setPosting(false);
    load();
  }

  return (
    <div className="space-y-4">
      {canPost ? (
        <form
          onSubmit={publish}
          className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder={
              chapterId
                ? "Partagez avec ce chapitre…"
                : "Partagez une info, une question, une victoire…"
            }
            className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={posting || !draft.trim()}
              className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300 disabled:opacity-40"
            >
              {posting ? "Publication…" : "Publier"}
            </button>
          </div>
        </form>
      ) : (
        cantPostHint && (
          <p className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-center text-sm text-zinc-400">
            {cantPostHint}
          </p>
        )
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-zinc-500">Chargement…</p>
      ) : posts.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          Aucune publication pour l&apos;instant — soyez le premier à écrire !
        </p>
      ) : (
        posts.map((p) =>
          me ? <PostCard key={p.id} post={p} me={me} onChanged={load} /> : null
        )
      )}
    </div>
  );
}
