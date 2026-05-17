-- Update existing test user credits from 2 to 10
UPDATE public.profiles 
SET credits_balance = 10 
WHERE email = 'bhavesh.24jiaim018@jietjodhpur.ac.in';

-- Verify the update
SELECT id, email, credits_balance, created_at 
FROM public.profiles 
WHERE email = 'bhavesh.24jiaim018@jietjodhpur.ac.in';

-- Made with Bob
