-- Create missing tables and complete the database setup

-- First, let's ensure we have all the required ENUM types
DO $$ BEGIN
    CREATE TYPE listing_status AS ENUM ('draft', 'active', 'inactive', 'sold', 'rented');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE listing_mode AS ENUM ('rent', 'sale');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_type AS ENUM ('apartment', 'house', 'studio', 'villa', 'townhouse', 'maisonette', 'bedsitter', 'bungalow', 'land', 'commercial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE media_type AS ENUM ('image', 'video');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('initiated', 'pending', 'success', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE member_role AS ENUM ('owner', 'manager', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE rent_rate_type AS ENUM ('monthly', 'weekly', 'daily');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the properties table (this seems to be missing)
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL,
    agency_id UUID,
    property_type property_type NOT NULL,
    listing_mode listing_mode NOT NULL,
    status listing_status NOT NULL DEFAULT 'active',
    rent_rate_type rent_rate_type,
    rent_price NUMERIC,
    sale_price NUMERIC,
    deposit_amount NUMERIC,
    county TEXT NOT NULL,
    town TEXT NOT NULL,
    address TEXT,
    what3words TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area_sqft INTEGER,
    furnished BOOLEAN NOT NULL DEFAULT false,
    is_instant_book BOOLEAN NOT NULL DEFAULT false,
    currency TEXT NOT NULL DEFAULT 'KES',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for properties
CREATE POLICY IF NOT EXISTS "Properties readable by all" 
ON public.properties FOR SELECT 
USING (true);

CREATE POLICY IF NOT EXISTS "Owners manage own properties" 
ON public.properties FOR ALL 
USING ((owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR (EXISTS ( SELECT 1 FROM agency_members m WHERE ((m.agency_id = properties.agency_id) AND (m.user_id = auth.uid())))))
WITH CHECK ((owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR (EXISTS ( SELECT 1 FROM agency_members m WHERE ((m.agency_id = properties.agency_id) AND (m.user_id = auth.uid())))));

-- Create updated_at trigger for properties
CREATE TRIGGER IF NOT EXISTS update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create missing listing_allowances table for payment tracking
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

-- Create RLS policies for listing_allowances
CREATE POLICY IF NOT EXISTS "Users can view own allowances"
ON public.listing_allowances FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can insert own allowances"
ON public.listing_allowances FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update own allowances"
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
  );
  
  -- Insert listing allowances for homeowners and caretakers
  IF (NEW.raw_user_meta_data ->> 'role') IN ('homeowner', 'caretaker') THEN
    INSERT INTO public.listing_allowances (user_id, free_listings, used_listings)
    VALUES (NEW.id, 1, 0);
  END IF;
  
  RETURN NEW;
END;
$$;