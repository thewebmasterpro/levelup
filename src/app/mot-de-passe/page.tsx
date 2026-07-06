"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MotDePassePage() {
  const supabase = createClient();
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Le lien de réinitialisation arrive avec un code que le client échange
    // automatiquement contre une session — on attend qu'elle soit disponible.
    let tries = 0;
    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setReady(true);
      } else if (tries++ < 5) {
        setTimeout(check, 700);
      } else {
        setReady(false);
      }
    };
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/espace");
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-zinc-950 px-6 text-zinc-100">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-2xl font-bold"
        >
          <span>
            LevelUp<span className="text-amber-400">Now</span>
          </span>
          <span className="rounded-full border border-amber-400/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
            bêta
          </span>
        </Link>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
          <h1 className="text-xl font-semibold">Nouveau mot de passe</h1>

          {ready === null && (
            <p className="mt-4 text-sm text-zinc-400">Vérification…</p>
          )}

          {ready === false && (
            <p className="mt-4 text-sm text-zinc-400">
              Ce lien n&apos;est plus valide ou vous n&apos;êtes pas connecté.{" "}
              <Link href="/login" className="text-amber-400 hover:underline">
                Retour à la connexion
              </Link>
            </p>
          )}

          {ready && (
            <form onSubmit={save} className="mt-6 space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium">
                  Nouveau mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium">
                  Confirmez le mot de passe
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-amber-400 px-4 py-2.5 font-semibold text-zinc-950 transition hover:bg-amber-300 disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : "Changer le mot de passe"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
