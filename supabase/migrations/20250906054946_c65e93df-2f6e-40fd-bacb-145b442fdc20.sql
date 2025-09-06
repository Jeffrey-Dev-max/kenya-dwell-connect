-- Step 7: Recreate has_role function and all RLS policies
-- Update profiles table role values
UPDATE public.profiles SET role = 
  CASE 
    WHEN role = 'admin' THEN 'admin'
    WHEN role = 'user' THEN 'tenant'  
    WHEN role = 'moderator' THEN 'homeowner'
    WHEN role = 'homeowner' THEN 'homeowner'
    WHEN role = 'caretaker' THEN 'homeowner'
    ELSE 'tenant'
  END;

-- Recreate has_role function with new enum
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

-- Recreate all essential RLS policies
CREATE POLICY "Users read their roles" 
ON public.user_roles 
FOR SELECT 
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage their roles (admin only)" 
ON public.user_roles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage amenities" 
ON public.amenities 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Renter can view own bookings" 
ON public.bookings 
FOR SELECT 
USING ((renter_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR 
       (EXISTS (SELECT 1 FROM properties p WHERE p.id = bookings.property_id AND p.owner_id = auth.uid())));

CREATE POLICY "Owner/admin can update booking" 
ON public.bookings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR 
       (EXISTS (SELECT 1 FROM properties p WHERE p.id = bookings.property_id AND p.owner_id = auth.uid())));

CREATE POLICY "Users can view their conversations" 
ON public.conversations 
FOR SELECT 
USING ((participant_a = auth.uid()) OR (participant_b = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Conversation members can read messages" 
ON public.messages 
FOR SELECT 
USING ((EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND 
               ((c.participant_a = auth.uid()) OR (c.participant_b = auth.uid())))) OR 
       has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own transactions" 
ON public.transactions 
FOR SELECT 
USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage contact config" 
ON public.contact_config 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own contact period" 
ON public.contact_periods 
FOR ALL 
USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own contact events" 
ON public.contact_events 
FOR SELECT 
USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners manage promotions" 
ON public.promotions 
FOR ALL 
USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Recreate simplified properties policies without agency references
CREATE POLICY "Owners manage own properties" 
ON public.properties 
FOR ALL 
USING ((owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK ((owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners manage property media" 
ON public.property_media 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR 
       (EXISTS (SELECT 1 FROM properties p WHERE p.id = property_media.property_id AND p.owner_id = auth.uid())))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR 
           (EXISTS (SELECT 1 FROM properties p WHERE p.id = property_media.property_id AND p.owner_id = auth.uid())));

-- Recreate storage policy for KYC
CREATE POLICY "KYC images private: user and admin can read" 
ON storage.objects 
FOR SELECT 
USING ((bucket_id = 'kyc'::text) AND 
       ((auth.uid()::text = (storage.foldername(name))[1]) OR has_role(auth.uid(), 'admin'::app_role)));