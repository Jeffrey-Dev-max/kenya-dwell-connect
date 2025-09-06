-- Complete restructuring to remove agencies and update to tenant/homeowner model
-- Handle all dependencies carefully

-- 1. First, drop all policies that reference agency_id
DROP POLICY IF EXISTS "Owners manage own properties" ON public.properties;
DROP POLICY IF EXISTS "Owners manage property media" ON public.property_media;

-- 2. Remove agency_id column from properties table
ALTER TABLE public.properties DROP COLUMN IF EXISTS agency_id;

-- 3. Drop agency-related tables
DROP TABLE IF EXISTS public.agency_members CASCADE;
DROP TABLE IF EXISTS public.agencies CASCADE;

-- 4. Create new app_role enum with only tenant, homeowner, admin
CREATE TYPE public.app_role_new AS ENUM ('tenant', 'homeowner', 'admin');

-- 5. Drop the has_role function temporarily
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- 6. Update user_roles table to use new enum
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role_new USING 
  CASE 
    WHEN role::text = 'admin' THEN 'admin'::public.app_role_new
    WHEN role::text = 'user' THEN 'tenant'::public.app_role_new
    WHEN role::text = 'moderator' THEN 'homeowner'::public.app_role_new
    ELSE 'tenant'::public.app_role_new
  END;

-- 7. Update profiles table role column
UPDATE public.profiles SET role = 
  CASE 
    WHEN role = 'admin' THEN 'admin'
    WHEN role = 'user' THEN 'tenant'  
    WHEN role = 'moderator' THEN 'homeowner'
    WHEN role = 'homeowner' THEN 'homeowner'
    WHEN role = 'caretaker' THEN 'homeowner'
    ELSE 'tenant'
  END;

-- 8. Drop old enum and rename new one
DROP TYPE public.app_role CASCADE;
ALTER TYPE public.app_role_new RENAME TO app_role;

-- 9. Recreate has_role function with new enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 10. Drop member_role enum
DROP TYPE IF EXISTS public.member_role CASCADE;