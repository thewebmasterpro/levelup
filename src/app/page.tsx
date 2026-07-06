import Link from "next/link";

const piliers = [
  {
    titre: "Échanger",
    description:
      "Des espaces de discussion par thématique, par région et par secteur : posez vos questions, partagez vos retours d'expérience.",
  },
  {
    titre: "Réseauter",
    description:
      "Un annuaire de membres qualifié avec mise en relation directe. Trouvez des pairs, des partenaires, des associés près de chez vous.",
  },
  {
    titre: "Se former",
    description:
      "Des formations proposées par des experts de la communauté : ateliers, webinaires et parcours en ligne.",
  },
  {
    titre: "Partager",
    description:
      "Une bibliothèque de ressources capitalisée : modèles de documents, guides pratiques, replays.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-zinc-950 text-zinc-100">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span>
            LevelUp<span className="text-amber-400">Now</span>
          </span>
          <span className="rounded-full border border-amber-400/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
            bêta
          </span>
        </span>
        <Link
          href="/login"
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium transition hover:border-amber-400 hover:text-amber-400"
        >
          Se connecter
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-16 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Le réseau privé des entrepreneurs qui avancent{" "}
          <span className="text-amber-400">ensemble</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          Échangez avec des pairs, développez votre réseau par région et par
          secteur, accédez à des formations d&apos;experts. Une communauté
          qualifiée, sur candidature.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/login?mode=signup"
            className="rounded-full bg-amber-400 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-amber-300"
          >
            Rejoindre le club
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-zinc-700 px-6 py-3 font-semibold transition hover:border-zinc-500"
          >
            J&apos;ai déjà un compte
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 sm:grid-cols-2">
        {piliers.map((p) => (
          <div
            key={p.titre}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"
          >
            <h2 className="text-lg font-semibold text-amber-400">{p.titre}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {p.description}
            </p>
          </div>
        ))}
      </section>

      <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} LevelUpNow (bêta) — La communauté des
        entrepreneurs
      </footer>
    </main>
  );
}
