"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Ref = { id: string; name: string };

type Company = {
  id: string;
  name: string;
  role_title: string | null;
  city: string | null;
  bce_number: string | null;
  website_url: string | null;
};

const emptyCompany = {
  name: "",
  role_title: "",
  city: "",
  bce_number: "",
  website_url: "",
};

export default function ProfilPage() {
  const supabase = createClient();
  const [me, setMe] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    headline: "",
    city: "",
    bio: "",
    website_url: "",
    linkedin_url: "",
    is_public: true,
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [newCo, setNewCo] = useState(emptyCompany);
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
      const [{ data: p }, { data: regs }, { data: secs }, { data: pr }, { data: ps }, { data: cos }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select(
              "full_name, headline, city, bio, website_url, linkedin_url, is_public"
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
          supabase
            .from("companies")
            .select("id, name, role_title, city, bce_number, website_url")
            .eq("owner_id", user.id)
            .order("created_at"),
        ]);
      if (p)
        setForm({
          full_name: p.full_name ?? "",
          headline: p.headline ?? "",
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
      setCompanies((cos as Company[]) ?? []);
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

  async function addCompany() {
    if (!me || !newCo.name.trim()) return;
    await supabase.from("companies").insert({
      owner_id: me,
      name: newCo.name.trim(),
      role_title: newCo.role_title || null,
      city: newCo.city || null,
      bce_number: newCo.bce_number || null,
      website_url: newCo.website_url || null,
    });
    setNewCo(emptyCompany);
    const { data } = await supabase
      .from("companies")
      .select("id, name, role_title, city, bce_number, website_url")
      .eq("owner_id", me)
      .order("created_at");
    setCompanies((data as Company[]) ?? []);
  }

  async function removeCompany(id: string) {
    await supabase.from("companies").delete().eq("id", id);
    setCompanies(companies.filter((c) => c.id !== id));
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
        <label className="block text-sm">
          Ville
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className={field}
          />
        </label>
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
        <h2 className="text-sm font-semibold text-amber-400">
          Mes entreprises
        </h2>
        <div className="mt-2 space-y-2">
          {companies.map((c) => (
            <div
              key={c.id}
              className="flex items-start justify-between gap-2 rounded-xl bg-zinc-800/60 px-3 py-2"
            >
              <div className="min-w-0 text-sm">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-zinc-400">
                  {[c.role_title, c.city, c.bce_number && `BCE ${c.bce_number}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeCompany(c.id)}
                className="shrink-0 text-xs text-zinc-500 transition hover:text-red-400"
              >
                Retirer
              </button>
            </div>
          ))}
          {companies.length === 0 && (
            <p className="text-xs text-zinc-500">
              Aucune entreprise renseignée pour l&apos;instant.
            </p>
          )}
        </div>
        <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={newCo.name}
              onChange={(e) => setNewCo({ ...newCo, name: e.target.value })}
              placeholder="Nom de l'entreprise *"
              className={field}
            />
            <input
              value={newCo.role_title}
              onChange={(e) =>
                setNewCo({ ...newCo, role_title: e.target.value })
              }
              placeholder="Votre rôle (ex. Gérant)"
              className={field}
            />
            <input
              value={newCo.city}
              onChange={(e) => setNewCo({ ...newCo, city: e.target.value })}
              placeholder="Ville"
              className={field}
            />
            <input
              value={newCo.bce_number}
              onChange={(e) =>
                setNewCo({ ...newCo, bce_number: e.target.value })
              }
              placeholder="N° BCE (facultatif)"
              className={field}
            />
          </div>
          <input
            value={newCo.website_url}
            onChange={(e) =>
              setNewCo({ ...newCo, website_url: e.target.value })
            }
            placeholder="Site web (https://…)"
            className={field}
          />
          <button
            type="button"
            onClick={addCompany}
            disabled={!newCo.name.trim()}
            className="rounded-full border border-amber-400/50 px-4 py-1.5 text-xs font-semibold text-amber-400 transition hover:bg-amber-400/10 disabled:opacity-40"
          >
            + Ajouter cette entreprise
          </button>
        </div>
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
