"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Resource = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  file_path: string | null;
  category: string;
  status: string;
  submitted_by: string | null;
  submitter: { full_name: string } | null;
};

const categories: Record<string, string> = {
  modele: "📄 Modèles de documents",
  guide: "📘 Guides pratiques",
  outil: "🛠️ Outils",
  replay: "🎬 Replays",
  autre: "📎 Autres",
};

const emptyForm = { title: "", description: "", url: "", category: "modele" };

export default function RessourcesPage() {
  const supabase = createClient();
  const [me, setMe] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setMe(user.id);
    const [{ data: p }, { data: res }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase
        .from("resources")
        .select(
          "id, title, description, url, file_path, category, status, submitted_by, submitter:profiles!resources_submitted_by_fkey(full_name)"
        )
        .order("created_at", { ascending: false }),
    ]);
    setIsStaff(["admin", "moderator"].includes(p?.role ?? ""));
    setResources((res as unknown as Resource[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resourceLink(r: Resource): string | null {
    if (r.url) return r.url;
    if (r.file_path) {
      const { data } = supabase.storage
        .from("resources")
        .getPublicUrl(r.file_path);
      return data.publicUrl;
    }
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!me || !form.title || (!form.url && !file)) return;
    setSubmitting(true);

    let filePath: string | null = null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        window.alert("Le fichier dépasse 10 Mo.");
        setSubmitting(false);
        return;
      }
      filePath = `${me}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage
        .from("resources")
        .upload(filePath, file, { contentType: file.type });
      if (error) {
        window.alert("Échec de l'envoi du fichier : " + error.message);
        setSubmitting(false);
        return;
      }
    }

    await supabase.from("resources").insert({
      title: form.title,
      description: form.description || null,
      url: form.url || null,
      file_path: filePath,
      category: form.category,
      submitted_by: me,
      status: isStaff ? "approved" : "pending",
    });
    setForm(emptyForm);
    setFile(null);
    setShowForm(false);
    setSubmitting(false);
    load();
  }

  async function moderate(id: string, status: "approved" | "rejected") {
    await supabase.from("resources").update({ status }).eq("id", id);
    load();
  }

  if (loading)
    return <p className="py-8 text-center text-sm text-zinc-500">Chargement…</p>;

  const approved = resources.filter(
    (r) => r.status === "approved" && (!filter || r.category === filter)
  );
  const pendingMine = resources.filter(
    (r) => r.status === "pending" && r.submitted_by === me
  );
  const pendingModeration = isStaff
    ? resources.filter((r) => r.status === "pending")
    : [];

  const field =
    "mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-400";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Ressources</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-300"
        >
          {showForm ? "Annuler" : "+ Proposer"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="space-y-3 rounded-2xl border border-amber-400/30 bg-zinc-900/60 p-4"
        >
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Titre de la ressource *"
            required
            className={field}
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="En quoi est-ce utile ?"
            rows={2}
            className={`${field} resize-none`}
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className={field}
          >
            {Object.entries(categories).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="Lien (https://…)"
            className={field}
          />
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span>ou</span>
            <input
              ref={fileRef}
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !form.title || (!form.url && !file)}
            className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300 disabled:opacity-40"
          >
            {submitting
              ? "Envoi…"
              : isStaff
                ? "Publier"
                : "Proposer (validation par l'équipe)"}
          </button>
        </form>
      )}

      {pendingModeration.length > 0 && (
        <section className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
          <h2 className="text-sm font-semibold text-amber-400">
            À valider ({pendingModeration.length})
          </h2>
          <div className="mt-2 space-y-2">
            {pendingModeration.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  {r.title}{" "}
                  <span className="text-xs text-zinc-500">
                    — {r.submitter?.full_name}
                  </span>
                </span>
                <span className="flex shrink-0 gap-2">
                  <button
                    onClick={() => moderate(r.id, "approved")}
                    className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-zinc-950 hover:bg-amber-300"
                  >
                    Valider
                  </button>
                  <button
                    onClick={() => moderate(r.id, "rejected")}
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

      {pendingMine.length > 0 && !isStaff && (
        <p className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-zinc-400">
          {pendingMine.length} de vos propositions attendent la validation de
          l&apos;équipe.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("")}
          className={`rounded-full px-3 py-1.5 text-xs transition ${!filter ? "bg-amber-400 font-semibold text-zinc-950" : "border border-zinc-700 text-zinc-300"}`}
        >
          Tout
        </button>
        {Object.entries(categories).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setFilter(filter === k ? "" : k)}
            className={`rounded-full px-3 py-1.5 text-xs transition ${filter === k ? "bg-amber-400 font-semibold text-zinc-950" : "border border-zinc-700 text-zinc-300"}`}
          >
            {v}
          </button>
        ))}
      </div>

      {approved.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          Aucune ressource dans cette catégorie — proposez la première !
        </p>
      ) : (
        <div className="space-y-2">
          {approved.map((r) => {
            const link = resourceLink(r);
            return (
              <a
                key={r.id}
                href={link ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-amber-400/50"
              >
                <p className="text-xs text-amber-400">
                  {categories[r.category] ?? r.category}
                </p>
                <h3 className="mt-1 font-semibold">{r.title}</h3>
                {r.description && (
                  <p className="mt-1 text-sm text-zinc-400">{r.description}</p>
                )}
                <p className="mt-1 text-xs text-zinc-500">
                  Partagé par {r.submitter?.full_name ?? "l'équipe"}
                </p>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
