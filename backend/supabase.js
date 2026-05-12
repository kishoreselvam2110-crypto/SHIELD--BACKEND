import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabaseInstance = null;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase credentials missing. Database features will be disabled.");
} else {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error("❌ Failed to initialize Supabase client:", error.message);
  }
}

export const supabase = supabaseInstance;
