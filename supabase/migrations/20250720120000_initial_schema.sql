/*
# [Initial Schema Setup for DataEntryX]
This script sets up the core database tables, `forms` and `responses`, required for the application. It also establishes relationships and configures Row Level Security (RLS) to ensure data privacy and proper access control between users and their data.

## Query Description: [This script creates the main tables for storing form structures and their corresponding user submissions. It enables Row Level Security on both tables and applies policies to govern access. This is a foundational step and is safe to run on a new project. No existing data will be affected.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- **Tables Created:**
  - `public.forms`: Stores the structure of each form, including its title, description, and field definitions. Linked to the user who created it.
  - `public.responses`: Stores submissions for each form, containing the submitted data. Linked to the parent form.
- **Columns Added:**
  - `forms`: `id`, `user_id`, `title`, `description`, `fields`, `created_at`
  - `responses`: `id`, `form_id`, `data`, `created_at`
- **Relationships:**
  - `forms.user_id` references `auth.users(id)`.
  - `responses.form_id` references `public.forms(id)`.

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- **Policies Added:**
  - `forms`:
    - Allows authenticated users to create forms.
    - Allows owners to view, update, and delete their own forms.
    - Allows public read access so anyone can view a form to fill it out.
  - `responses`:
    - Allows anyone (anonymous and authenticated users) to submit a response.
    - Allows form owners to view and delete responses associated with their forms.
- Auth Requirements: [Policies use `auth.uid()` to identify users.]

## Performance Impact:
- Indexes: [Primary keys are automatically indexed.]
- Triggers: [None]
- Estimated Impact: [Low. Initial setup with standard indexing.]
*/

-- 1. FORMS TABLE
-- This table stores the structure and metadata for each form created by a user.
CREATE TABLE public.forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL CHECK (char_length(title) > 0),
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add comments to the table and columns
COMMENT ON TABLE public.forms IS 'Stores the structure and details of each dynamic form.';
COMMENT ON COLUMN public.forms.user_id IS 'The user who owns and created the form.';
COMMENT ON COLUMN public.forms.fields IS 'A JSON array defining the fields of the form (e.g., text, number, checkbox).';

-- 2. RESPONSES TABLE
-- This table stores every submission made to a form.
CREATE TABLE public.responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.responses IS 'Contains all user-submitted data for each form.';
COMMENT ON COLUMN public.responses.form_id IS 'The form to which this response belongs.';
COMMENT ON COLUMN public.responses.data IS 'A JSON object containing the key-value pairs of the submitted form data.';

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR FORMS TABLE
CREATE POLICY "Allow authenticated users to insert forms"
ON public.forms
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow owners to select their own forms"
ON public.forms
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow owners to update their own forms"
ON public.forms
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow owners to delete their own forms"
ON public.forms
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow public read access to forms"
ON public.forms
FOR SELECT
TO anon, authenticated
USING (true);

-- 5. RLS POLICIES FOR RESPONSES TABLE
CREATE POLICY "Allow public insert access for responses"
ON public.responses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow form owners to view responses"
ON public.responses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.forms
    WHERE forms.id = responses.form_id AND forms.user_id = auth.uid()
  )
);

CREATE POLICY "Allow form owners to delete responses"
ON public.responses
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.forms
    WHERE forms.id = responses.form_id AND forms.user_id = auth.uid()
  )
);
