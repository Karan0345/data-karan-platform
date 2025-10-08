/*
# [Operation Name] Enhance Response Management
[This operation introduces search, pagination, and deletion capabilities for form responses, and adds pagination for the main forms dashboard.]

## Query Description: [This script creates two new database functions to enable efficient server-side searching and pagination for both form responses and the list of forms. It also adds a security policy to allow form owners to delete individual responses. These changes improve performance by reducing the amount of data sent to the client and enhance the admin's ability to manage data.]

## Metadata:
- Schema-Category: ["Structural", "Safe"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- New Function: `get_paginated_form_responses(p_form_id uuid, search_term text, page_number int, page_size int)`
- New Function: `get_paginated_forms(page_number int, page_size int)`
- New Policy: `Allow form owners to delete responses` on `responses` table.
- Modified Function: `get_forms_with_response_count` is replaced by the new paginated version.

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes] - Adds a DELETE policy on the `responses` table.
- Auth Requirements: [Authenticated User (form owner)]

## Performance Impact:
- Indexes: [No changes]
- Triggers: [No changes]
- Estimated Impact: [Positive. Server-side pagination and search will significantly improve performance on the responses page for forms with many submissions.]
*/

-- 1. Add policy to allow form owners to delete responses to their forms.
CREATE POLICY "Allow form owners to delete responses"
ON public.responses
FOR DELETE
TO authenticated
USING (
  (auth.uid() IN ( SELECT forms.created_by
   FROM forms
  WHERE (forms.id = responses.form_id)))
);


-- 2. Create a function to get paginated and searchable responses for a specific form.
CREATE OR REPLACE FUNCTION get_paginated_form_responses(
    p_form_id uuid,
    search_term text DEFAULT '',
    page_number int DEFAULT 1,
    page_size int DEFAULT 10
)
RETURNS TABLE(
    id uuid,
    created_at timestamptz,
    data jsonb,
    total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    offset_val int;
BEGIN
    offset_val := (page_number - 1) * page_size;

    RETURN QUERY
    WITH filtered_responses AS (
        SELECT
            r.id,
            r.created_at,
            r.data,
            -- Cast data to text to perform a simple text search across all values
            r.data::text ILIKE '%' || search_term || '%' as is_match
        FROM responses r
        JOIN forms f ON r.form_id = f.id
        WHERE r.form_id = p_form_id
          AND f.created_by = auth.uid() -- Security check: only owner can see responses
    ),
    counted_responses AS (
        SELECT *, COUNT(*) OVER() as total
        FROM filtered_responses
        WHERE is_match
    )
    SELECT
        cr.id,
        cr.created_at,
        cr.data,
        cr.total
    FROM counted_responses cr
    ORDER BY cr.created_at DESC
    LIMIT page_size
    OFFSET offset_val;
END;
$$;


-- 3. Drop the old function for getting all forms
DROP FUNCTION IF EXISTS get_forms_with_response_count();

-- 4. Create a new function to get paginated forms for the dashboard
CREATE OR REPLACE FUNCTION get_paginated_forms(
    page_number int DEFAULT 1,
    page_size int DEFAULT 10
)
RETURNS TABLE(
    id uuid,
    created_at timestamptz,
    title text,
    description text,
    response_count bigint,
    total_count bigint
)
LANGUAGE plpgsql
AS $$
DECLARE
    offset_val int;
BEGIN
    offset_val := (page_number - 1) * page_size;

    RETURN QUERY
    WITH user_forms AS (
        SELECT f.id, f.created_at, f.title, f.description
        FROM forms f
        WHERE f.created_by = auth.uid()
    ),
    forms_with_counts AS (
        SELECT
            uf.id,
            uf.created_at,
            uf.title,
            uf.description,
            (SELECT COUNT(*) FROM responses r WHERE r.form_id = uf.id) as response_count
        FROM user_forms uf
    ),
    counted_total AS (
        SELECT *, COUNT(*) OVER() as total
        FROM forms_with_counts
    )
    SELECT
        ct.id,
        ct.created_at,
        ct.title,
        ct.description,
        ct.response_count,
        ct.total as total_count
    FROM counted_total ct
    ORDER BY ct.created_at DESC
    LIMIT page_size
    OFFSET offset_val;
END;
$$;
