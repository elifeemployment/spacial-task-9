-- Fix coordinators table column name consistency
-- The coordinators table uses 'mobile' but some code expects 'mobile_number'
-- Let's standardize on 'mobile_number' for consistency with other tables

ALTER TABLE coordinators RENAME COLUMN mobile TO mobile_number;