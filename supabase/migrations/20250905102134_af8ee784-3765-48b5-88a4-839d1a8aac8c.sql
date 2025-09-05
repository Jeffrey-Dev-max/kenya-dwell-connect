-- Fix infinite recursion in agency_members RLS policies
-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Agency owners manage members" ON agency_members;
DROP POLICY IF EXISTS "Members readable by agency staff" ON agency_members;

-- Create fixed policies without recursion
CREATE POLICY "Agency owners manage members" 
ON agency_members 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM agencies a 
    WHERE a.id = agency_members.agency_id 
    AND a.owner_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM agencies a 
    WHERE a.id = agency_members.agency_id 
    AND a.owner_id = auth.uid()
  )
);

CREATE POLICY "Members can read agency members" 
ON agency_members 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM agencies a 
    WHERE a.id = agency_members.agency_id 
    AND a.owner_id = auth.uid()
  )
);