-- Comprehensive fix for all database functions
-- This script drops and recreates functions to avoid return type conflicts and applies security best practices.

-- Drop all potentially conflicting functions first for a clean slate.
DROP FUNCTION IF EXISTS get_public_form(uuid);
DROP FUNCTION IF EXISTS get_paginated_forms(integer, integer);
DROP FUNCTION IF EXISTS get_paginated_form_responses(uuid, text, integer, integer);

/*
# [Function] get_public_form
Recreates the function to securely fetch a single form for public viewing.

## Query Description: 
This function allows anonymous users to retrieve the details of a specific form using its ID. It is defined with `SECURITY DEFINER` to bypass Row Level Security for this specific query, but it only returns data for the specified form ID, preventing unauthorized access to other data. The `search_path` is explicitly set to 'public' to mitigate security risks.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Function: get_public_form(p_form_id uuid)
- Returns: TABLE (id, title, description, fields, created_at)

## Security Implications:
- RLS Status: Bypassed for this specific function call via SECURITY DEFINER.
- Policy Changes: No
- Auth Requirements: Can be called by `anon` and `authenticated` roles.

## Performance Impact:
- Indexes: Uses the primary key index on the `forms` table.
- Estimated Impact: Low, as it's a direct lookup.
*/
CREATE OR REPLACE FUNCTION get_public_form(p_form_id uuid)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    fields jsonb,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT f.id, f.title, f.description, f.fields, f.created_at
    FROM forms f
    WHERE f.id = p_form_id;
END;
$$;
GRANT EXECUTE ON FUNCTION get_public_form(uuid) TO anon, authenticated;


/*
# [Function] get_paginated_forms
Recreates the function to fetch a paginated list of forms for the currently authenticated user.

## Query Description: 
This function retrieves a paginated list of forms created by the calling user, including a count of responses for each form. It is essential for the admin dashboard. It uses `SECURITY DEFINER` to accurately calculate response counts across tables while respecting the `created_by` ownership check.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Function: get_paginated_forms(page_number integer, page_size integer)
- Returns: TABLE (id, title, description, created_at, response_count, total_count)

## Security Implications:
- RLS Status: Enforces ownership by checking `auth.uid()`.
- Policy Changes: No
- Auth Requirements: Can only be called by `authenticated` users.

## Performance Impact:
- Indexes: Benefits from an index on `forms(created_by)`. The subquery for `response_count` benefits from an index on `responses(form_id)`.
- Estimated Impact: Medium, involves a subquery for counting.
*/
CREATE OR REPLACE FUNCTION get_paginated_forms(page_number integer, page_size integer)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    created_at timestamptz,
    response_count bigint,
    total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_id uuid := auth.uid();
BEGIN
    RETURN QUERY
    WITH user_forms AS (
        SELECT f.id, f.title, f.description, f.created_at
        FROM forms f
        WHERE f.created_by = user_id
    ),
    forms_with_counts AS (
        SELECT
            uf.id,
            uf.title,
            uf.description,
            uf.created_at,
            (SELECT COUNT(*) FROM responses r WHERE r.form_id = uf.id) as response_count
        FROM user_forms uf
    ),
    total AS (
        SELECT count(*) as total_count FROM forms_with_counts
    )
    SELECT
        fwc.id,
        fwc.title,
        fwc.description,
        fwc.created_at,
        fwc.response_count,
        t.total_count
    FROM forms_with_counts fwc, total t
    ORDER BY fwc.created_at DESC
    LIMIT page_size
    OFFSET (page_number - 1) * page_size;
END;
$$;
GRANT EXECUTE ON FUNCTION get_paginated_forms(integer, integer) TO authenticated;


/*
# [Function] get_paginated_form_responses
Recreates the function to fetch paginated and searchable responses for a form owned by the user.

## Query Description: 
This function retrieves responses for a specific form, with support for full-text search and pagination. It first verifies that the calling user owns the form before returning any data, ensuring strict data privacy.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Function: get_paginated_form_responses(p_form_id uuid, search_term text, page_number integer, page_size integer)
- Returns: TABLE (id, form_id, data, created_at, total_count)

## Security Implications:
- RLS Status: Enforces ownership by checking `auth.uid()` against `forms.created_by`.
- Policy Changes: No
- Auth Requirements: Can only be called by `authenticated` users.

## Performance Impact:
- Indexes: Benefits from an index on `responses(form_id)`. Full-text search performance depends on data size.
- Estimated Impact: Medium, involves a text search condition.
*/
CREATE OR REPLACE FUNCTION get_paginated_form_responses(p_form_id uuid, search_term text, page_number integer, page_size integer)
RETURNS TABLE (
    id uuid,
    form_id uuid,
    data jsonb,
    created_at timestamptz,
    total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_id uuid := auth.uid();
BEGIN
    IF NOT EXISTS (SELECT 1 FROM forms f WHERE f.id = p_form_id AND f.created_by = user_id) THEN
        RAISE EXCEPTION 'User does not have permission to view responses for this form.';
    END IF;

    RETURN QUERY
    WITH filtered_responses AS (
        SELECT
            r.id,
            r.form_id,
            r.data,
            r.created_at
        FROM responses r
        WHERE r.form_id = p_form_id
        AND (
            search_term IS NULL OR
            search_term = '' OR
            r.data::text ILIKE '%' || search_term || '%'
        )
    ),
    total AS (
        SELECT count(*) as total_count FROM filtered_responses
    )
    SELECT
        fr.id,
        fr.form_id,
        fr.data,
        fr.created_at,
        t.total_count
    FROM filtered_responses fr, total t
    ORDER BY fr.created_at DESC
    LIMIT page_size
    OFFSET (page_number - 1) * page_size;
END;
$$;
GRANT EXECUTE ON FUNCTION get_paginated_form_responses(uuid, text, integer, integer) TO authenticated;
