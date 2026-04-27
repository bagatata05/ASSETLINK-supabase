import { createClient } from "@supabase/supabase-js"
import { Database } from "./supabase-types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing. Status tracking will be disabled.")
}

export const supabase = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseKey || "placeholder-key"
)
