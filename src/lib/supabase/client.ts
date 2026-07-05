import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Configuration Supabase manquante : copiez .env.example vers .env.local (ou définissez les variables d'environnement sur votre hébergeur), puis redémarrez le serveur."
    );
  }
  return createBrowserClient(url, key);
}
