import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "WAHS CRM Warning: Supabase environment variables are missing.\n" +
    "Please create a '.env' file in the root of the project with:\n" +
    "VITE_SUPABASE_URL=your_supabase_project_url\n" +
    "VITE_SUPABASE_ANON_KEY=your_supabase_anon_key"
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
