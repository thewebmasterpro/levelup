"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Step = { done: boolean; label: string; href: string };

export default function OnboardingChecklist() {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem("onboarding-dismissed") === "1");
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: p }, { count: regions }, { count: sectors }, { count: chapters }, { count: posts }, { count: companies }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("avatar_url, headline, bio")
            .eq("id", user.id)
            .single(),
          supabase
            .from("profile_regions")
            .select("region_id", { count: "exact", head: true })
            .eq("profile_id", user.id),
          supabase
            .from("profile_sectors")
            .select("sector_id", { count: "exact", head: true })
            .eq("profile_id", user.id),
          supabase
            .from("chapter_members")
            .select("chapter_id", { count: "exact", head: true })
            .eq("profile_id", user.id),
          supabase
            .from("posts")
            .select("id", { count: "exact", head: true })
            .eq("author_id", user.id),
          supabase
            .from("companies")
            .select("id", { count: "exact", head: true })
            .eq("owner_id", user.id),
        ]);

      setSteps([
        {
          done: !!p?.avatar_url,
          label: "Ajoutez votre photo",
          href: "/espace/profil",
        },
        {
          done: !!(p?.headline || p?.bio),
          label: "Complétez votre accroche ou bio",
          href: "/espace/profil",
        },
        {
          done: (companies ?? 0) > 0,
          label: "Renseignez votre entreprise (et son n° BCE)",
          href: "/espace/profil",
        },
        {
          done: (regions ?? 0) > 0 && (sectors ?? 0) > 0,
          label: "Choisissez vos provinces et secteurs",
          href: "/espace/profil",
        },
        {
          done: (chapters ?? 0) > 0,
          label: "Rejoignez un chapitre",
          href: "/espace/chapitres",
        },
        {
          done: (posts ?? 0) > 0,
          label: "Présentez-vous sur le fil",
          href: "/espace",
        },
      ]);
    })();
  }, []);

  if (dismissed || !steps) return null;
  const remaining = steps.filter((s) => !s.done);
  if (remaining.length === 0) return null;
  const progress = Math.round(
    ((steps.length - remaining.length) / steps.length) * 100
  );

  return (
    <div className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold text-amber-400">
          👋 Bienvenue ! Complétez votre arrivée ({progress} %)
        </h2>
        <button
          onClick={() => {
            localStorage.setItem("onboarding-dismissed", "1");
            setDismissed(true);
          }}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          Masquer
        </button>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ul className="mt-3 space-y-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className={s.done ? "text-emerald-400" : "text-zinc-600"}>
              {s.done ? "✓" : "○"}
            </span>
            {s.done ? (
              <span className="text-zinc-500 line-through">{s.label}</span>
            ) : (
              <Link href={s.href} className="text-zinc-200 hover:text-amber-400">
                {s.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
