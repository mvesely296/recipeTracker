import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';

const DEV_USER_ID = '00000000-0000-0000-0000-000000000000';

function isLocalDevWithoutSupabase() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export async function createSupabaseServerClient() {
  // In local dev without Supabase, return a direct Postgres client via supabase-js
  // using the local Docker database
  if (isLocalDevWithoutSupabase()) {
    // Return a minimal client that uses the local Postgres directly
    // For local dev, we use supabase-js pointed at a dummy URL but queries
    // will go through the route handler's direct DB access instead
    return createClient('http://localhost:54321', 'dev-anon-key', {
      auth: { persistSession: false },
    });
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Handle cookies in edge runtime
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Handle cookies in edge runtime
          }
        },
      },
    }
  );
}

export async function getAuthenticatedUser() {
  // In local dev without Supabase, return a fake dev user
  if (isLocalDevWithoutSupabase()) {
    const headerStore = await headers();
    const userId = headerStore.get('x-user-id') || DEV_USER_ID;
    return {
      id: userId,
      email: 'dev@localhost',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as any;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
