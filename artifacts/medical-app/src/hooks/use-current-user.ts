import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

/**
 * Hook that resolves the current authenticated Supabase user id.
 * Avoids duplicating `supabase.auth.getUser()` + state in every page.
 */
export function useCurrentUser() {
  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
      setLoading(false);
    });
  }, []);

  return { userId, loading };
}
