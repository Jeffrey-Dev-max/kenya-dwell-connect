-- Kenya Dwell Connect Database Schema

-- Create custom types
CREATE TYPE listing_mode AS ENUM ('rent', 'sale', 'both');
CREATE TYPE property_type AS ENUM ('apartment', 'maisonette', 'bedsitter', 'bungalow', 'mansion', 'land', 'commercial', 'studio');
CREATE TYPE listing_status AS ENUM ('active', 'inactive', 'pending', 'sold', 'rented');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE transaction_status AS ENUM ('initiated', 'completed', 'failed', 'refunded');
CREATE TYPE rent_rate_type AS ENUM ('monthly', 'weekly', 'daily', 'yearly');
CREATE TYPE media_type AS ENUM ('image', 'video', 'document');
CREATE TYPE app_role AS ENUM ('admin', 'homeowner', 'caretaker', 'tenant');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member');

-- Update profiles table for Kenya Dwell Connect
ALTER TABLE profiles ADD COLUMN role app_role DEFAULT 'tenant';
ALTER TABLE profiles ADD COLUMN verification_status text DEFAULT 'unverified';
ALTER TABLE profiles ADD COLUMN location text;
ALTER TABLE profiles ADD COLUMN can_post_properties boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN free_listings_used integer DEFAULT 0;

-- Update RLS policies for profiles
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Properties table (main listings)
CREATE TABLE IF NOT EXISTS properties (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid NOT NULL,
    agency_id uuid,
    title text NOT NULL,
    description text,
    property_type property_type NOT NULL,
    listing_mode listing_mode NOT NULL,
    status listing_status DEFAULT 'active',
    
    -- Location
    county text NOT NULL,
    town text NOT NULL,
    address text,
    latitude double precision,
    longitude double precision,
    what3words text,
    
    -- Property details
    bedrooms integer,
    bathrooms integer,
    area_sqft integer,
    furnished boolean DEFAULT false,
    
    -- Pricing
    rent_price numeric,
    rent_rate_type rent_rate_type,
    sale_price numeric,
    deposit_amount numeric,
    currency text DEFAULT 'KES',
    
    -- Features
    is_instant_book boolean DEFAULT false,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Transactions table for M-Pesa payments
CREATE TABLE IF NOT EXISTS transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    amount_kes numeric NOT NULL,
    purpose text NOT NULL,
    status transaction_status DEFAULT 'initiated',
    provider text DEFAULT 'mpesa',
    receipt_no text,
    property_id uuid,
    booking_id uuid,
    raw_payload jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Contact configuration
CREATE TABLE IF NOT EXISTS contact_config (
    id integer PRIMARY KEY DEFAULT 1,
    free_contacts integer DEFAULT 2,
    period_days integer DEFAULT 30,
    price_kes numeric DEFAULT 100.00,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Insert default config
INSERT INTO contact_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Contact periods tracking
CREATE TABLE IF NOT EXISTS contact_periods (
    user_id uuid PRIMARY KEY,
    start_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Contact events tracking
CREATE TABLE IF NOT EXISTS contact_events (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    property_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Update triggers
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_config_updated_at
    BEFORE UPDATE ON contact_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_periods_updated_at
    BEFORE UPDATE ON contact_periods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for properties
CREATE POLICY "Properties readable by all" ON properties FOR SELECT USING (true);
CREATE POLICY "Owners manage own properties" ON properties 
FOR ALL USING (
    owner_id = auth.uid() OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
        SELECT 1 FROM agency_members m 
        WHERE m.agency_id = properties.agency_id 
        AND m.user_id = auth.uid()
    )
);

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions" ON transactions 
FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own transactions" ON transactions 
FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for contact config
CREATE POLICY "Contact config readable by all" ON contact_config FOR SELECT USING (true);
CREATE POLICY "Admins manage contact config" ON contact_config 
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for contact periods
CREATE POLICY "Users manage own contact period" ON contact_periods 
FOR ALL USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for contact events
CREATE POLICY "Users view own contact events" ON contact_events 
FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert own contact events" ON contact_events 
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Helper functions
CREATE OR REPLACE FUNCTION contact_usage(_user uuid)
RETURNS TABLE(used integer, remaining integer, period_start timestamp with time zone, free_limit integer, period_days integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
declare
  v_start timestamptz;
  v_free int;
  v_days int;
  v_used int;
begin
  select start_at into v_start from public.contact_periods where user_id = _user;
  if v_start is null then
    v_start := now();
    insert into public.contact_periods(user_id, start_at) values (_user, v_start)
    on conflict (user_id) do nothing;
  end if;
  select free_contacts, period_days into v_free, v_days from public.contact_config where id = 1;
  if v_free is null then v_free := 2; end if;
  if v_days is null then v_days := 30; end if;
  select count(distinct property_id) into v_used from public.contact_events ce
  where ce.user_id = _user and ce.created_at >= v_start;
  return query select v_used, greatest(v_free - v_used, 0), v_start, v_free, v_days;
end;
$$;

CREATE OR REPLACE FUNCTION reset_contact_period(_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
begin
  insert into public.contact_periods(user_id, start_at)
  values (_user, now())
  on conflict (user_id) do update set start_at = excluded.start_at;
end;
$$;