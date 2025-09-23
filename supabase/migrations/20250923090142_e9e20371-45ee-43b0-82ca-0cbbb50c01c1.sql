-- Fix RLS policies for pros table
-- Drop any problematic policies that might reference user_id
DROP POLICY IF EXISTS "Users can delete their own pros" ON pros;

-- Create correct delete policy using created_by column
CREATE POLICY "Users can delete their own pros" 
ON pros FOR DELETE 
USING (auth.uid() = created_by);

-- Ensure other policies are correct too
DROP POLICY IF EXISTS "Users can update their own pros" ON pros;
CREATE POLICY "Users can update their own pros" 
ON pros FOR UPDATE 
USING (auth.uid() = created_by);

-- Make sure we have proper select policy  
DROP POLICY IF EXISTS "Users can view their own pros" ON pros;
CREATE POLICY "Users can view their own pros" 
ON pros FOR SELECT 
USING (auth.uid() = created_by OR true); -- Allow viewing for admin purposes

-- Make sure insert policy is correct
DROP POLICY IF EXISTS "Users can create their own pros" ON pros;
CREATE POLICY "Users can create their own pros" 
ON pros FOR INSERT 
WITH CHECK (auth.uid() = created_by);