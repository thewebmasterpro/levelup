import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";

const sections = [
  {
    href: "/espace/chapitres",
    emoji: "#️⃣",
    title: "Chapitres",
    description: "Les espaces de discussion par thématique et par province",
  },
  {
    href: "/espace/evenements",
    emoji: "📅",
    title: "Événements",
    description: "Afterworks, ateliers et rencontres — inscrivez-vous",
  },
  {
    href: "/espace/ressources",
    emoji: "📚",
    title: "Ressources",
    description: "Modèles, guides et outils partagés par la communauté",
  },
  {
    href: "/espace/annonces",
    emoji: "🤝",
    title: "Besoins & Offres",
    description: "Je cherche… / Je propose… — le matching se charge du reste",
  },
  {
    href: "/espace/formations",
    emoji: "🎓",
    title: "Formations",
    description: "Montez en compétences avec les experts de la communauté",
  },
  {
    href: "/espace/matchs",
    emoji: "☕",
    title: "Matchs de la semaine",
    description: "Chaque lundi, 3 membres à rencontrer, choisis pour vous",
  },
  {
    href: "/espace/memoire",
    emoji: "🧠",
    title: "Mémoire du club",
    description: "Cherchez dans tout ce que la communauté a déjà partagé",
  },
  {
    href: "/espace/cercles",
    emoji: "🔒",
    title: "Cercles confidentiels",
    description: "Entre dirigeants vérifiés BCE — parlez vrais chiffres",
  },
];

type KarmaRow = {
  profile_id: string;
  full_name: string;
  avatar_url: string | null;
  points: number;
};

export default async function ClubPage() {
  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ data: monthly }, { data: allTime }] = await Promise.all([
    supabase.rpc("karma_leaderboard", {
      limit_count: 5,
      since: monthStart.toISOString(),
    }),
    supabase.rpc("karma_leaderboard", { limit_count: 5 }),
  ]);
  const topMonth = ((monthly as KarmaRow[]) ?? []).filter((r) => r.points > 0);
  const top = ((allTime as KarmaRow[]) ?? []).filter((r) => r.points > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Le Club</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-amber-400/50"
          >
            <span className="text-2xl">{s.emoji}</span>
            <h2 className="mt-2 font-semibold">{s.title}</h2>
            <p className="mt-1 text-sm text-zinc-400">{s.description}</p>
          </Link>
        ))}
      </div>

      {topMonth.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-400">
            🔥 Top contributeurs du mois
          </h2>
          <div className="space-y-2">
            {topMonth.map((r, i) => (
              <Link
                key={r.profile_id}
                href={`/espace/membres/${r.profile_id}`}
                className="flex items-center justify-between rounded-2xl border border-amber-400/30 bg-amber-400/5 p-3 transition hover:border-amber-400/60"
              >
                <span className="flex items-center gap-3">
                  <span className="w-5 text-center font-bold text-amber-400">
                    {i + 1}
                  </span>
                  <Avatar url={r.avatar_url} name={r.full_name} size="sm" />
                  <span className="text-sm font-medium">{r.full_name}</span>
                </span>
                <span className="text-sm font-semibold text-amber-400">
                  {r.points} pts
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {top.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-400">
            🏆 Classement général
          </h2>
          <div className="space-y-2">
            {top.map((r, i) => (
              <Link
                key={r.profile_id}
                href={`/espace/membres/${r.profile_id}`}
                className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 transition hover:border-amber-400/50"
              >
                <span className="flex items-center gap-3">
                  <span className="w-5 text-center font-bold text-amber-400">
                    {i + 1}
                  </span>
                  <Avatar url={r.avatar_url} name={r.full_name} size="sm" />
                  <span className="text-sm font-medium">{r.full_name}</span>
                </span>
                <span className="text-sm font-semibold text-amber-400">
                  {r.points} pts
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Les points se gagnent en aidant : réponses, meilleures réponses,
            propositions retenues, ressources et formations partagées.
          </p>
        </section>
      )}
    </div>
  );
}
