import { createClient } from '@supabase/supabase-js';

// Configuration sécurisée via variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dummy-project.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bW15LXByb2plY3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxOTU2NTcxMjAwfQ.dummy_key_for_testing'

// Désactiver Supabase si les variables sont factices
const isDummyConfig = supabaseUrl.includes('dummy-project')

export const supabase = isDummyConfig ? null : createClient(supabaseUrl, supabaseKey)
