"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ensureDm } from "@/lib/dm";
import Avatar from "@/components/Avatar";

type Ref = { id: string; name: string };

type Member = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  city: string | null;
  companies: { name: string }[];
  profile_regions: { region_id: string; region: { name: string } | null }[];
  profile_sectors: { sector_id: string; sector: { name: string } | null }[];
};

type Connection = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  requester?: { full_name: string } | null;
};

export default function AnnuairePage() {
  const supabase = createClient();
  const router = useRouter();
  const [me, setMe] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [regions, setRegions] = useState<Ref[]>([]);
  const [sectors, setSectors] = useState<Ref[]>([]);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setMe(user.id);
    const [{ data: profs }, { data: conns }, { data: regs }, { data: secs }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, full_name, avatar_url, headline, city, companies(name), profile_regions(region_id, region:regions(name)), profile_sectors(sector_id, sector:sectors(name))"
          )
          .neq("id", user.id)
          .eq("status", "approved")
          .order("full_name"),
        supabase
          .from("connections")
          .select("id, requester_id, addressee_id, status, requester:profiles!connections_requester_id_fkey(full_name)"),
        supabase.from("regions").select("id, name").order("name"),
        supabase.from("sectors").select("id, name").order("name"),
      ]);
    setMembers((profs as unknown as Member[]) ?? []);
    setConnections((conns as unknown as Connection[]) ?? []);
    setRegions((regs as Ref[]) ?? []);
    setSectors((secs as Ref[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function connWith(otherId: string): Connection | undefined {
    return connections.find(
      (c) =>
        (c.requester_id === me && c.addressee_id === otherId) ||
        (c.requester_id === otherId && c.addressee_id === me)
    );
  }

  async function request(otherId: string) {
    if (!me) return;
    await supabase
      .from("connections")
      .insert({ requester_id: me, addressee_id: otherId });
    load();
  }

  async function respond(conn: Connection, status: "accepted" | "declined") {
    await supabase
      .from("connections")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", conn.id);
    load();
  }

  async function message(otherId: string) {
    if (!me) return;
    const convId = await ensureDm(me, otherId);
    router.push(`/espace/messages/${convId}`);
  }

  const pendingReceived = connections.filter(
    (c) => c.addressee_id === me && c.status === "pending"
  );

  const filtered = members.filter((m) => {
    if (
      search &&
      !`${m.full_name} ${m.companies.map((c) => c.name).join(" ")} ${m.city ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
      return false;
    if (
      regionFilter &&
      !m.profile_regions.some((r) => r.region_id === regionFilter)
    )
      return false;
    if (
      sectorFilter &&
      !m.profile_sectors.some((s) => s.sector_id === sectorFilter)
    )
      return false;
    return true;
  });

  if (loading)
    return <p className="py-8 text-center text-sm text-zinc-500">Chargement…</p>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Annuaire des membres</h1>

      {pendingReceived.length > 0 && (
        <section className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
          <h2 className="text-sm font-semibold text-amber-400">
            Demandes de mise en relation reçues
          </h2>
          <div className="mt-2 space-y-2">
            {pendingReceived.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span>{c.requester?.full_name}</span>
                <span className="flex gap-2">
                  <button
                    onClick={() => respond(c, "accepted")}
                    className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-zinc-950 hover:bg-amber-300"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => respond(c, "declined")}
                    className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-zinc-500"
                  >
                    Refuser
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un nom, une entreprise, une ville…"
          className="w-full rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm outline-none focus:border-amber-400"
        />
        <div className="flex gap-2">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="min-w-0 flex-1 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
          >
            <option value="">Toutes les régions</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="min-w-0 flex-1 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
          >
            <option value="">Tous les secteurs</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          Aucun membre ne correspond à ces critères.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => {
            const conn = connWith(m.id);
            return (
              <div
                key={m.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/espace/membres/${m.id}`}
                      className="flex items-center gap-2.5"
                    >
                      <Avatar url={m.avatar_url} name={m.full_name} size="sm" />
                      <span className="font-semibold hover:text-amber-400">
                        {m.full_name}
                      </span>
                    </Link>
                    {m.headline && (
                      <p className="mt-1 text-xs text-zinc-400">{m.headline}</p>
                    )}
                    <p className="mt-1 text-xs text-zinc-500">
                      {[...m.companies.map((c) => c.name), m.city]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-1">
                      {m.profile_regions.map(
                        (r) =>
                          r.region && (
                            <span
                              key={r.region_id}
                              className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300"
                            >
                              📍 {r.region.name}
                            </span>
                          )
                      )}
                      {m.profile_sectors.map(
                        (s) =>
                          s.sector && (
                            <span
                              key={s.sector_id}
                              className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300"
                            >
                              {s.sector.name}
                            </span>
                          )
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {!conn && (
                      <button
                        onClick={() => request(m.id)}
                        className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-300"
                      >
                        Se connecter
                      </button>
                    )}
                    {conn?.status === "pending" &&
                      conn.requester_id === me && (
                        <span className="text-xs text-zinc-500">
                          Demande envoyée
                        </span>
                      )}
                    {conn?.status === "pending" &&
                      conn.addressee_id === me && (
                        <button
                          onClick={() => respond(conn, "accepted")}
                          className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-300"
                        >
                          Accepter
                        </button>
                      )}
                    {conn?.status === "accepted" && (
                      <>
                        <span className="text-xs text-emerald-400">
                          Connecté ✓
                        </span>
                        <button
                          onClick={() => message(m.id)}
                          className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs text-zinc-200 hover:border-zinc-500"
                        >
                          Message
                        </button>
                      </>
                    )}
                    {conn?.status === "declined" && (
                      <span className="text-xs text-zinc-600">Refusée</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
