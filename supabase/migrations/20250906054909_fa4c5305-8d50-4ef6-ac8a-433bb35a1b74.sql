-- Complete removal of agency system and role restructuring
-- Step 1: Remove ALL RLS policies that depend on has_role function

-- Drop all policies that use has_role function
DROP POLICY IF EXISTS "Users read their roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users manage their roles (admin only)" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage amenities" ON public.amenities;
DROP POLICY IF EXISTS "Renter can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Owner/admin can update booking" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Conversation members can read messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins manage contact config" ON public.contact_config;
DROP POLICY IF EXISTS "Users manage own contact period" ON public.contact_periods;
DROP POLICY IF EXISTS "Users view own contact events" ON public.contact_events;
DROP POLICY IF EXISTS "Owners manage promotions" ON public.promotions;

-- Drop policies that reference agency_id
DROP POLICY IF EXISTS "Owners manage own properties" ON public.properties;
DROP POLICY IF EXISTS "Owners manage property media" ON public.property_media;

-- Drop storage policies
DROP POLICY IF EXISTS "KYC images private: user and admin can read" ON storage.objects;

-- Step 2: Remove agency_id column from properties
ALTER TABLE public.properties DROP COLUMN IF EXISTS agency_id;

-- Step 3: Drop agency tables
DROP TABLE IF EXISTS public.agency_members CASCADE;
DROP TABLE IF EXISTS public.agencies CASCADE;

-- Step 4: Now drop the has_role function
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Step 5: Drop member_role enum
DROP TYPE IF EXISTS public.member_role CASCADE;

-- Step 6: Update user_roles table first to handle the enum change
-- Create temporary columns to preserve data
ALTER TABLE public.user_roles ADD COLUMN role_temp text;
UPDATE public.user_roles SET role_temp = 
  CASE 
    WHEN role::text = 'admin' THEN 'admin'
    WHEN role::text = 'user' THEN 'tenant'
    WHEN role::text = 'moderator' THEN 'homeowner'
    ELSE 'tenant'
  END;

-- Drop the old role column
ALTER TABLE public.user_roles DROP COLUMN role;

-- Drop and recreate the app_role enum
DROP TYPE public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('tenant', 'homeowner', 'admin');

-- Add the role column back with new enum type
ALTER TABLE public.user_roles ADD COLUMN role public.app_role;
UPDATE public.user_roles SET role = role_temp::public.app_role;
ALTER TABLE public.user_roles DROP COLUMN role_temp;
ALTER TABLE public.user_roles ALTER COLUMN role SET NOT NULL;