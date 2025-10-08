/*
# [Schema Reset and Rebuild]
This migration provides a clean slate for the application's database schema. It drops all existing tables, functions, and policies related to forms and responses and recreates them using a consistent `snake_case` naming convention. This is necessary to fix persistent errors caused by inconsistent column naming in previous migrations.

## Query Description:
- **Impact:** This is a destructive operation. It will DROP the `forms` and `responses` tables, deleting any data they contain. This is considered safe as the application has been unable to save data correctly due to the errors being fixed.
- **Safety:** It is recommended to only run this in a development environment.
- **Purpose:** To establish a stable, consistent, and secure database schema that aligns with PostgreSQL best practices.

## Metadata:
- Schema-Category: ["Dangerous", "Structural"]
- Impact-Level: ["High"]
- Requires-Backup: true
- Reversible: false

## Structure Details:
- **Dropped:** `forms` table, `responses` table, all related RLS policies and functions.
- **Created:** `forms` table, `responses` table, all related RLS policies and functions with `snake_case` naming.

## Security Implications:
- RLS Status: Re-enabled on all tables.
- Policy Changes: All policies are recreated to be more secure and correct.
- Auth Requirements: Policies correctly reference `auth.uid()` and the `created_by` column.

## Performance Impact:
- Indexes: Primary key indexes are recreated.
- Triggers: None.
- Estimated Impact: Minimal. This operation prepares the database for future use.
*/

-- Drop existing objects to ensure a clean slate and resolve conflicts.
DROP POLICY IF EXISTS "Allow authenticated users to view responses to their own forms" ON public.responses;
DROP POLICY IF EXISTS "Allow anyone to submit a response" ON public.responses;
DROP POLICY IF EXISTS "Allow admin to read their own forms" ON public.forms;
DROP POLICY IF EXISTS "Allow admin to delete their own forms" ON public.forms;
DROP POLICY IF EXISTS "Allow admin to update their own forms" ON public.forms;
DROP POLICY IF EXISTS "Allow admin to insert their own forms" ON public.forms;

DROP FUNCTION IF EXISTS public.get_public_form(uuid);
DROP FUNCTION IF EXISTS public.get_forms_with_response_count();

DROP TABLE IF EXISTS public.responses;
DROP TABLE IF EXISTS public.forms;

-- Recreate tables with consistent snake_case naming convention.
CREATE TABLE public.forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    fields JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    form_title TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies with correct column names.
CREATE POLICY "Allow admin to insert their own forms"
ON public.forms FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow admin to update their own forms"
ON public.forms FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Allow admin to delete their own forms"
ON public.forms FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Allow admin to read their own forms"
ON public.forms FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Allow anyone to submit a response"
ON public.responses FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view responses to their own forms"
ON public.responses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM forms f
    WHERE f.id = responses.form_id AND f.created_by = auth.uid()
  )
);

-- Recreate functions with correct column names and security settings.
CREATE OR REPLACE FUNCTION public.get_public_form(p_form_id uuid)
RETURNS TABLE(id uuid, title text, description text, fields jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.title, f.description, f.fields
  FROM forms f
  WHERE f.id = p_form_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_forms_with_response_count()
RETURNS TABLE(id uuid, title text, description text, created_at timestamptz, response_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.title,
    f.description,
    f.created_at,
    (SELECT count(*) FROM responses r WHERE r.form_id = f.id) as response_count
  FROM
    forms f
  WHERE
    f.created_by = auth.uid()
  ORDER BY
    f.created_at DESC;
END;
$$;

-- Grant execution rights to the appropriate roles.
GRANT EXECUTE ON FUNCTION public.get_public_form(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_forms_with_response_count() TO authenticated;
