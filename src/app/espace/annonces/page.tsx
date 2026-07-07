"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensureDm } from "@/lib/dm";
import { formatDate } from "@/components/PostFeed";

type Ref = { id: string; name: string };

type ListingResponse = {
  id: string;
  listing_id: string;
  responder_id: string;
  message: string;
  price_indication: string | null;
  selected: boolean;
  responder: { full_name: string } | null;
};

type Listing = {
  id: string;
  author_id: string;
  kind: "need" | "offer";
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  author: { full_name: string } | null;
  sector: { name: string } | null;
  region: { name: string } | null;
};

const emptyForm = {
  kind: "need" as "need" | "offer",
  title: "",
  description: "",
  sector_id: "",
  region_id: "",
};

export default function AnnoncesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [me, setMe] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [sectors, setSectors] = useState<Ref[]>([]);
  const [regions, setRegions] = useState<Ref[]>([]);
  const [tab, setTab] = useState<"" | "need" | "offer">("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [responses, setResponses] = useState<ListingResponse[]>([]);
  const [respondTo, setRespondTo] = useState<string | null>(null);
  const [respForm, setRespForm] = useState({ message: "", price: "" });
  const [showResponses, setShowResponses] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setMe(user.id);
    const [{ data: lst }, { data: secs }, { data: regs }, { data: resps }] = await Promise.all([
      supabase
        .from("listings")
        .select(
          "id, author_id, kind, title, description, status, created_at, author:profiles(full_name), sector:sectors(name), region:regions(name)"
        )
        .eq("status", "open")
        .order("created_at", { ascending: false }),
      supabase.from("sectors").select("id, name").order("name"),
      supabase.from("regions").select("id, name").order("name"),
      supabase
        .from("listing_responses")
        .select(
          "id, listing_id, responder_id, message, price_indication, selected, responder:profiles!listing_responses_responder_id_fkey(full_name)"
        ),
    ]);
    setListings((lst as unknown as Listing[]) ?? []);
    setSectors((secs as Ref[]) ?? []);
    setRegions((regs as Ref[]) ?? []);
    setResponses((resps as unknown as ListingResponse[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    if (!me || !form.title) return;
    await supabase.from("listings").insert({
      author_id: me,
      kind: form.kind,
      title: form.title,
      description: form.description || null,
      sector_id: form.sector_id || null,
      region_id: form.region_id || null,
    });
    setForm(emptyForm);
    setShowForm(false);
    load();
  }

  async function close(id: string) {
    await supabase.from("listings").update({ status: "closed" }).eq("id", id);
    load();
  }

  async function contact(authorId: string) {
    if (!me) return;
    const convId = await ensureDm(me, authorId);
    router.push(`/espace/messages/${convId}`);
  }

  async function sendResponse(e: React.FormEvent, listingId: string) {
    e.preventDefault();
    if (!me || !respForm.message.trim()) return;
    const { error } = await supabase.from("listing_responses").insert({
      listing_id: listingId,
      responder_id: me,
      message: respForm.message.trim(),
      price_indication: respForm.price || null,
    });
    if (error) window.alert("Impossible d'envoyer : " + error.message);
    setRespForm({ message: "", price: "" });
    setRespondTo(null);
    load();
  }

  async function selectResponse(resp: ListingResponse) {
    await supabase
      .from("listing_responses")
      .update({ selected: true })
      .eq("id", resp.id);
    load();
  }

  function listingResponses(listingId: string): ListingResponse[] {
    return responses.filter((r) => r.listing_id === listingId);
  }
  function myResponse(listingId: string): ListingResponse | undefined {
    return responses.find(
      (r) => r.listing_id === listingId && r.responder_id === me
    );
  }

  if (loading)
    return <p className="py-8 text-center text-sm text-zinc-500">Chargement…</p>;

  const filtered = listings.filter((l) => !tab || l.kind === tab);
  const field =
    "mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-400";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Besoins & Offres</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-300"
        >
          {showForm ? "Annuler" : "+ Publier"}
        </button>
      </div>

      <p className="text-sm text-zinc-400">
        Déclarez ce que vous cherchez ou ce que vous proposez : les membres du
        secteur concerné sont notifiés automatiquement.
      </p>

      {showForm && (
        <form
          onSubmit={publish}
          className="space-y-3 rounded-2xl border border-amber-400/30 bg-zinc-900/60 p-4"
        >
          <div className="flex gap-2">
            {(
              [
                ["need", "🔎 Je cherche…"],
                ["offer", "💡 Je propose…"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setForm({ ...form, kind: k })}
                className={`flex-1 rounded-full px-3 py-2 text-sm transition ${
                  form.kind === k
                    ? "bg-amber-400 font-semibold text-zinc-950"
                    : "border border-zinc-700 text-zinc-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={
              form.kind === "need"
                ? "Ex. Un associé technique pour mon e-commerce *"
                : "Ex. 1h de conseil comptabilité offerte *"
            }
            required
            className={field}
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Précisez le contexte, le budget, les délais…"
            rows={3}
            className={`${field} resize-none`}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.sector_id}
              onChange={(e) => setForm({ ...form, sector_id: e.target.value })}
              className={field}
            >
              <option value="">Secteur concerné (notifie les membres)</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={form.region_id}
              onChange={(e) => setForm({ ...form, region_id: e.target.value })}
              className={field}
            >
              <option value="">Province (optionnel)</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
          >
            Publier l&apos;annonce
          </button>
        </form>
      )}

      <div className="flex gap-2">
        {(
          [
            ["", "Tout"],
            ["need", "🔎 Besoins"],
            ["offer", "💡 Offres"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-full px-4 py-1.5 text-xs transition ${
              tab === k
                ? "bg-amber-400 font-semibold text-zinc-950"
                : "border border-zinc-700 text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          Aucune annonce ouverte — publiez la première !
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((l) => (
            <div
              key={l.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-amber-400">
                    {l.kind === "need" ? "🔎 Besoin" : "💡 Offre"} ·{" "}
                    {formatDate(l.created_at)}
                  </p>
                  <h3 className="mt-1 font-semibold">{l.title}</h3>
                  {l.description && (
                    <p className="mt-1 text-sm text-zinc-400">{l.description}</p>
                  )}
                  <p className="mt-2 flex flex-wrap items-center gap-1 text-xs text-zinc-500">
                    <Link
                      href={`/espace/membres/${l.author_id}`}
                      className="hover:text-amber-400"
                    >
                      {l.author?.full_name}
                    </Link>
                    {l.sector && (
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
                        {l.sector.name}
                      </span>
                    )}
                    {l.region && (
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
                        📍 {l.region.name}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  {l.author_id === me ? (
                    <button
                      onClick={() => close(l.id)}
                      className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs text-zinc-300 hover:border-zinc-500"
                    >
                      Clôturer
                    </button>
                  ) : myResponse(l.id) ? (
                    <span className="text-xs text-emerald-400">
                      {myResponse(l.id)!.selected
                        ? "🎉 Retenue !"
                        : "Réponse envoyée ✓"}
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() =>
                          setRespondTo(respondTo === l.id ? null : l.id)
                        }
                        className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-300"
                      >
                        Répondre
                      </button>
                      <button
                        onClick={() => contact(l.author_id)}
                        className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs text-zinc-300 hover:border-zinc-500"
                      >
                        Message
                      </button>
                    </>
                  )}
                </div>
              </div>

              {respondTo === l.id && (
                <form
                  onSubmit={(e) => sendResponse(e, l.id)}
                  className="mt-3 space-y-2 border-t border-zinc-800 pt-3"
                >
                  <textarea
                    value={respForm.message}
                    onChange={(e) =>
                      setRespForm({ ...respForm, message: e.target.value })
                    }
                    rows={3}
                    placeholder="Votre proposition : approche, expérience, disponibilité…"
                    className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                  <div className="flex gap-2">
                    <input
                      value={respForm.price}
                      onChange={(e) =>
                        setRespForm({ ...respForm, price: e.target.value })
                      }
                      placeholder="Prix indicatif (ex. 1 200 € HTVA)"
                      className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      disabled={!respForm.message.trim()}
                      className="rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-amber-300 disabled:opacity-40"
                    >
                      Envoyer
                    </button>
                  </div>
                </form>
              )}

              {l.author_id === me && listingResponses(l.id).length > 0 && (
                <div className="mt-3 border-t border-zinc-800 pt-3">
                  <button
                    onClick={() =>
                      setShowResponses(showResponses === l.id ? null : l.id)
                    }
                    className="text-xs font-semibold text-amber-400"
                  >
                    📬 {listingResponses(l.id).length} réponse
                    {listingResponses(l.id).length > 1 ? "s" : ""} —{" "}
                    {showResponses === l.id ? "masquer" : "voir"}
                  </button>
                  {showResponses === l.id && (
                    <div className="mt-2 space-y-2">
                      {listingResponses(l.id).map((r) => (
                        <div
                          key={r.id}
                          className={`rounded-xl px-3 py-2 ${
                            r.selected
                              ? "border border-emerald-400/40 bg-emerald-400/5"
                              : "bg-zinc-800/60"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold">
                              <Link
                                href={`/espace/membres/${r.responder_id}`}
                                className="hover:text-amber-400"
                              >
                                {r.responder?.full_name}
                              </Link>
                              {r.price_indication && (
                                <span className="ml-2 text-amber-400">
                                  {r.price_indication}
                                </span>
                              )}
                              {r.selected && (
                                <span className="ml-2 text-emerald-400">
                                  ✓ Retenue
                                </span>
                              )}
                            </p>
                            <span className="flex shrink-0 gap-2">
                              {!r.selected && (
                                <button
                                  onClick={() => selectResponse(r)}
                                  className="rounded-full bg-emerald-500/90 px-3 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500"
                                >
                                  Retenir
                                </button>
                              )}
                              <button
                                onClick={() => contact(r.responder_id)}
                                className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] text-zinc-300 hover:border-zinc-500"
                              >
                                Message
                              </button>
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-zinc-300">
                            {r.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
