"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const supabase = createClient();
  const [me, setMe] = useState<string | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("conversation_id", id)
      .order("created_at");
    setMessages((data as Message[]) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setMe(user.id);

      const { data: parts } = await supabase
        .from("conversation_participants")
        .select("profile_id, profile:profiles(full_name)")
        .eq("conversation_id", id);
      const map: Record<string, string> = {};
      (parts ?? []).forEach((p) => {
        map[p.profile_id] =
          (p.profile as unknown as { full_name: string })?.full_name ?? "?";
      });
      setNames(map);

      await load();
      await supabase
        .from("conversation_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", id)
        .eq("profile_id", user.id);
    })();

    // Temps réel + rafraîchissement de secours toutes les 5 s
    const channel = supabase
      .channel(`messages-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${id}`,
        },
        () => load()
      )
      .subscribe();
    const interval = setInterval(load, 5000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !me) return;
    const content = draft.trim();
    setDraft("");
    await supabase
      .from("messages")
      .insert({ conversation_id: id, sender_id: me, content });
    load();
  }

  const otherNames = Object.entries(names)
    .filter(([pid]) => pid !== me)
    .map(([, n]) => n);

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      <div className="mb-3">
        <Link
          href="/espace/messages"
          className="text-xs text-zinc-400 hover:text-zinc-200"
        >
          ← Messages
        </Link>
        <h1 className="text-lg font-bold">
          {otherNames.join(", ") || "Conversation"}
        </h1>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">
            Démarrez la conversation 👋
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === me;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? "bg-amber-400 text-zinc-950"
                    : "bg-zinc-800 text-zinc-100"
                }`}
              >
                {!mine && (
                  <p className="text-[10px] font-semibold text-amber-400">
                    {names[m.sender_id]}
                  </p>
                )}
                <p className="whitespace-pre-wrap">{m.content}</p>
                <p
                  className={`mt-0.5 text-right text-[10px] ${mine ? "text-zinc-800" : "text-zinc-500"}`}
                >
                  {new Date(m.created_at).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Votre message…"
          className="min-w-0 flex-1 rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300 disabled:opacity-40"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
