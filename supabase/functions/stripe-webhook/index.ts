import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

// Configurações
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})
const cryptoProvider = Stripe.createSubtleCryptoProvider()

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('Stripe Webhook function loaded')

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()

  let event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!,
      undefined,
      cryptoProvider
    )
  } catch (err) {
    console.error(`⚠️  Webhook signature verification failed.`, err.message)
    return new Response(err.message, { status: 400 })
  }

  // LOGICA PRINCIPAL
  try {
    switch (event.type) {
      // 1. OCORRE NA PRIMEIRA COMPRA (Checkout)
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.client_reference_id // O ID do usuário que enviamos no botão de compra
        const customerId = session.customer
        const subscriptionId = session.subscription
        
        console.log(`💰 Checkout completed for user: ${userId}`)

        if (userId && customerId) {
          // Busca detalhes da assinatura para saber qual produto foi comprado
          const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)
          const planType = getPlanTypeFromProduct(subscription) // Função auxiliar abaixo

          // ATUALIZAÇÃO SEGURA: Busca o Business onde este user é o DONO (owner_id)
          const { error } = await supabase
            .from('businesses')
            .update({
              stripe_customer_id: customerId,
              subscription_status: 'active',
              plan_type: planType,
              subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('owner_id', userId) 

          if (error) console.error('❌ Error updating business from checkout:', error)
          else console.log('✅ Business updated successfully from checkout')
        }
        break
      }

      // 2. OCORRE QUANDO A ASSINATURA RENOVA, CANCELA OU MUDA
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer
        const status = subscription.status
        const planType = getPlanTypeFromProduct(subscription)

        console.log(`🔄 Subscription updated: ${customerId} -> ${status}`)

        // Aqui buscamos direto pelo ID do Stripe, pois já foi salvo no passo 1
        const { error } = await supabase
          .from('businesses')
          .update({
            subscription_status: status,
            plan_type: planType,
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        if (error) console.error('❌ Error updating business subscription:', error)
        else console.log('✅ Business subscription updated')
        break
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err)
    return new Response('Webhook handler failed', { status: 400 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// --- HELPER: Descobre se é PRO ou BUSINESS baseado no preço/produto ---
// Você pode ajustar esses IDs ou nomes conforme seus produtos no Stripe
function getPlanTypeFromProduct(subscription: any): string {
  // Tenta pegar do metadata se você configurou lá
  const metadataPlan = subscription.metadata?.plan_type
  if (metadataPlan) return metadataPlan

  // Lógica de fallback baseada no valor (Simplificado para seu caso)
  // Olhando seus links: Pro ~29.90, Business ~59.90
  const priceAmount = subscription.items?.data[0]?.price?.unit_amount || 0
  
  if (priceAmount > 4000) return 'business' // Acima de R$ 40,00
  if (priceAmount > 0) return 'pro'         // Qualquer outro valor pago
  
  return 'free'
}