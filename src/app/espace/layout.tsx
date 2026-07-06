import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import NotificationsBell from "@/components/NotificationsBell";

export default async function EspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
  const staff = ["admin", "moderator"].includes(profile?.role ?? "");

  return (
    <div className="flex min-h-screen w-full flex-col bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link
            href="/espace"
            className="flex items-center gap-1.5 text-lg font-bold tracking-tight"
          >
            <span>
              LevelUp<span className="text-amber-400">Now</span>
            </span>
            <span className="rounded-full border border-amber-400/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-400">
              bêta
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {approved && <NotificationsBell />}
            {staff && (
              <Link
                href="/espace/admin"
                className="rounded-full border border-amber-400/40 px-3 py-1 text-xs font-medium text-amber-400 transition hover:bg-amber-400/10"
              >
                Admin
              </Link>
            )}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 transition hover:border-zinc-500"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-5">
        {approved ? (
          children
        ) : (
          <div className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-8 text-center">
            <h1 className="text-xl font-semibold text-amber-400">
              Candidature en cours d&apos;examen
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              Merci {profile?.full_name} ! Votre candidature a bien été reçue.
              L&apos;équipe LevelUpNow valide chaque nouveau membre pour garantir
              la qualité de la communauté. Vous recevrez un email dès que votre
              accès sera activé.
            </p>
          </div>
        )}
      </main>

      {approved && <BottomNav />}
    </div>
  );
}
