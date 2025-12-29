// supabase/functions/send-reminders/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore: Deno types are handled by the runtime
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // @ts-ignore: Deno is available in the runtime
    const supabase = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    const tomorrowStart = new Date(now)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)
    tomorrowStart.setMinutes(0, 0, 0)
    
    const tomorrowEnd = new Date(tomorrowStart)
    tomorrowEnd.setHours(tomorrowEnd.getHours() + 1)

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        profiles:user_id (username, phone),
        services:service_id (name)
      `)
      .gte('start_time', tomorrowStart.toISOString())
      .lt('start_time', tomorrowEnd.toISOString())
      .eq('status', 'confirmed')

    if (error) throw error

    console.log(`Encontrados ${appointments.length} agendamentos para lembrar.`)

    const results = []
    
    for (const appointment of appointments) {
      const clientName = appointment.client_name.split(' ')[0]
      const serviceName = appointment.services?.name
      const time = new Date(appointment.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      
      const message = `Oi ${clientName}! ✨ Passando para confirmar nosso encontro amanhã às ${time} para fazer seu ${serviceName}. Já deixei tudo preparado. Até lá!`

      console.log(`[SIMULAÇÃO WHATSAPP] Para: ${appointment.client_phone} | Msg: ${message}`)
      
      results.push({
        id: appointment.id,
        status: 'reminder_sent',
        message: message
      })
    }

    return new Response(JSON.stringify({ success: true, processed: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Erro desconhecido' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})