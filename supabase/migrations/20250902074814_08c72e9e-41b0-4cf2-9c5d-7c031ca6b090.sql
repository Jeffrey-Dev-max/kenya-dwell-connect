-- Fix database setup and create missing components

-- Create the listing_allowances table for payment tracking
CREATE TABLE IF NOT EXISTS public.listing_allowances (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    free_listings INTEGER NOT NULL DEFAULT 1,
    used_listings INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS on listing_allowances
ALTER TABLE public.listing_allowances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view own allowances" ON public.listing_allowances;
DROP POLICY IF EXISTS "Users can insert own allowances" ON public.listing_allowances;
DROP POLICY IF EXISTS "Users can update own allowances" ON public.listing_allowances;

-- Create RLS policies for listing_allowances
CREATE POLICY "Users can view own allowances"
ON public.listing_allowances FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own allowances"
ON public.listing_allowances FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own allowances"
ON public.listing_allowances FOR UPDATE
USING (user_id = auth.uid());

-- Update the handle_new_user function to create listing allowances
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, phone_number, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone_number',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    role = EXCLUDED.role;
  
  -- Insert listing allowances for homeowners and caretakers
  IF (NEW.raw_user_meta_data ->> 'role') IN ('homeowner', 'caretaker') THEN
    INSERT INTO public.listing_allowances (user_id, free_listings, used_listings)
    VALUES (NEW.id, 1, 0)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;