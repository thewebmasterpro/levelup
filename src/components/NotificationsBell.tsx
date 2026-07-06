"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NotificationsBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    async function refresh() {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);
      setUnread(count ?? 0);
    }
    refresh();
    const interval = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return (
    <Link
      href="/espace/notifications"
      aria-label="Notifications"
      className="relative rounded-full border border-zinc-700 p-1.5 text-zinc-300 transition hover:border-zinc-500"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-bold text-zinc-950">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
