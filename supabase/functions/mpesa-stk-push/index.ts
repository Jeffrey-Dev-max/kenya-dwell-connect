import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// M-Pesa API credentials - User needs to add these in Supabase secrets
const MPESA_CONSUMER_KEY = Deno.env.get('MPESA_CONSUMER_KEY') || 'YOUR_CONSUMER_KEY'
const MPESA_CONSUMER_SECRET = Deno.env.get('MPESA_CONSUMER_SECRET') || 'YOUR_CONSUMER_SECRET'
const MPESA_BUSINESS_SHORT_CODE = Deno.env.get('MPESA_BUSINESS_SHORT_CODE') || '174379'
const MPESA_PASSKEY = Deno.env.get('MPESA_PASSKEY') || 'YOUR_PASSKEY'
const MPESA_CALLBACK_URL = Deno.env.get('MPESA_CALLBACK_URL') || 'https://plkwzhjthjopkkcllyjv.supabase.co/functions/v1/mpesa-callback'

// Generate M-Pesa access token
async function generateAccessToken(): Promise<string> {
  const auth = btoa(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`)
  
  const response = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`
    }
  })
  
  const data = await response.json()
  return data.access_token
}

// Generate M-Pesa password
function generatePassword(timestamp: string): string {
  const password = btoa(`${MPESA_BUSINESS_SHORT_CODE}${MPESA_PASSKEY}${timestamp}`)
  return password
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { phone_number, amount, listing_id, user_id } = await req.json()

    if (!phone_number || !amount || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate access token and password
    const accessToken = await generateAccessToken()
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)
    const password = generatePassword(timestamp)

    // Create transaction record first
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: user_id,
        property_id: listing_id,
        amount_kes: amount,
        purpose: 'listing_fee',
        status: 'initiated'
      })
      .select()
      .single()

    if (transactionError) {
      throw transactionError
    }

    // Format phone number to E.164 standard
    let formattedPhone = phone_number.replace(/\s+/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1)
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.slice(1)
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone
    }

    // STK Push request payload
    const stkPushPayload = {
      BusinessShortCode: MPESA_BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: MPESA_BUSINESS_SHORT_CODE,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: `KDC-${transaction.id.slice(-8)}`,
      TransactionDesc: 'Kenya Dwell Connect Listing Fee'
    }

    // Send STK Push request
    const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkPushPayload)
    })

    const stkData = await stkResponse.json()
    console.log('STK Push Response:', stkData)

    if (stkData.ResponseCode === '0') {
      // Update transaction with checkout request ID
      await supabaseClient
        .from('transactions')
        .update({
          raw_payload: stkData,
          status: 'pending'
        })
        .eq('id', transaction.id)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'STK push sent successfully',
          checkout_request_id: stkData.CheckoutRequestID,
          transaction_id: transaction.id
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      // Update transaction status to failed
      await supabaseClient
        .from('transactions')
        .update({ status: 'failed', raw_payload: stkData })
        .eq('id', transaction.id)

      return new Response(
        JSON.stringify({
          success: false,
          error: stkData.errorMessage || 'STK push failed'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})