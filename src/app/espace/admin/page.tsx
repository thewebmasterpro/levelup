"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/components/PostFeed";

type Candidate = {
  id: string;
  full_name: string;
  headline: string | null;
  city: string | null;
  status: string;
  created_at: string;
  companies: { name: string }[];
};

export default function AdminPage() {
  const supabase = createClient();
  const [isStaff, setIsStaff] = useState<boolean | null>(null);
  const [pending, setPending] = useState<Candidate[]>([]);
  const [counts, setCounts] = useState({ approved: 0, pending: 0 });

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const staff = ["admin", "moderator"].includes(myProfile?.role ?? "");
    setIsStaff(staff);
    if (!staff) return;

    const [{ data: pend }, { count: approvedCount }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, headline, city, status, created_at, companies(name)")
        .eq("status", "pending")
        .order("created_at"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved"),
    ]);
    setPending((pend as Candidate[]) ?? []);
    setCounts({ approved: approvedCount ?? 0, pending: pend?.length ?? 0 });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function decide(id: string, status: "approved" | "rejected") {
    await supabase.from("profiles").update({ status }).eq("id", id);
    load();
  }

  if (isStaff === null)
    return <p className="py-8 text-center text-sm text-zinc-500">Chargement…</p>;

  if (!isStaff)
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        Cette page est réservée aux administrateurs.
      </p>
    );

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Administration</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{counts.approved}</p>
          <p className="text-xs text-zinc-400">Membres actifs</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{counts.pending}</p>
          <p className="text-xs text-zinc-400">Candidatures en attente</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-400">
          Candidatures à examiner
        </h2>
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">
            Aucune candidature en attente 🎉
          </p>
        ) : (
          <div className="space-y-2">
            {pending.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{c.full_name}</p>
                    {c.headline && (
                      <p className="text-xs text-zinc-400">{c.headline}</p>
                    )}
                    <p className="mt-1 text-xs text-zinc-500">
                      {[...c.companies.map((co) => co.name), c.city]
                        .filter(Boolean)
                        .join(" · ") || "Profil non renseigné"}{" "}
                      · Candidature du {formatDate(c.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => decide(c.id, "approved")}
                      className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-300"
                    >
                      Approuver
                    </button>
                    <button
                      onClick={() => decide(c.id, "rejected")}
                      className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs text-zinc-300 hover:border-red-400 hover:text-red-400"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
