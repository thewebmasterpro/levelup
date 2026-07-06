"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Ref = { id: string; name: string };

export default function ProfilPage() {
  const supabase = createClient();
  const [me, setMe] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    headline: "",
    company_name: "",
    city: "",
    bio: "",
    website_url: "",
    linkedin_url: "",
    is_public: true,
  });
  const [regions, setRegions] = useState<Ref[]>([]);
  const [sectors, setSectors] = useState<Ref[]>([]);
  const [myRegions, setMyRegions] = useState<Set<string>>(new Set());
  const [mySectors, setMySectors] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setMe(user.id);
      const [{ data: p }, { data: regs }, { data: secs }, { data: pr }, { data: ps }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select(
              "full_name, headline, company_name, city, bio, website_url, linkedin_url, is_public"
            )
            .eq("id", user.id)
            .single(),
          supabase.from("regions").select("id, name").order("name"),
          supabase.from("sectors").select("id, name").order("name"),
          supabase
            .from("profile_regions")
            .select("region_id")
            .eq("profile_id", user.id),
          supabase
            .from("profile_sectors")
            .select("sector_id")
            .eq("profile_id", user.id),
        ]);
      if (p)
        setForm({
          full_name: p.full_name ?? "",
          headline: p.headline ?? "",
          company_name: p.company_name ?? "",
          city: p.city ?? "",
          bio: p.bio ?? "",
          website_url: p.website_url ?? "",
          linkedin_url: p.linkedin_url ?? "",
          is_public: p.is_public ?? true,
        });
      setRegions((regs as Ref[]) ?? []);
      setSectors((secs as Ref[]) ?? []);
      setMyRegions(new Set((pr ?? []).map((r) => r.region_id)));
      setMySectors(new Set((ps ?? []).map((s) => s.sector_id)));
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleSet(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    setSaving(true);
    setSaved(false);

    await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        headline: form.headline || null,
        company_name: form.company_name || null,
        city: form.city || null,
        bio: form.bio || null,
        website_url: form.website_url || null,
        linkedin_url: form.linkedin_url || null,
        is_public: form.is_public,
      })
      .eq("id", me);

    await supabase.from("profile_regions").delete().eq("profile_id", me);
    if (myRegions.size > 0)
      await supabase
        .from("profile_regions")
        .insert([...myRegions].map((region_id) => ({ profile_id: me, region_id })));

    await supabase.from("profile_sectors").delete().eq("profile_id", me);
    if (mySectors.size > 0)
      await supabase
        .from("profile_sectors")
        .insert([...mySectors].map((sector_id) => ({ profile_id: me, sector_id })));

    setSaving(false);
    setSaved(true);
  }

  if (loading)
    return <p className="py-8 text-center text-sm text-zinc-500">Chargement…</p>;

  const field =
    "mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-400";

  return (
    <form onSubmit={save} className="space-y-5">
      <h1 className="text-xl font-bold">Mon profil</h1>

      <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <label className="block text-sm">
          Nom complet
          <input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
            className={field}
          />
        </label>
        <label className="block text-sm">
          Titre / accroche{" "}
          <span className="text-zinc-500">(ex. Fondatrice — Studio Vega)</span>
          <input
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
            className={field}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Entreprise
            <input
              value={form.company_name}
              onChange={(e) =>
                setForm({ ...form, company_name: e.target.value })
              }
              className={field}
            />
          </label>
          <label className="block text-sm">
            Ville
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={field}
            />
          </label>
        </div>
        <label className="block text-sm">
          Bio
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            className={`${field} resize-none`}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Site web
            <input
              value={form.website_url}
              onChange={(e) => setForm({ ...form, website_url: e.target.value })}
              placeholder="https://…"
              className={field}
            />
          </label>
          <label className="block text-sm">
            LinkedIn
            <input
              value={form.linkedin_url}
              onChange={(e) =>
                setForm({ ...form, linkedin_url: e.target.value })
              }
              placeholder="https://linkedin.com/in/…"
              className={field}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_public}
            onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
            className="h-4 w-4 accent-amber-400"
          />
          Profil visible dans l&apos;annuaire
        </label>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="text-sm font-semibold text-amber-400">Mes régions</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {regions.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setMyRegions(toggleSet(myRegions, r.id))}
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                myRegions.has(r.id)
                  ? "bg-amber-400 font-semibold text-zinc-950"
                  : "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="text-sm font-semibold text-amber-400">Mes secteurs</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {sectors.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setMySectors(toggleSet(mySectors, s.id))}
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                mySectors.has(s.id)
                  ? "bg-amber-400 font-semibold text-zinc-950"
                  : "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300 disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {saved && <span className="text-sm text-emerald-400">Profil mis à jour ✓</span>}
      </div>
    </form>
  );
}
