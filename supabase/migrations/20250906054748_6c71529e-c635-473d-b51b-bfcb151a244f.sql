-- Remove agency-related functionality and restructure for homeowners and tenants only

-- 1. Remove agency_id column from properties table
ALTER TABLE public.properties DROP COLUMN IF EXISTS agency_id;

-- 2. Drop agency-related tables
DROP TABLE IF EXISTS public.agency_members CASCADE;
DROP TABLE IF EXISTS public.agencies CASCADE;

-- 3. Update app_role enum to only include tenant and homeowner roles
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('tenant', 'homeowner', 'admin');

-- Update existing user_roles table
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING 
  CASE 
    WHEN role::text = 'admin' THEN 'admin'::public.app_role
    WHEN role::text = 'user' THEN 'tenant'::public.app_role
    WHEN role::text = 'moderator' THEN 'homeowner'::public.app_role
    ELSE 'tenant'::public.app_role
  END;

-- Update profiles table role column to match
UPDATE public.profiles SET role = 
  CASE 
    WHEN role = 'admin' THEN 'admin'
    WHEN role = 'user' THEN 'tenant'
    WHEN role = 'moderator' THEN 'homeowner'
    WHEN role = 'homeowner' THEN 'homeowner'
    WHEN role = 'caretaker' THEN 'homeowner'
    ELSE 'tenant'
  END;

-- Drop the old enum type
DROP TYPE public.app_role_old;

-- 4. Drop member_role enum since it's no longer needed
DROP TYPE IF EXISTS public.member_role CASCADE;

-- 5. Update RLS policies for properties to remove agency references
DROP POLICY IF EXISTS "Owners manage own properties" ON public.properties;

CREATE POLICY "Owners manage own properties" 
ON public.properties 
FOR ALL 
USING (
  (owner_id = auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  (owner_id = auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- 6. Update property_media RLS policies to remove agency references  
DROP POLICY IF EXISTS "Owners manage property media" ON public.property_media;

CREATE POLICY "Owners manage property media" 
ON public.property_media 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (EXISTS ( 
    SELECT 1 FROM properties p 
    WHERE p.id = property_media.property_id 
    AND p.owner_id = auth.uid()
  ))
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (EXISTS ( 
    SELECT 1 FROM properties p 
    WHERE p.id = property_media.property_id 
    AND p.owner_id = auth.uid()
  ))
);