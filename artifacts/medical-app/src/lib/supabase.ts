import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

let clientInstance: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (!clientInstance) {
    clientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  }
  return clientInstance;
}

// Singleton export for direct import
export const supabase = createClient();