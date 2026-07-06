"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Chapter = {
  id: string;
  type: "thematic" | "region" | "sector";
  slug: string;
  name: string;
  description: string | null;
};

const groups: { type: Chapter["type"]; title: string }[] = [
  { type: "thematic", title: "Espaces thématiques" },
  { type: "region", title: "Chapitres régionaux" },
  { type: "sector", title: "Chapitres sectoriels" },
];

export default function ChapitresPage() {
  const supabase = createClient();
  const [me, setMe] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [memberOf, setMemberOf] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setMe(user.id);
    const [{ data: chaps }, { data: memberships }] = await Promise.all([
      supabase
        .from("chapters")
        .select("id, type, slug, name, description")
        .order("name"),
      supabase
        .from("chapter_members")
        .select("chapter_id")
        .eq("profile_id", user.id),
    ]);
    setChapters((chaps as Chapter[]) ?? []);
    setMemberOf(new Set((memberships ?? []).map((m) => m.chapter_id)));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggle(ch: Chapter) {
    if (!me) return;
    if (memberOf.has(ch.id)) {
      await supabase
        .from("chapter_members")
        .delete()
        .eq("chapter_id", ch.id)
        .eq("profile_id", me);
    } else {
      await supabase
        .from("chapter_members")
        .insert({ chapter_id: ch.id, profile_id: me });
    }
    load();
  }

  if (loading)
    return <p className="py-8 text-center text-sm text-zinc-500">Chargement…</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">Chapitres</h1>
      {groups.map((g) => {
        const list = chapters.filter((c) => c.type === g.type);
        if (list.length === 0) return null;
        return (
          <section key={g.type}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-400">
              {g.title}
            </h2>
            <div className="space-y-2">
              {list.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
                >
                  <Link href={`/espace/chapitres/${c.slug}`} className="min-w-0">
                    <p className="font-semibold">{c.name}</p>
                    {c.description && (
                      <p className="truncate text-xs text-zinc-400">
                        {c.description}
                      </p>
                    )}
                  </Link>
                  <button
                    onClick={() => toggle(c)}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                      memberOf.has(c.id)
                        ? "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
                        : "bg-amber-400 text-zinc-950 hover:bg-amber-300"
                    }`}
                  >
                    {memberOf.has(c.id) ? "Membre ✓" : "Rejoindre"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
