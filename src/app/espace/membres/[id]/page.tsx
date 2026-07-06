"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensureDm } from "@/lib/dm";
import Avatar from "@/components/Avatar";

type Member = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  city: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  companies: {
    id: string;
    name: string;
    role_title: string | null;
    city: string | null;
    website_url: string | null;
  }[];
  profile_regions: { region: { name: string } | null }[];
  profile_sectors: { sector: { name: string } | null }[];
};

type Connection = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
};

export default function MembrePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const supabase = createClient();
  const router = useRouter();
  const [me, setMe] = useState<string | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [conn, setConn] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setMe(user.id);
    const [{ data: m }, { data: c }] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, full_name, avatar_url, headline, bio, city, website_url, linkedin_url, companies(id, name, role_title, city, website_url), profile_regions(region:regions(name)), profile_sectors(sector:sectors(name))"
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("connections")
        .select("id, requester_id, addressee_id, status")
        .or(
          `and(requester_id.eq.${user.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${user.id})`
        )
        .maybeSingle(),
    ]);
    setMember(m as unknown as Member | null);
    setConn(c as Connection | null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function request() {
    if (!me) return;
    await supabase
      .from("connections")
      .insert({ requester_id: me, addressee_id: id });
    load();
  }

  async function accept() {
    if (!conn) return;
    await supabase
      .from("connections")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", conn.id);
    load();
  }

  async function message() {
    if (!me) return;
    const convId = await ensureDm(me, id);
    router.push(`/espace/messages/${convId}`);
  }

  if (loading)
    return <p className="py-8 text-center text-sm text-zinc-500">Chargement…</p>;

  if (!member)
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        Membre introuvable ou profil privé.{" "}
        <Link href="/espace/annuaire" className="text-amber-400 hover:underline">
          Retour à l&apos;annuaire
        </Link>
      </p>
    );

  const isMe = me === member.id;

  return (
    <div className="space-y-5">
      <Link
        href="/espace/annuaire"
        className="text-xs text-zinc-400 hover:text-zinc-200"
      >
        ← Annuaire
      </Link>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex items-start gap-4">
          <Avatar url={member.avatar_url} name={member.full_name} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">{member.full_name}</h1>
            {member.headline && (
              <p className="text-sm text-zinc-400">{member.headline}</p>
            )}
            {member.city && (
              <p className="mt-1 text-xs text-zinc-500">📍 {member.city}</p>
            )}
          </div>
        </div>

        {member.bio && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
            {member.bio}
          </p>
        )}

        <p className="mt-3 flex flex-wrap gap-1">
          {member.profile_regions.map(
            (r, i) =>
              r.region && (
                <span
                  key={i}
                  className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300"
                >
                  📍 {r.region.name}
                </span>
              )
          )}
          {member.profile_sectors.map(
            (s, i) =>
              s.sector && (
                <span
                  key={i}
                  className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300"
                >
                  {s.sector.name}
                </span>
              )
          )}
        </p>

        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {member.website_url && (
            <a
              href={member.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline"
            >
              🌐 Site web
            </a>
          )}
          {member.linkedin_url && (
            <a
              href={member.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline"
            >
              💼 LinkedIn
            </a>
          )}
        </div>

        {!isMe && (
          <div className="mt-4 flex gap-2 border-t border-zinc-800 pt-4">
            {!conn && (
              <button
                onClick={request}
                className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
              >
                Se connecter
              </button>
            )}
            {conn?.status === "pending" && conn.requester_id === me && (
              <span className="rounded-full border border-zinc-700 px-5 py-2 text-sm text-zinc-400">
                Demande envoyée
              </span>
            )}
            {conn?.status === "pending" && conn.addressee_id === me && (
              <button
                onClick={accept}
                className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
              >
                Accepter la demande
              </button>
            )}
            {conn?.status === "accepted" && (
              <button
                onClick={message}
                className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
              >
                💬 Envoyer un message
              </button>
            )}
          </div>
        )}
      </div>

      {member.companies.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-400">
            Entreprises
          </h2>
          <div className="space-y-2">
            {member.companies.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
              >
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-zinc-400">
                  {[c.role_title, c.city].filter(Boolean).join(" · ")}
                </p>
                {c.website_url && (
                  <a
                    href={c.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-amber-400 hover:underline"
                  >
                    {c.website_url}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
