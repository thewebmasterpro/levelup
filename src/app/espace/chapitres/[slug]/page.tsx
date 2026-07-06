"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PostFeed from "@/components/PostFeed";

type Chapter = {
  id: string;
  name: string;
  description: string | null;
};

export default function ChapitrePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const supabase = createClient();
  const [me, setMe] = useState<string | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setMe(user.id);
    const { data: ch } = await supabase
      .from("chapters")
      .select("id, name, description")
      .eq("slug", slug)
      .single();
    setChapter(ch as Chapter | null);
    if (ch) {
      const { data: m } = await supabase
        .from("chapter_members")
        .select("chapter_id")
        .eq("chapter_id", ch.id)
        .eq("profile_id", user.id)
        .maybeSingle();
      setIsMember(!!m);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function join() {
    if (!me || !chapter) return;
    await supabase
      .from("chapter_members")
      .insert({ chapter_id: chapter.id, profile_id: me });
    setIsMember(true);
  }

  if (loading)
    return <p className="py-8 text-center text-sm text-zinc-500">Chargement…</p>;

  if (!chapter)
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        Chapitre introuvable.{" "}
        <Link href="/espace/chapitres" className="text-amber-400 hover:underline">
          Retour aux chapitres
        </Link>
      </p>
    );

  return (
    <div>
      <Link
        href="/espace/chapitres"
        className="text-xs text-zinc-400 hover:text-zinc-200"
      >
        ← Tous les chapitres
      </Link>
      <div className="mb-4 mt-2 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{chapter.name}</h1>
          {chapter.description && (
            <p className="mt-1 text-sm text-zinc-400">{chapter.description}</p>
          )}
        </div>
        {!isMember && (
          <button
            onClick={join}
            className="shrink-0 rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-amber-300"
          >
            Rejoindre
          </button>
        )}
      </div>
      <PostFeed
        chapterId={chapter.id}
        canPost={isMember}
        cantPostHint="Rejoignez ce chapitre pour y publier."
      />
    </div>
  );
}
