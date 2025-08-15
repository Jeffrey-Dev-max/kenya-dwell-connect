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
    // Get user from auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use service role for database operations
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user is admin
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, data } = await req.json()

    let result = {}

    switch (action) {
      case 'ban_user':
        const { user_id, reason, phone_number } = data
        
        // Add to ban list
        const { error: banError } = await serviceClient
          .from('ban_list')
          .insert({
            user_id,
            phone_number,
            reason,
            banned_by: user.id,
            created_at: new Date().toISOString()
          })

        if (banError) {
          throw new Error(`Ban user failed: ${banError.message}`)
        }

        // Deactivate user's listings
        await serviceClient
          .from('properties')
          .update({ status: 'inactive' })
          .eq('owner_id', user_id)

        result = { success: true, message: 'User banned successfully' }
        break

      case 'unban_user':
        const { unban_user_id } = data
        
        const { error: unbanError } = await serviceClient
          .from('ban_list')
          .delete()
          .eq('user_id', unban_user_id)

        if (unbanError) {
          throw new Error(`Unban user failed: ${unbanError.message}`)
        }

        result = { success: true, message: 'User unbanned successfully' }
        break

      case 'update_listing_fee':
        const { new_fee } = data
        
        const { error: feeError } = await serviceClient
          .from('listing_fees')
          .upsert({
            id: 1,
            amount: parseFloat(new_fee),
            updated_at: new Date().toISOString()
          })

        if (feeError) {
          throw new Error(`Update listing fee failed: ${feeError.message}`)
        }

        result = { success: true, message: 'Listing fee updated successfully' }
        break

      case 'remove_listing':
        const { listing_id, removal_reason } = data
        
        const { error: removeError } = await serviceClient
          .from('properties')
          .update({
            status: 'removed',
            removal_reason,
            updated_at: new Date().toISOString()
          })
          .eq('id', listing_id)

        if (removeError) {
          throw new Error(`Remove listing failed: ${removeError.message}`)
        }

        result = { success: true, message: 'Listing removed successfully' }
        break

      case 'get_analytics':
        // Get analytics data
        const { data: totalUsers } = await serviceClient
          .from('profiles')
          .select('id', { count: 'exact' })

        const { data: totalProperties } = await serviceClient
          .from('properties')
          .select('id', { count: 'exact' })
          .eq('status', 'active')

        const { data: totalTransactions } = await serviceClient
          .from('transactions')
          .select('amount', { count: 'exact' })
          .eq('status', 'completed')

        const { data: revenueData } = await serviceClient
          .from('transactions')
          .select('amount')
          .eq('status', 'completed')

        const totalRevenue = revenueData?.reduce((sum, t) => sum + t.amount, 0) || 0

        result = {
          total_users: totalUsers?.length || 0,
          total_properties: totalProperties?.length || 0,
          total_transactions: totalTransactions?.length || 0,
          total_revenue: totalRevenue
        }
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Admin action error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})