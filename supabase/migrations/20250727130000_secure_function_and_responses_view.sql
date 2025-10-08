/*
# [Operation Name]
Secure Function and Enable Response Viewing

[This migration script secures the existing `get_public_form` function by setting a fixed search path, addressing a security warning. It also creates a new Row Level Security (RLS) policy to allow form creators (admins) to view the responses submitted to their own forms. Finally, it adds a new function to efficiently fetch forms along with their corresponding response counts for the dashboard.]

## Query Description: [This operation enhances security and enables core application functionality. By setting the search_path, it prevents potential function hijacking attacks. The new RLS policy is critical for data privacy, ensuring admins can only access data they own. There is no risk to existing data.]

## Metadata:
- Schema-Category: ["Structural", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Functions Modified: `public.get_public_form`
- Functions Created: `public.get_forms_with_response_count`
- Policies Created: RLS policy on `public.responses` table

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [authenticated users (admins)]

## Performance Impact:
- Indexes: [Not Applicable]
- Triggers: [Not Applicable]
- Estimated Impact: [Low. The new function uses efficient counting and joins, which should perform well.]
*/

-- Step 1: Secure the existing function by setting a strict search path.
CREATE OR REPLACE FUNCTION public.get_public_form(form_id uuid)
RETURNS SETOF forms
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT * FROM forms WHERE id = form_id;
$$;

-- Step 2: Create a policy to allow form creators to view responses for their forms.
CREATE POLICY "Admins can view responses for their own forms."
ON public.responses FOR SELECT
USING (auth.uid() = ( SELECT created_by FROM forms WHERE id = responses.formId ));

-- Step 3: Create a function to get forms along with their response counts.
CREATE OR REPLACE FUNCTION get_forms_with_response_count()
RETURNS TABLE(id uuid, "createdAt" timestamptz, title text, description text, fields jsonb, created_by uuid, response_count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id,
        f."createdAt",
        f.title,
        f.description,
        f.fields,
        f.created_by,
        COUNT(r.id) as response_count
    FROM
        forms f
    LEFT JOIN
        responses r ON f.id = r."formId"
    WHERE
        f.created_by = auth.uid()
    GROUP BY
        f.id
    ORDER BY
        f."createdAt" DESC;
END;
$$;
