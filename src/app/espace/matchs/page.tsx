"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensureDm } from "@/lib/dm";
import Avatar from "@/components/Avatar";

type MatchProfile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  city: string | null;
};

type Match = {
  id: string;
  week_start: string;
  member_a: string;
  member_b: string;
  a_action: string;
  b_action: string;
  profile_a: MatchProfile | null;
  profile_b: MatchProfile | null;
};

export default function MatchsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [me, setMe] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setMe(user.id);
    const { data } = await supabase
      .from("weekly_matches")
      .select(
        "id, week_start, member_a, member_b, a_action, b_action, profile_a:profiles!weekly_matches_member_a_fkey(id, full_name, avatar_url, headline, city), profile_b:profiles!weekly_matches_member_b_fkey(id, full_name, avatar_url, headline, city)"
      )
      .order("week_start", { ascending: false })
      .limit(20);
    setMatches((data as unknown as Match[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function other(m: Match): MatchProfile | null {
    return m.member_a === me ? m.profile_b : m.profile_a;
  }
  function myAction(m: Match): string {
    return m.member_a === me ? m.a_action : m.b_action;
  }

  async function act(m: Match, action: "contacted" | "skipped") {
    const field = m.member_a === me ? "a_action" : "b_action";
    await supabase
      .from("weekly_matches")
      .update({ [field]: action })
      .eq("id", m.id);
    if (action === "contacted" && me) {
      const otherId = m.member_a === me ? m.member_b : m.member_a;
      const convId = await ensureDm(me, otherId);
      router.push(`/espace/messages/${convId}`);
      return;
    }
    load();
  }

  if (loading)
    return <p className="py-8 text-center text-sm text-zinc-500">Chargement…</p>;

  const thisWeek = matches.filter((m) => myAction(m) === "pending");
  const done = matches.filter((m) => myAction(m) !== "pending");

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">☕ Vos matchs de la semaine</h1>
      <p className="text-sm text-zinc-400">
        Chaque lundi, nous vous suggérons des membres à rencontrer, choisis
        selon vos provinces, secteurs et annonces. Un café, une visio de 20
        minutes — c&apos;est souvent comme ça que naissent les meilleures
        collaborations.
      </p>

      {thisWeek.length === 0 ? (
        <p className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">
          Pas de nouveau match en attente. Rendez-vous lundi prochain !
        </p>
      ) : (
        <div className="space-y-2">
          {thisWeek.map((m) => {
            const p = other(m);
            if (!p) return null;
            return (
              <div
                key={m.id}
                className="rounded-2xl border border-amber-400/30 bg-zinc-900/60 p-4"
              >
                <Link
                  href={`/espace/membres/${p.id}`}
                  className="flex items-center gap-3"
                >
                  <Avatar url={p.avatar_url} name={p.full_name} size="md" />
                  <span className="min-w-0">
                    <span className="block font-semibold hover:text-amber-400">
                      {p.full_name}
                    </span>
                    <span className="block truncate text-xs text-zinc-400">
                      {[p.headline, p.city].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </Link>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => act(m, "contacted")}
                    className="flex-1 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
                  >
                    💬 Prendre contact
                  </button>
                  <button
                    onClick={() => act(m, "skipped")}
                    className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-500"
                  >
                    Passer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {done.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Matchs précédents
          </h2>
          <div className="space-y-2 opacity-60">
            {done.map((m) => {
              const p = other(m);
              if (!p) return null;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Avatar url={p.avatar_url} name={p.full_name} size="sm" />
                    {p.full_name}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {myAction(m) === "contacted" ? "💬 Contacté" : "Passé"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
