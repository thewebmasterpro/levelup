"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";

type Hit = {
  type: "post" | "comment" | "resource" | "listing" | "course";
  title: string;
  excerpt: string;
  link: string;
  authorId: string | null;
  authorName: string | null;
  authorAvatar: string | null;
};

const typeLabels: Record<Hit["type"], string> = {
  post: "💬 Discussion",
  comment: "↳ Réponse",
  resource: "📚 Ressource",
  listing: "🤝 Annonce",
  course: "🎓 Formation",
};

export default function MemoirePage() {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.trim().length < 3) {
      setHits(null);
      return;
    }
    const t = setTimeout(search, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function search() {
    const q = query.trim();
    setSearching(true);
    const like = `%${q}%`;

    const [posts, comments, resources, listings, courses] = await Promise.all([
      supabase
        .from("posts")
        .select("id, content, author_id, author:profiles(full_name, avatar_url)")
        .textSearch("content", q, { type: "websearch", config: "french" })
        .limit(10),
      supabase
        .from("comments")
        .select("id, content, author_id, post_id, author:profiles(full_name, avatar_url)")
        .ilike("content", like)
        .limit(10),
      supabase
        .from("resources")
        .select("id, title, description, submitted_by, submitter:profiles!resources_submitted_by_fkey(full_name, avatar_url)")
        .eq("status", "approved")
        .or(`title.ilike.${like.replace(/,/g, "")},description.ilike.${like.replace(/,/g, "")}`)
        .limit(5),
      supabase
        .from("listings")
        .select("id, title, description, author_id, author:profiles(full_name, avatar_url)")
        .or(`title.ilike.${like.replace(/,/g, "")},description.ilike.${like.replace(/,/g, "")}`)
        .limit(5),
      supabase
        .from("courses")
        .select("id, title, description, trainer_id, trainer:profiles!courses_trainer_id_fkey(full_name, avatar_url)")
        .eq("status", "published")
        .or(`title.ilike.${like.replace(/,/g, "")},description.ilike.${like.replace(/,/g, "")}`)
        .limit(5),
    ]);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const results: Hit[] = [
      ...((posts.data as any[]) ?? []).map((p) => ({
        type: "post" as const,
        title: p.content.slice(0, 80),
        excerpt: p.content.slice(0, 200),
        link: "/espace",
        authorId: p.author_id,
        authorName: p.author?.full_name ?? null,
        authorAvatar: p.author?.avatar_url ?? null,
      })),
      ...((comments.data as any[]) ?? []).map((c) => ({
        type: "comment" as const,
        title: c.content.slice(0, 80),
        excerpt: c.content.slice(0, 200),
        link: "/espace",
        authorId: c.author_id,
        authorName: c.author?.full_name ?? null,
        authorAvatar: c.author?.avatar_url ?? null,
      })),
      ...((resources.data as any[]) ?? []).map((r) => ({
        type: "resource" as const,
        title: r.title,
        excerpt: r.description ?? "",
        link: "/espace/ressources",
        authorId: r.submitted_by,
        authorName: r.submitter?.full_name ?? null,
        authorAvatar: r.submitter?.avatar_url ?? null,
      })),
      ...((listings.data as any[]) ?? []).map((l) => ({
        type: "listing" as const,
        title: l.title,
        excerpt: l.description ?? "",
        link: "/espace/annonces",
        authorId: l.author_id,
        authorName: l.author?.full_name ?? null,
        authorAvatar: l.author?.avatar_url ?? null,
      })),
      ...((courses.data as any[]) ?? []).map((c) => ({
        type: "course" as const,
        title: c.title,
        excerpt: c.description ?? "",
        link: `/espace/formations/${c.id}`,
        authorId: c.trainer_id,
        authorName: c.trainer?.full_name ?? null,
        authorAvatar: c.trainer?.avatar_url ?? null,
      })),
    ];
    /* eslint-enable @typescript-eslint/no-explicit-any */

    setHits(results);
    setSearching(false);
  }

  // Membres à contacter : les auteurs les plus présents dans les résultats
  const experts = hits
    ? Object.values(
        hits.reduce(
          (acc, h) => {
            if (!h.authorId || !h.authorName) return acc;
            acc[h.authorId] = acc[h.authorId] ?? {
              id: h.authorId,
              name: h.authorName,
              avatar: h.authorAvatar,
              count: 0,
            };
            acc[h.authorId].count++;
            return acc;
          },
          {} as Record<
            string,
            { id: string; name: string; avatar: string | null; count: number }
          >
        )
      )
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
    : [];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">🧠 Mémoire du club</h1>
      <p className="text-sm text-zinc-400">
        Tout ce que la communauté a déjà partagé, au même endroit : discussions,
        réponses, ressources, annonces et formations. Cherchez avant de
        redemander — et trouvez qui contacter.
      </p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ex. TVA, statut indépendant, subsides, recrutement…"
        className="w-full rounded-full border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-amber-400"
        autoFocus
      />

      {searching && (
        <p className="text-center text-sm text-zinc-500">Recherche…</p>
      )}

      {hits && !searching && (
        <>
          {experts.length > 0 && (
            <section className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
              <h2 className="text-sm font-semibold text-amber-400">
                👥 Membres à contacter sur ce sujet
              </h2>
              <div className="mt-2 flex flex-wrap gap-3">
                {experts.map((e) => (
                  <Link
                    key={e.id}
                    href={`/espace/membres/${e.id}`}
                    className="flex items-center gap-2 rounded-full border border-zinc-700 py-1 pl-1 pr-3 text-sm hover:border-amber-400"
                  >
                    <Avatar url={e.avatar} name={e.name} size="sm" />
                    {e.name}
                    <span className="text-xs text-zinc-500">
                      ({e.count} contribution{e.count > 1 ? "s" : ""})
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {hits.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              Rien dans la mémoire du club sur ce sujet — soyez le premier à
              poser la question sur le fil !
            </p>
          ) : (
            <div className="space-y-2">
              {hits.map((h, i) => (
                <Link
                  key={i}
                  href={h.link}
                  className="block rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-amber-400/50"
                >
                  <p className="text-xs text-amber-400">{typeLabels[h.type]}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-200">
                    {h.excerpt}
                  </p>
                  {h.authorName && (
                    <p className="mt-1 text-xs text-zinc-500">
                      Par {h.authorName}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
