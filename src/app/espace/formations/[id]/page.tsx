"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatLabels, priceLabel } from "@/lib/courses";

type Course = {
  id: string;
  trainer_id: string;
  title: string;
  description: string | null;
  format: string;
  price_cents: number;
  location: string | null;
  starts_at: string | null;
  duration_text: string | null;
  capacity: number | null;
  status: string;
  trainer: { full_name: string; headline: string | null } | null;
};

type Lesson = {
  id: string;
  position: number;
  title: string;
  video_url: string | null;
  content: string | null;
};

type Review = {
  rating: number;
  comment: string | null;
  author: { full_name: string } | null;
};

export default function FormationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const supabase = createClient();
  const [me, setMe] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [reviews, setReviews] = useState<Review[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollCount, setEnrollCount] = useState(0);
  const [newLesson, setNewLesson] = useState({ title: "", video_url: "" });
  const [myReview, setMyReview] = useState({ rating: 5, comment: "" });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setMe(user.id);

    const [{ data: c }, { data: enr }, { count }, { data: revs }] =
      await Promise.all([
        supabase
          .from("courses")
          .select(
            "*, trainer:profiles!courses_trainer_id_fkey(full_name, headline)"
          )
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("course_enrollments")
          .select("profile_id")
          .eq("course_id", id)
          .eq("profile_id", user.id)
          .maybeSingle(),
        supabase
          .from("course_enrollments")
          .select("profile_id", { count: "exact", head: true })
          .eq("course_id", id),
        supabase
          .from("course_reviews")
          .select("rating, comment, author:profiles(full_name)")
          .eq("course_id", id),
      ]);
    setCourse(c as unknown as Course | null);
    setEnrolled(!!enr);
    setEnrollCount(count ?? 0);
    setReviews((revs as unknown as Review[]) ?? []);

    if (c && (enr || (c as Course).trainer_id === user.id)) {
      const [{ data: les }, { data: dones }] = await Promise.all([
        supabase
          .from("course_lessons")
          .select("id, position, title, video_url, content")
          .eq("course_id", id)
          .order("position"),
        supabase.from("lesson_done").select("lesson_id").eq("profile_id", user.id),
      ]);
      setLessons((les as Lesson[]) ?? []);
      setDoneIds(new Set((dones ?? []).map((d) => d.lesson_id)));
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading)
    return <p className="py-8 text-center text-sm text-zinc-500">Chargement…</p>;

  if (!course)
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        Formation introuvable.{" "}
        <Link href="/espace/formations" className="text-amber-400 hover:underline">
          Retour au catalogue
        </Link>
      </p>
    );

  const isTrainer = me === course.trainer_id;
  const full = course.capacity !== null && enrollCount >= course.capacity;
  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;
  const progress =
    lessons.length > 0
      ? Math.round(
          (lessons.filter((l) => doneIds.has(l.id)).length / lessons.length) * 100
        )
      : 0;

  async function enroll() {
    if (!me) return;
    if (enrolled) {
      await supabase
        .from("course_enrollments")
        .delete()
        .eq("course_id", id)
        .eq("profile_id", me);
    } else {
      await supabase
        .from("course_enrollments")
        .insert({ course_id: id, profile_id: me });
    }
    load();
  }

  async function togglePublish() {
    await supabase
      .from("courses")
      .update({ status: course!.status === "published" ? "draft" : "published" })
      .eq("id", id);
    load();
  }

  async function addLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!newLesson.title) return;
    await supabase.from("course_lessons").insert({
      course_id: id,
      position: lessons.length + 1,
      title: newLesson.title,
      video_url: newLesson.video_url || null,
    });
    setNewLesson({ title: "", video_url: "" });
    load();
  }

  async function toggleDone(lessonId: string) {
    if (!me) return;
    if (doneIds.has(lessonId)) {
      await supabase
        .from("lesson_done")
        .delete()
        .eq("lesson_id", lessonId)
        .eq("profile_id", me);
    } else {
      await supabase
        .from("lesson_done")
        .insert({ lesson_id: lessonId, profile_id: me });
    }
    load();
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    await supabase.from("course_reviews").upsert({
      course_id: id,
      profile_id: me,
      rating: myReview.rating,
      comment: myReview.comment || null,
    });
    setMyReview({ rating: 5, comment: "" });
    load();
  }

  const field =
    "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-400";

  return (
    <div className="space-y-5">
      <Link
        href="/espace/formations"
        className="text-xs text-zinc-400 hover:text-zinc-200"
      >
        ← Formations
      </Link>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs text-amber-400">
            {formatLabels[course.format] ?? course.format}
          </p>
          <span className="text-lg font-bold text-amber-400">
            {priceLabel(course.price_cents)}
          </span>
        </div>
        <h1 className="mt-1 text-xl font-bold">{course.title}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Par{" "}
          <Link
            href={`/espace/membres/${course.trainer_id}`}
            className="text-amber-400 hover:underline"
          >
            {course.trainer?.full_name}
          </Link>
          {course.trainer?.headline && ` — ${course.trainer.headline}`}
        </p>
        {course.description && (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
            {course.description}
          </p>
        )}
        <p className="mt-3 text-xs text-zinc-500">
          {course.starts_at &&
            `📅 ${new Date(course.starts_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} · `}
          {course.location && `📍 ${course.location} · `}
          {course.duration_text && `⏱ ${course.duration_text} · `}
          👥 {enrollCount} inscrit{enrollCount > 1 ? "s" : ""}
          {course.capacity ? ` / ${course.capacity}` : ""}
          {avg && ` · ⭐ ${avg.toFixed(1)} (${reviews.length} avis)`}
        </p>

        {isTrainer ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-4">
            <button
              onClick={togglePublish}
              className={`rounded-full px-5 py-2 text-sm font-semibold ${
                course.status === "published"
                  ? "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
                  : "bg-amber-400 text-zinc-950 hover:bg-amber-300"
              }`}
            >
              {course.status === "published"
                ? "Repasser en brouillon"
                : "🚀 Publier la formation"}
            </button>
            <span className="text-xs text-zinc-500">
              {course.status === "published"
                ? "Visible par tous les membres"
                : "Brouillon — visible par vous seul"}
            </span>
          </div>
        ) : (
          <div className="mt-4 border-t border-zinc-800 pt-4">
            <button
              onClick={enroll}
              disabled={!enrolled && full}
              className={`w-full rounded-full px-5 py-2.5 text-sm font-semibold ${
                enrolled
                  ? "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
                  : "bg-amber-400 text-zinc-950 hover:bg-amber-300 disabled:opacity-40"
              }`}
            >
              {enrolled
                ? "Inscrit ✓ (cliquer pour se désinscrire)"
                : full
                  ? "Complet"
                  : "S'inscrire"}
            </button>
            {course.price_cents > 0 && !enrolled && (
              <p className="mt-2 text-center text-xs text-zinc-500">
                Paiement directement auprès du formateur (virement ou sur
                place) — le paiement en ligne arrive bientôt.
              </p>
            )}
          </div>
        )}
      </div>

      {(enrolled || isTrainer) && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-400">
              Contenu de la formation
            </h2>
            {enrolled && lessons.length > 0 && (
              <span className="text-xs text-zinc-400">{progress} % terminé</span>
            )}
          </div>
          {lessons.length === 0 ? (
            <p className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-center text-sm text-zinc-500">
              {isTrainer
                ? "Ajoutez votre première leçon ci-dessous."
                : "Le contenu sera ajouté par le formateur."}
            </p>
          ) : (
            <div className="space-y-2">
              {lessons.map((l, i) => (
                <div
                  key={l.id}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3"
                >
                  {!isTrainer && (
                    <input
                      type="checkbox"
                      checked={doneIds.has(l.id)}
                      onChange={() => toggleDone(l.id)}
                      className="h-4 w-4 shrink-0 accent-amber-400"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {i + 1}. {l.title}
                    </p>
                  </div>
                  {l.video_url && (
                    <a
                      href={l.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-full border border-zinc-700 px-3 py-1 text-xs text-amber-400 hover:border-amber-400"
                    >
                      ▶ Voir
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {isTrainer && (
            <form onSubmit={addLesson} className="mt-3 space-y-2">
              <input
                value={newLesson.title}
                onChange={(e) =>
                  setNewLesson({ ...newLesson, title: e.target.value })
                }
                placeholder="Titre de la leçon *"
                className={field}
              />
              <input
                value={newLesson.video_url}
                onChange={(e) =>
                  setNewLesson({ ...newLesson, video_url: e.target.value })
                }
                placeholder="Lien vidéo (YouTube non répertorié, Vimeo…)"
                className={field}
              />
              <button
                type="submit"
                disabled={!newLesson.title}
                className="rounded-full border border-amber-400/50 px-4 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-400/10 disabled:opacity-40"
              >
                + Ajouter la leçon
              </button>
            </form>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-400">
          Avis ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-zinc-500">Pas encore d&apos;avis.</p>
        ) : (
          <div className="space-y-2">
            {reviews.map((r, i) => (
              <div
                key={i}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3"
              >
                <p className="text-xs">
                  {"⭐".repeat(r.rating)}{" "}
                  <span className="text-zinc-500">— {r.author?.full_name}</span>
                </p>
                {r.comment && (
                  <p className="mt-1 text-sm text-zinc-300">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {enrolled && !isTrainer && (
          <form onSubmit={submitReview} className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              Votre note :
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMyReview({ ...myReview, rating: n })}
                  className={n <= myReview.rating ? "" : "opacity-30"}
                >
                  ⭐
                </button>
              ))}
            </div>
            <input
              value={myReview.comment}
              onChange={(e) =>
                setMyReview({ ...myReview, comment: e.target.value })
              }
              placeholder="Votre commentaire (optionnel)"
              className={field}
            />
            <button
              type="submit"
              className="rounded-full border border-amber-400/50 px-4 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-400/10"
            >
              Publier mon avis
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
