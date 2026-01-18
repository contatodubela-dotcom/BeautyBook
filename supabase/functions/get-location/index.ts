import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // O Cloudflare (e o Supabase Edge) injetam esse header automaticamente
  // Se estiver rodando local, ele pode vir vazio, então assumimos 'US' para teste
  const country = req.headers.get('cf-ipcountry') || 'US'

  console.log(`📍 User connecting from: ${country}`)

  return new Response(
    JSON.stringify({ country }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  )
})