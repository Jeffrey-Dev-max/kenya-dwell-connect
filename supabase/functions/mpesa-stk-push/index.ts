import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const generateAccessToken = async () => {
  const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY')
  const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET')
  
  const auth = btoa(`${consumerKey}:${consumerSecret}`)
  
  const response = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
    },
  })
  
  const data = await response.json()
  return data.access_token
}

const generatePassword = (timestamp: string) => {
  const businessShortCode = Deno.env.get('MPESA_BUSINESS_SHORT_CODE')
  const passkey = Deno.env.get('MPESA_PASSKEY')
  return btoa(`${businessShortCode}${passkey}${timestamp}`)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate access token
    const accessToken = await generateAccessToken()
    
    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const password = generatePassword(timestamp)
    
    // Create transaction record first
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id,
        listing_id,
        amount: parseFloat(amount),
        phone_number,
        transaction_type: 'listing_fee',
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (transactionError) {
      throw new Error(`Transaction creation failed: ${transactionError.message}`)
    }

    // Format phone number (remove + and ensure 254 prefix)
    let formattedPhone = phone_number.replace(/\+/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1)
    }
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone
    }

    // STK Push request
    const stkPushPayload = {
      BusinessShortCode: Deno.env.get('MPESA_BUSINESS_SHORT_CODE'),
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: Deno.env.get('MPESA_BUSINESS_SHORT_CODE'),
      PhoneNumber: formattedPhone,
      CallBackURL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`,
      AccountReference: `LISTING-${transaction.id}`,
      TransactionDesc: 'Kenya Dwell Connect Listing Fee'
    }

    const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPushPayload)
    })

    const stkData = await stkResponse.json()

    if (stkData.ResponseCode === '0') {
      // Update transaction with checkout request ID
      await supabaseClient
        .from('transactions')
        .update({
          mpesa_checkout_request_id: stkData.CheckoutRequestID,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'STK push sent successfully',
          checkout_request_id: stkData.CheckoutRequestID,
          transaction_id: transaction.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      throw new Error(`STK Push failed: ${stkData.ResponseDescription}`)
    }

  } catch (error) {
    console.error('STK Push error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})