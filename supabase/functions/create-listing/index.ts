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

    const {
      title,
      description,
      listing_type,
      property_type,
      price,
      location,
      latitude,
      longitude,
      bedrooms,
      bathrooms,
      amenities,
      furnished,
      images
    } = await req.json()

    // Validate required fields
    if (!title || !description || !listing_type || !property_type || !price || !location) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use service role for database operations
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check user profile and permissions
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user can post listings
    if (profile.role === 'tenant') {
      return new Response(
        JSON.stringify({ error: 'Tenants cannot create listings' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check listing allowance
    const { data: allowance, error: allowanceError } = await serviceClient
      .from('listing_allowances')
      .select('*')
      .eq('user_id', user.id)
      .single()

    let requiresPayment = false
    let listingStatus = 'active'

    if (!allowanceError && allowance && allowance.remaining_free_listings > 0) {
      // Use free listing
      await serviceClient
        .from('listing_allowances')
        .update({
          remaining_free_listings: allowance.remaining_free_listings - 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
    } else {
      // Requires payment
      requiresPayment = true
      listingStatus = 'pending_payment'
    }

    // Create listing
    const { data: listing, error: listingError } = await serviceClient
      .from('properties')
      .insert({
        owner_id: user.id,
        title,
        description,
        listing_type: listing_type as 'rent' | 'sale',
        property_type,
        price: parseFloat(price),
        location,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        amenities: amenities || [],
        furnished: furnished || false,
        images: images || [],
        status: listingStatus as 'active' | 'pending_payment',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (listingError) {
      throw new Error(`Listing creation failed: ${listingError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        listing,
        requires_payment: requiresPayment,
        message: requiresPayment 
          ? 'Listing created but requires payment to activate' 
          : 'Listing created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Create listing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})