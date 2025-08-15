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

    const { property_id, receiver_id, content, attachment_url } = await req.json()

    // Validate required fields
    if (!property_id || !receiver_id || !content) {
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

    // Verify property exists and get conversation
    const { data: property, error: propertyError } = await serviceClient
      .from('properties')
      .select('*')
      .eq('id', property_id)
      .single()

    if (propertyError || !property) {
      return new Response(
        JSON.stringify({ error: 'Property not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find or create conversation
    let conversation
    const { data: existingConversation, error: conversationError } = await serviceClient
      .from('conversations')
      .select('*')
      .eq('property_id', property_id)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${user.id})`)
      .single()

    if (conversationError) {
      // Create new conversation
      const { data: newConversation, error: newConversationError } = await serviceClient
        .from('conversations')
        .insert({
          property_id,
          sender_id: user.id,
          receiver_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (newConversationError) {
        throw new Error(`Conversation creation failed: ${newConversationError.message}`)
      }
      conversation = newConversation
    } else {
      conversation = existingConversation
      
      // Update conversation timestamp
      await serviceClient
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation.id)
    }

    // Create message
    const { data: message, error: messageError } = await serviceClient
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        content,
        attachment_url: attachment_url || null,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        sender:profiles!sender_id(id, full_name, avatar_url)
      `)
      .single()

    if (messageError) {
      throw new Error(`Message creation failed: ${messageError.message}`)
    }

    // Send real-time notification
    await serviceClient
      .from('messages')
      .update({ id: message.id })
      .eq('id', message.id)

    return new Response(
      JSON.stringify({
        success: true,
        message,
        conversation_id: conversation.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Send message error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})