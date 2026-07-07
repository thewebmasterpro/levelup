"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatLabels, priceLabel } from "@/lib/courses";

type Course = {
  id: string;
  title: string;
  description: string | null;
  format: string;
  price_cents: number;
  starts_at: string | null;
  status: string;
  trainer_id: string;
  trainer: { full_name: string } | null;
  reviews: { rating: number }[];
  enrollments: { count: number }[];
};

export default function FormationsPage() {
  const supabase = createClient();
  const [me, setMe] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setMe(user.id);
      const { data } = await supabase
        .from("courses")
        .select(
          "id, title, description, format, price_cents, starts_at, status, trainer_id, trainer:profiles!courses_trainer_id_fkey(full_name), reviews:course_reviews(rating), enrollments:course_enrollments(count)"
        )
        .order("created_at", { ascending: false });
      setCourses((data as unknown as Course[]) ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading)
    return <p className="py-8 text-center text-sm text-zinc-500">Chargement…</p>;

  const visible = courses.filter(
    (c) =>
      (c.status === "published" || c.trainer_id === me) &&
      (!filter || c.format === filter)
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Formations</h1>
        <Link
          href="/espace/formations/nouvelle"
          className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-300"
        >
          + Proposer
        </Link>
      </div>

      <p className="text-sm text-zinc-400">
        Des formations proposées par les experts de la communauté. Vous avez
        une expertise ? Proposez la vôtre.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("")}
          className={`rounded-full px-3 py-1.5 text-xs transition ${!filter ? "bg-amber-400 font-semibold text-zinc-950" : "border border-zinc-700 text-zinc-300"}`}
        >
          Toutes
        </button>
        {Object.entries(formatLabels).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setFilter(filter === k ? "" : k)}
            className={`rounded-full px-3 py-1.5 text-xs transition ${filter === k ? "bg-amber-400 font-semibold text-zinc-950" : "border border-zinc-700 text-zinc-300"}`}
          >
            {v}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          Aucune formation pour l&apos;instant — proposez la première !
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((c) => {
            const avg =
              c.reviews.length > 0
                ? c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length
                : null;
            return (
              <Link
                key={c.id}
                href={`/espace/formations/${c.id}`}
                className="block rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-amber-400/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-amber-400">
                    {formatLabels[c.format] ?? c.format}
                    {c.status === "draft" && (
                      <span className="ml-2 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                        Brouillon (visible par vous seul)
                      </span>
                    )}
                  </p>
                  <span className="shrink-0 font-semibold text-amber-400">
                    {priceLabel(c.price_cents)}
                  </span>
                </div>
                <h3 className="mt-1 font-semibold">{c.title}</h3>
                {c.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
                    {c.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-zinc-500">
                  Par {c.trainer?.full_name}
                  {c.starts_at &&
                    ` · ${new Date(c.starts_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`}
                  {" · "}
                  {c.enrollments[0]?.count ?? 0} inscrit
                  {(c.enrollments[0]?.count ?? 0) > 1 ? "s" : ""}
                  {avg && ` · ⭐ ${avg.toFixed(1)}`}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
