-- Remove name and mobile_number columns from customers table
ALTER TABLE public.customers 
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS mobile_number;