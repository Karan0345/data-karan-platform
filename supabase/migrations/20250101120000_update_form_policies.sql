/*
# [Operation Name]
Update Form Access Policies and Create RPC

[Description of what this operation does]
This migration enhances security and fixes a client-side caching issue. It replaces an overly permissive row-level security (RLS) policy with a more secure database function (RPC) for fetching public forms.

## Query Description: [This operation tightens security by removing public list access to all forms. It replaces this with a dedicated function that only allows fetching a single form by its specific ID. This change is safe and does not risk any data loss. It is required to fix the form creation error.]

## Metadata:
- Schema-Category: ["Structural", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Tables affected: public.forms (policy change)
- Functions created: public.get_public_form(uuid)

## Security Implications:
- RLS Status: [Modified]
- Policy Changes: [Yes]
- Auth Requirements: [The new function is executable by anon and authenticated roles.]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [Negligible. RPC calls on primary keys are highly performant.]
*/

-- Step 1: Drop the overly permissive policy that allows anyone to list all forms.
-- This is the root cause of the client-side error and a security vulnerability.
DROP POLICY "Allow public read access to forms" ON public.forms;

-- Step 2: Create a secure function to fetch a single public form by its ID.
-- This function will be called by the public form submission page.
-- It only exposes non-sensitive columns.
CREATE OR REPLACE FUNCTION get_public_form(form_id uuid)
RETURNS TABLE(id uuid, "createdAt" timestamptz, title text, description text, fields jsonb) AS $$
BEGIN
  RETURN QUERY SELECT f.id, f."createdAt", f.title, f.description, f.fields FROM public.forms AS f WHERE f.id = form_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant permission to anonymous and authenticated users to call this function.
GRANT EXECUTE ON FUNCTION public.get_public_form(uuid) TO anon, authenticated;
