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
      property_id,
      booking_type,
      start_date,
      end_date,
      viewing_date,
      message,
      guests
    } = await req.json()

    // Validate required fields
    if (!property_id || !booking_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate booking type specific fields
    if (booking_type === 'rental' && (!start_date || !end_date)) {
      return new Response(
        JSON.stringify({ error: 'Start date and end date required for rental bookings' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (booking_type === 'viewing' && !viewing_date) {
      return new Response(
        JSON.stringify({ error: 'Viewing date required for viewing bookings' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use service role for database operations
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify property exists
    const { data: property, error: propertyError } = await serviceClient
      .from('properties')
      .select('*, owner:profiles!owner_id(id, full_name, email, phone)')
      .eq('id', property_id)
      .single()

    if (propertyError || !property) {
      return new Response(
        JSON.stringify({ error: 'Property not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is not the owner
    if (property.owner_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot book your own property' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create booking
    const bookingData: any = {
      property_id,
      guest_id: user.id,
      booking_type: booking_type as 'rental' | 'viewing',
      status: 'pending',
      message: message || null,
      guests: guests || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (booking_type === 'rental') {
      bookingData.start_date = start_date
      bookingData.end_date = end_date
      // Calculate total price based on days
      const startDate = new Date(start_date)
      const endDate = new Date(end_date)
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      bookingData.total_price = property.price * days
    } else if (booking_type === 'viewing') {
      bookingData.viewing_date = viewing_date
      bookingData.total_price = 0 // Viewings are typically free
    }

    const { data: booking, error: bookingError } = await serviceClient
      .from('bookings')
      .insert(bookingData)
      .select(`
        *,
        property:properties(*),
        guest:profiles!guest_id(id, full_name, email, phone)
      `)
      .single()

    if (bookingError) {
      throw new Error(`Booking creation failed: ${bookingError.message}`)
    }

    // Send notification to property owner (could integrate with email service here)
    console.log(`New booking request for property ${property.title} from ${user.email}`)

    return new Response(
      JSON.stringify({
        success: true,
        booking,
        message: 'Booking request sent successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Create booking error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})