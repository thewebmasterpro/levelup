"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/components/PostFeed";

type ConvRow = {
  id: string;
  title: string | null;
  is_confidential: boolean;
  others: string[];
  lastMessage: { content: string; created_at: string } | null;
};

export default function MessagesPage() {
  const supabase = createClient();
  const [convs, setConvs] = useState<ConvRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: mine } = await supabase
        .from("conversation_participants")
        .select("conversation_id, conversation:conversations(id, title, is_confidential)")
        .eq("profile_id", user.id);

      const ids = (mine ?? []).map((m) => m.conversation_id);
      if (ids.length === 0) {
        setConvs([]);
        setLoading(false);
        return;
      }

      const [{ data: parts }, { data: msgs }] = await Promise.all([
        supabase
          .from("conversation_participants")
          .select("conversation_id, profile:profiles(full_name)")
          .in("conversation_id", ids)
          .neq("profile_id", user.id),
        supabase
          .from("messages")
          .select("conversation_id, content, created_at")
          .in("conversation_id", ids)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      const rows: ConvRow[] = (mine ?? []).map((m) => {
        const conv = m.conversation as unknown as {
          id: string;
          title: string | null;
          is_confidential: boolean;
        };
        const others = (parts ?? [])
          .filter((p) => p.conversation_id === m.conversation_id)
          .map(
            (p) =>
              (p.profile as unknown as { full_name: string })?.full_name ?? "?"
          );
        const lastMessage =
          (msgs ?? []).find((x) => x.conversation_id === m.conversation_id) ??
          null;
        return {
          id: conv.id,
          title: conv.title,
          is_confidential: conv.is_confidential ?? false,
          others,
          lastMessage,
        };
      });

      rows.sort(
        (a, b) =>
          (b.lastMessage ? Date.parse(b.lastMessage.created_at) : 0) -
          (a.lastMessage ? Date.parse(a.lastMessage.created_at) : 0)
      );
      setConvs(rows);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading)
    return <p className="py-8 text-center text-sm text-zinc-500">Chargement…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Messages</h1>
      {convs.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          Aucune conversation.{" "}
          <Link href="/espace/annuaire" className="text-amber-400 hover:underline">
            Trouvez un membre dans l&apos;annuaire
          </Link>{" "}
          pour démarrer un échange.
        </p>
      ) : (
        <div className="space-y-2">
          {convs.map((c) => (
            <Link
              key={c.id}
              href={`/espace/messages/${c.id}`}
              className="block rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-600"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold">
                  {c.is_confidential && "🔒 "}
                  {c.title ?? c.others.join(", ") ?? "Conversation"}
                </p>
                {c.lastMessage && (
                  <span className="shrink-0 text-xs text-zinc-500">
                    {formatDate(c.lastMessage.created_at)}
                  </span>
                )}
              </div>
              {c.lastMessage && (
                <p className="mt-1 truncate text-sm text-zinc-400">
                  {c.lastMessage.content}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
