import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const callbackData = await req.json()
    console.log('M-Pesa Callback received:', JSON.stringify(callbackData, null, 2))

    const { Body } = callbackData
    if (!Body || !Body.stkCallback) {
      throw new Error('Invalid callback structure')
    }

    const { stkCallback } = Body
    const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback

    if (!CheckoutRequestID) {
      throw new Error('Missing CheckoutRequestID')
    }

    // Find transaction by checkout request ID
    const { data: transaction, error: findError } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('mpesa_checkout_request_id', CheckoutRequestID)
      .single()

    if (findError || !transaction) {
      throw new Error(`Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`)
    }

    let updateData: any = {
      updated_at: new Date().toISOString(),
      mpesa_result_desc: ResultDesc
    }

    if (ResultCode === 0) {
      // Payment successful
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || []
      
      let mpesaReceiptNumber = ''
      let transactionDate = ''
      let phoneNumber = ''
      
      callbackMetadata.forEach((item: any) => {
        if (item.Name === 'MpesaReceiptNumber') {
          mpesaReceiptNumber = item.Value
        } else if (item.Name === 'TransactionDate') {
          transactionDate = item.Value
        } else if (item.Name === 'PhoneNumber') {
          phoneNumber = item.Value.toString()
        }
      })

      updateData = {
        ...updateData,
        status: 'completed',
        mpesa_receipt_number: mpesaReceiptNumber,
        mpesa_transaction_date: transactionDate,
        phone_number: phoneNumber
      }

      // If this was a listing fee payment, activate the listing
      if (transaction.listing_id && transaction.transaction_type === 'listing_fee') {
        const { error: listingError } = await supabaseClient
          .from('properties')
          .update({
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.listing_id)

        if (listingError) {
          console.error('Failed to activate listing:', listingError)
        }
      }

    } else {
      // Payment failed
      updateData.status = 'failed'
      
      // If listing exists, set it back to draft
      if (transaction.listing_id) {
        await supabaseClient
          .from('properties')
          .update({
            status: 'draft',
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.listing_id)
      }
    }

    // Update transaction
    const { error: updateError } = await supabaseClient
      .from('transactions')
      .update(updateData)
      .eq('id', transaction.id)

    if (updateError) {
      throw new Error(`Failed to update transaction: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Callback processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('M-Pesa callback error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})