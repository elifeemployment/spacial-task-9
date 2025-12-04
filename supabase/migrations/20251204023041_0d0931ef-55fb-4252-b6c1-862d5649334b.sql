-- Add DELETE policy for supervisor_wards to allow anonymous users to delete
CREATE POLICY "Allow anon delete supervisor_wards" 
ON public.supervisor_wards 
FOR DELETE 
USING (true);

-- Add UPDATE policy for supervisor_wards
CREATE POLICY "Allow anon update supervisor_wards" 
ON public.supervisor_wards 
FOR UPDATE 
USING (true);