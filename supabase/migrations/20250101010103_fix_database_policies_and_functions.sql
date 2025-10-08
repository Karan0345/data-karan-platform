/*
# [Fix] Correct Database Policies and Functions

This migration script corrects several issues from previous migrations to ensure the application's security and functionality.

## Query Description:
This script performs the following actions:
1.  **Drops and Recreates `get_public_form`**: The function is recreated as a `SECURITY DEFINER` function. This is crucial for allowing public, anonymous users to view a specific form for submission while still protecting all other forms with Row Level Security. It ensures that public access is tightly controlled and doesn't bypass RLS insecurely.
2.  **Sets Secure `search_path`**: Both `get_public_form` and `get_forms_with_response_count` functions are updated to have a secure `search_path`. This mitigates the "Function Search Path Mutable" security warning and prevents potential hijacking attacks.
3.  **Creates Correct `SELECT` Policy on `responses`**: It creates the Row Level Security policy that allows administrators to view only the responses that belong to forms they have created. This fixes the `column "created_by" does not exist` error from the previous failed migration.

These changes are safe and necessary for the application to function correctly and securely.

## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: ["Medium"]
- Requires-Backup: false
- Reversible: false (requires manual reversal)

## Structure Details:
- **Functions Modified**: `get_public_form`, `get_forms_with_response_count`
- **Policies Created**: `Admins can view responses to their own forms` on `public.responses`

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes
- Auth Requirements: Policies rely on `auth.uid()`.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Low. The subquery in the RLS policy is on an indexed column (`forms.id`), so performance should be good.
*/

-- Step 1: Drop the existing function if it exists, to allow recreation with new properties.
DROP FUNCTION IF EXISTS public.get_public_form(form_id uuid);

-- Step 2: Recreate the get_public_form function as SECURITY DEFINER.
-- This allows anonymous users to fetch a specific form without bypassing RLS for all forms.
CREATE OR REPLACE FUNCTION public.get_public_form(form_id uuid)
RETURNS TABLE(id uuid, title text, description text, fields jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
-- Set a secure search_path for SECURITY DEFINER functions
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.title, f.description, f.fields
  FROM public.forms f
  WHERE f.id = get_public_form.form_id;
END;
$$;

-- Step 3: Fix the search path on the get_forms_with_response_count function to address security warnings.
-- This also adds an ORDER BY clause to show newest forms first on the dashboard.
CREATE OR REPLACE FUNCTION public.get_forms_with_response_count()
RETURNS table(id uuid, title text, description text, "createdAt" timestamptz, response_count bigint)
LANGUAGE plpgsql
-- Set a secure search_path
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.title,
    f.description,
    f.created_at,
    count(r.id) as response_count
  FROM
    public.forms f
    LEFT JOIN public.responses r ON f.id = r."formId"
  WHERE
    f.created_by = auth.uid()
  GROUP BY
    f.id
  ORDER BY
    f.created_at DESC;
END;
$$;


-- Step 4: Create the correct RLS policy for viewing responses.
-- This policy allows a user to see responses if they are the creator of the form associated with that response.
-- This fixes the 'column "created_by" does not exist' error.
DROP POLICY IF EXISTS "Admins can view responses to their own forms" ON public.responses;
CREATE POLICY "Admins can view responses to their own forms"
ON public.responses
FOR SELECT
USING (
  (SELECT f.created_by FROM public.forms f WHERE f.id = responses."formId") = auth.uid()
);
