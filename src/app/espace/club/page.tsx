import Link from "next/link";

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
    description:
      "Je cherche… / Je propose… — le matching se charge du reste",
  },
];

export default function ClubPage() {
  return (
    <div className="space-y-4">
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
    </div>
  );
}
