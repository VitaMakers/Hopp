"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client, used for direct file uploads to Storage. Reads
// the session from the cookies the SSR client already set.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
