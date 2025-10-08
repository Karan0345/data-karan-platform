/*
# [Function] Recreate get_public_form
Recreates the function to securely fetch a single form, fixing a migration error. This version explicitly drops the old function before creating the new one to avoid conflicts with return types. It also sets a secure search_path.

## Query Description: "This operation will briefly drop and recreate a database function used for viewing public forms. There is no risk to existing data, but it is a necessary step to update the function's structure."
## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true
*/
DROP FUNCTION IF EXISTS public.get_public_form(uuid);
CREATE OR REPLACE FUNCTION public.get_public_form(form_id uuid)
RETURNS TABLE(id uuid, title text, description text, fields jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.title, f.description, f.fields FROM public.forms f WHERE f.id = form_id;
END;
$$;


/*
# [Function] Create get_forms_with_response_count
Creates a function to efficiently fetch all forms for the logged-in user along with a count of their responses. This is used to populate the admin dashboard and fixes a potential security issue by setting a secure search_path.

## Query Description: "This operation adds a new function for dashboard analytics. It is a safe, read-only operation with no impact on existing data."
## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true
*/
CREATE OR REPLACE FUNCTION public.get_forms_with_response_count()
RETURNS TABLE(id uuid, title text, description text, "createdAt" timestamptz, response_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id,
        f.title,
        f.description,
        f.created_at as "createdAt",
        (SELECT count(*) FROM public.responses r WHERE r."formId" = f.id) as response_count
    FROM
        public.forms f
    WHERE
        f.created_by = auth.uid();
END;
$$;


/*
# [RLS] Enable RLS for Responses
Enables Row Level Security on the `responses` table to control data access.

## Query Description: "This operation enables Row Level Security on the 'responses' table. Existing data will become inaccessible until access policies are created. This is a critical security enhancement."
## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true
*/
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;


/*
# [RLS Policy] Admin access to responses
Creates a policy allowing administrators to view responses only for the forms they have created.

## Query Description: "This operation grants form creators read access to their form's submissions. It ensures user data remains private and is only visible to the form owner."
## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true
*/
DROP POLICY IF EXISTS "Admins can view responses to their own forms." ON public.responses;
CREATE POLICY "Admins can view responses to their own forms."
ON public.responses FOR SELECT
USING (
  auth.uid() IN (
    SELECT created_by FROM public.forms WHERE id = "formId"
  )
);
