import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// For client-side auth
export const createSupabaseClient = () => {
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    throw new Error("Missing VITE_SUPABASE_ANON_KEY environment variable");
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};
