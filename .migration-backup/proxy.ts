// File: proxy.ts (in your root directory)
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  // This executes the logic to refresh your session
  return await updateSession(request);
}

// This tells Next.js which pages to "guard"
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
