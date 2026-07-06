"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        });
        if (error) {
          setError(error.message);
          return;
        }
        if (data.session) {
          router.push("/espace");
          return;
        }
        setInfo(
          "Candidature envoyée ! Vérifiez votre boîte mail pour confirmer votre adresse."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(
            error.message === "Email not confirmed"
              ? "Votre adresse email n'est pas encore confirmée : cliquez sur le lien reçu par email."
              : "Email ou mot de passe incorrect."
          );
          return;
        }
        router.push("/espace");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de joindre le serveur. Vérifiez votre connexion et la configuration."
      );
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-xl font-semibold">
            {mode === "signup" ? "Rejoindre le club" : "Se connecter"}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {mode === "signup"
              ? "Votre candidature sera examinée par l'équipe avant d'accéder à la communauté."
              : "Heureux de vous revoir."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium">
                  Nom complet
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Mot de passe
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

            {mode === "signin" && (
              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  setInfo(null);
                  if (!email) {
                    setError(
                      "Renseignez d'abord votre email, puis recliquez sur « Mot de passe oublié ? »."
                    );
                    return;
                  }
                  const supabase = createClient();
                  const { error } = await supabase.auth.resetPasswordForEmail(
                    email,
                    { redirectTo: `${window.location.origin}/mot-de-passe` }
                  );
                  if (error) setError(error.message);
                  else
                    setInfo(
                      "Email de réinitialisation envoyé — vérifiez votre boîte mail."
                    );
                }}
                className="text-xs text-zinc-400 hover:text-amber-400"
              >
                Mot de passe oublié ?
              </button>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
            {info && <p className="text-sm text-emerald-400">{info}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-400 px-4 py-2.5 font-semibold text-zinc-950 transition hover:bg-amber-300 disabled:opacity-50"
            >
              {loading
                ? "Un instant…"
                : mode === "signup"
                  ? "Envoyer ma candidature"
                  : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-400">
          {mode === "signup" ? (
            <>
              Déjà membre ?{" "}
              <button
                onClick={() => setMode("signin")}
                className="font-medium text-amber-400 hover:underline"
              >
                Se connecter
              </button>
            </>
          ) : (
            <>
              Pas encore membre ?{" "}
              <button
                onClick={() => setMode("signup")}
                className="font-medium text-amber-400 hover:underline"
              >
                Rejoindre le club
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
