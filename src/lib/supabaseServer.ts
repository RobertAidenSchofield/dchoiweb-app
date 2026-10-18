import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let serverInstance: SupabaseClient | null = null;

/**
 * Returns a server-side Supabase client with administrative / service-role capabilities when available.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (serverInstance) return serverInstance;

  if (supabaseUrl && supabaseServiceKey) {
    try {
      serverInstance = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      return serverInstance;
    } catch (err) {
      console.warn('Failed to initialize server Supabase client:', err);
      return null;
    }
  }

  return null;
}

