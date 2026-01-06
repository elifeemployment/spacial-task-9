-- Add status columns for team admin approval and activation
ALTER TABLE public.admin_members 
ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Update existing records to be approved and active by default
UPDATE public.admin_members SET is_approved = true, is_active = true WHERE is_approved IS NULL;