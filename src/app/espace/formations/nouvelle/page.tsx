"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatLabels } from "@/lib/courses";

export default function NouvelleFormationPage() {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    format: "visio",
    price: "",
    location: "",
    date: "",
    time: "18:00",
    duration_text: "",
    capacity: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("courses")
      .insert({
        trainer_id: user.id,
        title: form.title,
        description: form.description || null,
        format: form.format,
        price_cents: form.price ? Math.round(parseFloat(form.price) * 100) : 0,
        location: form.format === "presentiel" ? form.location || null : null,
        starts_at:
          form.date && form.format !== "elearning"
            ? new Date(`${form.date}T${form.time}`).toISOString()
            : null,
        duration_text: form.duration_text || null,
        capacity: form.capacity ? parseInt(form.capacity, 10) : null,
      })
      .select("id")
      .single();

    setSaving(false);
    if (error || !data) {
      setError(error?.message ?? "Erreur inattendue");
      return;
    }
    router.push(`/espace/formations/${data.id}`);
  }

  const field =
    "mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-400";

  return (
    <div className="space-y-4">
      <Link
        href="/espace/formations"
        className="text-xs text-zinc-400 hover:text-zinc-200"
      >
        ← Formations
      </Link>
      <h1 className="text-xl font-bold">Proposer une formation</h1>
      <p className="text-sm text-zinc-400">
        Elle sera créée en <strong>brouillon</strong> : vous pourrez ajouter
        des leçons puis la publier depuis sa fiche.
      </p>

      <form
        onSubmit={save}
        className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
      >
        <label className="block text-sm">
          Titre *
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            placeholder="Ex. Maîtriser sa TVA en Belgique"
            className={field}
          />
        </label>
        <label className="block text-sm">
          Programme / description
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className={`${field} resize-none`}
          />
        </label>
        <label className="block text-sm">
          Format
          <select
            value={form.format}
            onChange={(e) => setForm({ ...form, format: e.target.value })}
            className={field}
          >
            {Object.entries(formatLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        {form.format === "presentiel" && (
          <label className="block text-sm">
            Lieu
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={field}
            />
          </label>
        )}
        {form.format !== "elearning" && (
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm">
              Date
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={field}
              />
            </label>
            <label className="block text-sm">
              Heure
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className={field}
              />
            </label>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          <label className="block text-sm">
            Prix (€)
            <input
              type="number"
              min="0"
              step="1"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="0 = gratuit"
              className={field}
            />
          </label>
          <label className="block text-sm">
            Durée
            <input
              value={form.duration_text}
              onChange={(e) =>
                setForm({ ...form, duration_text: e.target.value })
              }
              placeholder="Ex. 2h"
              className={field}
            />
          </label>
          <label className="block text-sm">
            Places max
            <input
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              className={field}
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving || !form.title}
          className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300 disabled:opacity-40"
        >
          {saving ? "Création…" : "Créer le brouillon"}
        </button>
      </form>

      <p className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-zinc-500">
        💶 Le paiement en ligne arrive bientôt. En attendant, les inscrits sont
        invités à régler directement auprès de vous (virement ou sur place).
      </p>
    </div>
  );
}
