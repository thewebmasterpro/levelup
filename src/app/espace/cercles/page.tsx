"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";

type Circle = {
  id: string;
  title: string | null;
  members: string[];
};

type Candidate = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
};

export default function CerclesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [me, setMe] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setMe(user.id);

    const { data: isVerified } = await supabase.rpc("has_verified_company", {
      uid: user.id,
    });
    setVerified(!!isVerified);

    const { data: mine } = await supabase
      .from("conversation_participants")
      .select("conversation_id, conversation:conversations(id, title, is_confidential)")
      .eq("profile_id", user.id);

    const circleIds = (mine ?? [])
      .filter(
        (m) =>
          (m.conversation as unknown as { is_confidential: boolean })
            ?.is_confidential
      )
      .map((m) => m.conversation_id);

    let rows: Circle[] = [];
    if (circleIds.length > 0) {
      const { data: parts } = await supabase
        .from("conversation_participants")
        .select("conversation_id, profile:profiles(full_name)")
        .in("conversation_id", circleIds);
      rows = (mine ?? [])
        .filter((m) => circleIds.includes(m.conversation_id))
        .map((m) => {
          const conv = m.conversation as unknown as {
            id: string;
            title: string | null;
          };
          return {
            id: conv.id,
            title: conv.title,
            members: (parts ?? [])
              .filter((p) => p.conversation_id === m.conversation_id)
              .map(
                (p) =>
                  (p.profile as unknown as { full_name: string })?.full_name ??
                  "?"
              ),
          };
        });
    }
    setCircles(rows);

    // Dirigeants vérifiés invitables (hors soi-même)
    if (isVerified) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, headline, companies!inner(bce_verified)")
        .eq("companies.bce_verified", true)
        .neq("id", user.id)
        .eq("status", "approved");
      const seen = new Set<string>();
      setCandidates(
        ((profs as unknown as Candidate[]) ?? []).filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        })
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createCircle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!me || !title.trim() || selected.size === 0) return;

    const circleId = crypto.randomUUID();
    const { error: convError } = await supabase.from("conversations").insert({
      id: circleId,
      created_by: me,
      is_group: true,
      is_confidential: true,
      title: title.trim(),
    });
    if (convError) {
      setError(convError.message);
      return;
    }
    const { error: partError } = await supabase
      .from("conversation_participants")
      .insert([
        { conversation_id: circleId, profile_id: me },
        ...[...selected].map((profile_id) => ({
          conversation_id: circleId,
          profile_id,
        })),
      ]);
    if (partError) {
      setError(partError.message);
      return;
    }
    router.push(`/espace/messages/${circleId}`);
  }

  if (loading)
    return <p className="py-8 text-center text-sm text-zinc-500">Chargement…</p>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">🔒 Cercles confidentiels</h1>
      <p className="text-sm text-zinc-400">
        Des salons privés à effectif restreint, réservés aux dirigeants dont
        l&apos;entreprise est <strong>vérifiée BCE</strong> : parlez vrais
        chiffres, vraies difficultés, en toute confiance. Rien n&apos;est
        visible en dehors du cercle.
      </p>

      {!verified ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5 text-sm text-zinc-300">
          <p className="font-semibold text-amber-400">
            Réservé aux dirigeants vérifiés
          </p>
          <p className="mt-2">
            Pour accéder aux cercles, ajoutez le numéro BCE d&apos;une de vos
            entreprises dans{" "}
            <Link href="/espace/profil" className="text-amber-400 underline">
              votre profil
            </Link>{" "}
            — l&apos;équipe la vérifiera rapidement.
          </p>
        </div>
      ) : (
        <>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
          >
            {showForm ? "Annuler" : "+ Créer un cercle"}
          </button>

          {showForm && (
            <form
              onSubmit={createCircle}
              className="space-y-3 rounded-2xl border border-amber-400/30 bg-zinc-900/60 p-4"
            >
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nom du cercle (ex. Dirigeants +500k CA Bruxelles) *"
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
              />
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                Inviter des dirigeants vérifiés
              </p>
              {candidates.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  Aucun autre dirigeant vérifié pour l&apos;instant.
                </p>
              ) : (
                <div className="space-y-1">
                  {candidates.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-zinc-800/60"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => {
                          const next = new Set(selected);
                          if (next.has(c.id)) next.delete(c.id);
                          else next.add(c.id);
                          setSelected(next);
                        }}
                        className="h-4 w-4 accent-amber-400"
                      />
                      <Avatar url={c.avatar_url} name={c.full_name} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate">{c.full_name}</span>
                        {c.headline && (
                          <span className="block truncate text-xs text-zinc-500">
                            {c.headline}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={!title.trim() || selected.size === 0}
                className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300 disabled:opacity-40"
              >
                Créer le cercle ({selected.size} invité
                {selected.size > 1 ? "s" : ""})
              </button>
            </form>
          )}

          {circles.length === 0 ? (
            <p className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">
              Vous ne faites partie d&apos;aucun cercle pour l&apos;instant.
            </p>
          ) : (
            <div className="space-y-2">
              {circles.map((c) => (
                <Link
                  key={c.id}
                  href={`/espace/messages/${c.id}`}
                  className="block rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-amber-400/50"
                >
                  <p className="font-semibold">🔒 {c.title ?? "Cercle"}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {c.members.join(" · ")}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
