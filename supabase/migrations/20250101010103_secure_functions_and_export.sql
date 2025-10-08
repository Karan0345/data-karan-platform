-- migration_summary: Secure all database functions by setting a fixed search_path to resolve security warnings.

/*
# [Function Security Hardening]
Updates all existing RPC functions to explicitly set the `search_path`. This is a security best practice that prevents certain classes of vulnerabilities by ensuring functions do not resolve objects from unexpected schemas.

## Query Description: This operation modifies the definitions of three functions: `get_paginated_forms`, `get_public_form`, and `get_paginated_form_responses`. It makes no changes to data or table structures. It is a safe, non-destructive operation.

## Metadata:
- Schema-Category: ["Safe", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Functions affected:
  - `get_paginated_forms(int, int)`
  - `get_public_form(uuid)`
  - `get_paginated_form_responses(uuid, text, int, int)`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: Unchanged
- Fixes "Function Search Path Mutable" security advisory.

## Performance Impact:
- Indexes: Unchanged
- Triggers: Unchanged
- Estimated Impact: None. This is a security and stability improvement.
*/

-- Update get_paginated_forms function
create or replace function get_paginated_forms(page_number int, page_size int)
returns table (
    id uuid,
    created_at timestamptz,
    title text,
    description text,
    fields jsonb,
    created_by uuid,
    response_count bigint,
    total_count bigint
)
language plpgsql
as $$
begin
    return query
    with form_counts as (
        select
            f.id,
            count(r.id) as resp_count
        from forms f
        left join responses r on f.id = r.form_id
        where f.created_by = auth.uid()
        group by f.id
    ),
    total as (
        select count(*) as total from forms where created_by = auth.uid()
    )
    select
        f.id,
        f.created_at,
        f.title,
        f.description,
        f.fields,
        f.created_by,
        fc.resp_count as response_count,
        t.total as total_count
    from forms f
    join form_counts fc on f.id = fc.id
    cross join total t
    where f.created_by = auth.uid()
    order by f.created_at desc
    limit page_size
    offset (page_number - 1) * page_size;
end;
$$ set search_path = public;


-- Update get_public_form function
create or replace function get_public_form(p_form_id uuid)
returns table (
    id uuid,
    title text,
    description text,
    fields jsonb
)
language plpgsql
as $$
begin
    return query
    select f.id, f.title, f.description, f.fields
    from forms f
    where f.id = p_form_id;
end;
$$ set search_path = public;


-- Update get_paginated_form_responses function
create or replace function get_paginated_form_responses(p_form_id uuid, search_term text, page_number int, page_size int)
returns table (
    id uuid,
    created_at timestamptz,
    data jsonb,
    total_count bigint
)
language plpgsql
as $$
begin
    -- First, check if the current user owns the form
    if not exists (select 1 from forms where id = p_form_id and created_by = auth.uid()) then
        raise exception 'User does not have permission to view responses for this form.';
    end if;

    return query
    with filtered_responses as (
        select
            r.id,
            r.created_at,
            r.data
        from responses r
        where r.form_id = p_form_id
        and (
            search_term is null or search_term = '' or
            r.data::text ilike '%' || search_term || '%'
        )
    ),
    total as (
        select count(*) as total from filtered_responses
    )
    select
        fr.id,
        fr.created_at,
        fr.data,
        t.total
    from filtered_responses fr
    cross join total t
    order by fr.created_at desc
    limit page_size
    offset (page_number - 1) * page_size;
end;
$$ set search_path = public;
