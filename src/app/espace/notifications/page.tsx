"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/components/PostFeed";

type Notification = {
  id: string;
  kind: string;
  message: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

const kindIcons: Record<string, string> = {
  connection_request: "🤝",
  connection_accepted: "✅",
  comment: "💬",
  approved: "🎉",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, kind, message, link, read_at, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      setNotifications((data as Notification[]) ?? []);
      setLoading(false);
      // Tout marquer comme lu
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null);
    })();
  }, []);

  if (loading)
    return <p className="py-8 text-center text-sm text-zinc-500">Chargement…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Notifications</h1>
      {notifications.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          Aucune notification pour l&apos;instant.
        </p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const inner = (
              <div
                className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                  n.read_at
                    ? "border-zinc-800 bg-zinc-900/40"
                    : "border-amber-400/30 bg-amber-400/5"
                } ${n.link ? "hover:border-zinc-600" : ""}`}
              >
                <span className="text-lg">{kindIcons[n.kind] ?? "🔔"}</span>
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200">{n.message}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {formatDate(n.created_at)}
                  </p>
                </div>
              </div>
            );
            return n.link ? (
              <Link key={n.id} href={n.link} className="block">
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
