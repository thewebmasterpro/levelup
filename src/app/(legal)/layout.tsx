import Link from "next/link";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen w-full bg-zinc-950 text-zinc-100">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span>
            LevelUp<span className="text-amber-400">Now</span>
          </span>
          <span className="rounded-full border border-amber-400/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
            bêta
          </span>
        </Link>
        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← Accueil
        </Link>
      </header>
      <article className="prose-invert mx-auto max-w-3xl px-6 pb-20 text-sm leading-relaxed text-zinc-300 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-zinc-100 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-amber-400 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1">
        {children}
      </article>
    </main>
  );
}
