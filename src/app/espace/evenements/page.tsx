"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Event = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  is_online: boolean;
  starts_at: string;
  capacity: number | null;
  registrations: { profile_id: string; profile: { full_name: string } | null }[];
};

const emptyForm = {
  title: "",
  description: "",
  location: "",
  is_online: false,
  date: "",
  time: "19:00",
  capacity: "",
};

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EvenementsPage() {
  const supabase = createClient();
  const [me, setMe] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setMe(user.id);
    const [{ data: p }, { data: evts }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase
        .from("events")
        .select(
          "id, title, description, location, is_online, starts_at, capacity, registrations:event_registrations(profile_id, profile:profiles(full_name))"
        )
        .order("starts_at"),
    ]);
    setIsStaff(["admin", "moderator"].includes(p?.role ?? ""));
    setEvents((evts as unknown as Event[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!me || !form.title || !form.date) return;
    await supabase.from("events").insert({
      title: form.title,
      description: form.description || null,
      location: form.is_online ? null : form.location || null,
      is_online: form.is_online,
      starts_at: new Date(`${form.date}T${form.time}`).toISOString(),
      capacity: form.capacity ? parseInt(form.capacity, 10) : null,
      created_by: me,
    });
    setForm(emptyForm);
    setShowForm(false);
    load();
  }

  async function toggleRegistration(ev: Event, registered: boolean) {
    if (!me) return;
    if (registered) {
      await supabase
        .from("event_registrations")
        .delete()
        .eq("event_id", ev.id)
        .eq("profile_id", me);
    } else {
      await supabase
        .from("event_registrations")
        .insert({ event_id: ev.id, profile_id: me });
    }
    load();
  }

  async function deleteEvent(id: string) {
    if (!window.confirm("Supprimer cet événement ?")) return;
    await supabase.from("events").delete().eq("id", id);
    load();
  }

  if (loading)
    return <p className="py-8 text-center text-sm text-zinc-500">Chargement…</p>;

  const now = Date.now();
  const upcoming = events.filter((e) => Date.parse(e.starts_at) >= now);
  const past = events
    .filter((e) => Date.parse(e.starts_at) < now)
    .reverse()
    .slice(0, 5);

  const field =
    "mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-400";

  function EventCard({ ev, isPast }: { ev: Event; isPast?: boolean }) {
    const registered = ev.registrations.some((r) => r.profile_id === me);
    const full =
      ev.capacity !== null && ev.registrations.length >= ev.capacity;
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold">{ev.title}</h3>
            <p className="mt-0.5 text-xs capitalize text-amber-400">
              {formatEventDate(ev.starts_at)}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {ev.is_online ? "💻 En ligne" : `📍 ${ev.location ?? "Lieu à confirmer"}`}
            </p>
          </div>
          {!isPast && (
            <button
              onClick={() => toggleRegistration(ev, registered)}
              disabled={!registered && full}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                registered
                  ? "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
                  : "bg-amber-400 text-zinc-950 hover:bg-amber-300 disabled:opacity-40"
              }`}
            >
              {registered ? "Inscrit ✓" : full ? "Complet" : "S'inscrire"}
            </button>
          )}
        </div>
        {ev.description && (
          <p className="mt-2 text-sm text-zinc-300">{ev.description}</p>
        )}
        <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
          <button
            onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
            className="hover:text-zinc-200"
          >
            👥 {ev.registrations.length} participant
            {ev.registrations.length > 1 ? "s" : ""}
            {ev.capacity ? ` / ${ev.capacity}` : ""}
          </button>
          {isStaff && (
            <button
              onClick={() => deleteEvent(ev.id)}
              className="ml-auto text-zinc-600 hover:text-red-400"
            >
              Supprimer
            </button>
          )}
        </div>
        {expanded === ev.id && ev.registrations.length > 0 && (
          <p className="mt-2 border-t border-zinc-800 pt-2 text-xs text-zinc-400">
            {ev.registrations
              .map((r) => r.profile?.full_name ?? "?")
              .join(" · ")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Événements</h1>
        {isStaff && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-300"
          >
            {showForm ? "Annuler" : "+ Créer"}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={createEvent}
          className="space-y-3 rounded-2xl border border-amber-400/30 bg-zinc-900/60 p-4"
        >
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Titre de l'événement *"
            required
            className={field}
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description"
            rows={2}
            className={`${field} resize-none`}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
              className={field}
            />
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className={field}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_online}
              onChange={(e) => setForm({ ...form, is_online: e.target.checked })}
              className="h-4 w-4 accent-amber-400"
            />
            Événement en ligne (visio)
          </label>
          {!form.is_online && (
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Lieu (adresse, ville)"
              className={field}
            />
          )}
          <input
            type="number"
            min="1"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            placeholder="Places max (vide = illimité)"
            className={field}
          />
          <button
            type="submit"
            className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
          >
            Créer l&apos;événement
          </button>
        </form>
      )}

      {upcoming.length === 0 ? (
        <p className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">
          Aucun événement à venir pour l&apos;instant.
        </p>
      ) : (
        <div className="space-y-2">
          {upcoming.map((ev) => (
            <EventCard key={ev.id} ev={ev} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Événements passés
          </h2>
          <div className="space-y-2 opacity-60">
            {past.map((ev) => (
              <EventCard key={ev.id} ev={ev} isPast />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
