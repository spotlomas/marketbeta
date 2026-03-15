import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://mhfuoxhmgmvxoeritnro.supabase.co"
const supabaseKey = "sb_publishable_LiPNqZAayDJXQLoyZF0sqQ_6vCqqigg"
export const supabase = createClient(supabaseUrl, supabaseKey)