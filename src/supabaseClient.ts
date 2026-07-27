import { createClient } from '@supabase/supabase-js'

const supabaseUrl = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || (process.env as any).VITE_SUPABASE_URL) 
  : (process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);

const supabaseAnonKey = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (process.env as any).VITE_SUPABASE_ANON_KEY)
  : (process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "WAHS CRM Warning: Supabase environment variables are missing.\n" +
    "Please create a '.env' file in the root of the project with:\n" +
    "NEXT_PUBLIC_VITE_SUPABASE_URL=your_supabase_project_url\n" +
    "NEXT_PUBLIC_VITE_SUPABASE_ANON_KEY=your_supabase_anon_key"
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
