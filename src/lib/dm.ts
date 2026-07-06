import { createClient } from "@/lib/supabase/client";

// Trouve la conversation 1-à-1 existante avec `other`, ou la crée.
export async function ensureDm(me: string, other: string): Promise<string> {
  const supabase = createClient();

  const { data: mine } = await supabase
    .from("conversation_participants")
    .select("conversation_id, conversation:conversations(is_group)")
    .eq("profile_id", me);

  const dmIds = (mine ?? [])
    .filter(
      (m) => !(m.conversation as unknown as { is_group: boolean })?.is_group
    )
    .map((m) => m.conversation_id);

  if (dmIds.length > 0) {
    const { data: hits } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("profile_id", other)
      .in("conversation_id", dmIds);
    if (hits && hits.length > 0) return hits[0].conversation_id;
  }

  // Id généré côté client : la policy RLS ne rend la conversation visible
  // qu'à ses participants, on ne peut donc pas relire la ligne avant de
  // s'être ajouté comme participant.
  const convId = crypto.randomUUID();
  const { error } = await supabase
    .from("conversations")
    .insert({ id: convId, created_by: me });
  if (error) throw new Error(error.message);

  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: convId, profile_id: me },
      { conversation_id: convId, profile_id: other },
    ]);
  if (partError) throw new Error(partError.message);

  return convId;
}
