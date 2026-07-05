import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const chapterTypeLabels: Record<string, string> = {
  thematic: "Thématique",
  region: "Région",
  sector: "Secteur",
};

export default async function EspacePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, status, role")
    .eq("id", user.id)
    .single();

  const approved = profile?.status === "approved";

  const { data: chapters } = approved
    ? await supabase
        .from("chapters")
        .select("id, type, slug, name, description")
        .order("type")
        .order("name")
    : { data: null };

  return (
    <main className="min-h-screen w-full bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Biz<span className="text-amber-400">Club</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">
              {profile?.full_name ?? user.email}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-full border border-zinc-700 px-4 py-1.5 text-sm transition hover:border-zinc-500"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {!approved ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-amber-400/30 bg-amber-400/5 p-8 text-center">
            <h1 className="text-xl font-semibold text-amber-400">
              Candidature en cours d&apos;examen
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              Merci {profile?.full_name} ! Votre candidature a bien été reçue.
              L&apos;équipe BizClub valide chaque nouveau membre pour garantir
              la qualité de la communauté. Vous recevrez un email dès que votre
              accès sera activé.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold">
              Bienvenue, {profile?.full_name} 👋
            </h1>
            <p className="mt-1 text-zinc-400">
              Voici les espaces de discussion de la communauté.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(chapters ?? []).map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-amber-400">
                    {chapterTypeLabels[c.type] ?? c.type}
                  </span>
                  <h2 className="mt-1 font-semibold">{c.name}</h2>
                  {c.description && (
                    <p className="mt-1 text-sm text-zinc-400">
                      {c.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
