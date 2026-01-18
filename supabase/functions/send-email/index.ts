import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { to, subject, clientName, serviceName, date, time, type } = await req.json()
    
    console.log(`Tentando enviar email para: ${to}`);

    // MUDANÇA CRUCIAL: Usando seu domínio verificado
    // Se não for este e-mail, o Resend BLOQUEIA o envio para Hotmail/Gmail.
    const fromEmail = 'Cleverya <nao-responda@cleverya.com>'; 

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: subject,
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h1 style="color: #d4af37;">${type === 'confirmation' ? '✅ Agendamento Confirmado' : '⏰ Lembrete'}</h1>
            <p>Olá <strong>${clientName}</strong>,</p>
            <p>Seu horário para <strong>${serviceName}</strong> está reservado.</p>
            <div style="background: #fdf8f6; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
               <p style="margin: 5px 0;">📅 <strong>Data:</strong> ${date}</p>
               <p style="margin: 5px 0;">⏰ <strong>Horário:</strong> ${time}</p>
            </div>
            <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #888;">Cleverya App</p>
          </div>
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error("Erro Resend:", data);
      // Retorna erro mas não trava o 500 genérico
      return new Response(JSON.stringify({ error: data }), { status: 400, headers: corsHeaders }) 
    }

    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error("Erro Crítico:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})