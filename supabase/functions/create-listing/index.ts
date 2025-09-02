import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: userData } = await supabaseClient.auth.getUser(token)
    const user = userData.user

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const formData = await req.json()

    // Check user's listing allowances
    const { data: allowances } = await supabaseClient
      .from('listing_allowances')
      .select('*')
      .eq('user_id', user.id)
      .single()

    let requiresPayment = false
    
    if (allowances && allowances.used_listings >= allowances.free_listings) {
      requiresPayment = true
    }

    // Prepare property data
    const propertyData = {
      title: formData.title,
      description: formData.description,
      property_type: formData.property_type,
      listing_mode: formData.listing_type,
      rent_price: formData.listing_type === 'rent' ? parseFloat(formData.price) : null,
      sale_price: formData.listing_type === 'sale' ? parseFloat(formData.price) : null,
      county: formData.location.split(',')[1]?.trim() || formData.location,
      town: formData.location.split(',')[0]?.trim() || formData.location,
      address: formData.location,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
      furnished: formData.furnished,
      owner_id: user.id,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      status: requiresPayment ? 'draft' : 'active'
    }

    // Create property
    const { data: property, error: propertyError } = await supabaseClient
      .from('properties')
      .insert(propertyData)
      .select()
      .single()

    if (propertyError) {
      throw propertyError
    }

    // Add amenities if provided
    if (formData.amenities && formData.amenities.length > 0) {
      const amenityInserts = formData.amenities.map((amenityId: string) => ({
        property_id: property.id,
        amenity_id: amenityId
      }))

      const { error: amenityError } = await supabaseClient
        .from('property_amenities')
        .insert(amenityInserts)

      if (amenityError) {
        console.error('Error adding amenities:', amenityError)
      }
    }

    // Add images if provided
    if (formData.images && formData.images.length > 0) {
      const mediaInserts = formData.images.map((url: string, index: number) => ({
        property_id: property.id,
        url: url,
        media_type: 'image',
        sort_order: index
      }))

      const { error: mediaError } = await supabaseClient
        .from('property_media')
        .insert(mediaInserts)

      if (mediaError) {
        console.error('Error adding media:', mediaError)
      }
    }

    // Update listing allowances if not requiring payment
    if (!requiresPayment && allowances) {
      await supabaseClient
        .from('listing_allowances')
        .update({ used_listings: allowances.used_listings + 1 })
        .eq('user_id', user.id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        property: property,
        requires_payment: requiresPayment,
        message: requiresPayment 
          ? 'Property created as draft. Payment required to publish.'
          : 'Property created and published successfully!'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error creating listing:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create listing' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})