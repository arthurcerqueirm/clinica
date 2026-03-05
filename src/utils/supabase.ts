import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('ERRO: Credenciais do Supabase não encontradas! Veja o arquivo walkthrough.md para instruções de configuração.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
