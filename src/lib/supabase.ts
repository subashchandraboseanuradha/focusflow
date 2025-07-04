import { createBrowserClient } from '@supabase/ssr'

// For client-side usage (e.g., in React components)
export const createClientComponentClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
