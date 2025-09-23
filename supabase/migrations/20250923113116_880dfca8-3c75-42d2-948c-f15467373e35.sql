-- Fix RLS policies for pros table to allow public access
-- Drop the policies that require authentication
DROP POLICY IF EXISTS "Users can delete their own pros" ON pros;
DROP POLICY IF EXISTS "Users can update their own pros" ON pros;
DROP POLICY IF EXISTS "Users can view their own pros" ON pros;
DROP POLICY IF EXISTS "Users can create their own pros" ON pros;

-- Create public access policies similar to other tables
CREATE POLICY "Allow anon delete pros" ON pros FOR DELETE TO public USING (true);
CREATE POLICY "Allow anon update pros" ON pros FOR UPDATE TO public USING (true);