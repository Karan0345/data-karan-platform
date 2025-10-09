/*
  # Create Analytics Summary Function
  This function calculates and returns key analytics metrics for the authenticated user's forms.

  ## Query Description:
  - This is a safe, read-only operation that aggregates data.
  - It calculates the total number of forms, total responses across all forms, and the average number of responses per form.
  - The function only considers forms and responses owned by the currently authenticated user, ensuring data privacy.

  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (the function can be dropped)

  ## Structure Details:
  - Reads from `public.forms` and `public.responses`.
  - Returns a single row with `total_forms`, `total_responses`, `avg_responses_per_form`.

  ## Security Implications:
  - RLS Status: The function respects RLS by filtering on `auth.uid()`.
  - Policy Changes: No
  - Auth Requirements: Must be called by an authenticated user.

  ## Performance Impact:
  - Indexes: Performance depends on indexes on `forms.created_by` and `responses.form_id`.
  - Estimated Impact: Low impact, as it performs aggregate queries.
*/
create or replace function public.get_analytics_summary()
returns table (total_forms bigint, total_responses bigint, avg_responses_per_form numeric)
language plpgsql
security definer set search_path = public
as $$
declare
    v_total_forms bigint;
    v_total_responses bigint;
begin
    -- Calculate total forms for the current user
    select count(*)
    into v_total_forms
    from public.forms
    where created_by = auth.uid();

    -- Calculate total responses for the current user's forms
    select count(*)
    into v_total_responses
    from public.responses r
    join public.forms f on r.form_id = f.id
    where f.created_by = auth.uid();

    -- Return the summary
    return query
    select
        v_total_forms as total_forms,
        v_total_responses as total_responses,
        case
            when v_total_forms > 0 then (v_total_responses::numeric / v_total_forms::numeric)
            else 0
        end as avg_responses_per_form;
end;
$$;

/*
  # Create Daily Submission Counts Function
  This function calculates the number of form submissions per day for the last N days.

  ## Query Description:
  - This is a safe, read-only operation that aggregates time-series data.
  - It groups responses by their creation date to provide a daily count.
  - The function is secure, only counting responses for forms owned by the currently authenticated user.

  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (the function can be dropped)

  ## Structure Details:
  - Reads from `public.forms` and `public.responses`.
  - Returns a set of rows with `submission_date` and `count`.
  - Accepts a `days_limit` parameter to control the time window.

  ## Security Implications:
  - RLS Status: The function respects RLS by filtering on `auth.uid()`.
  - Policy Changes: No
  - Auth Requirements: Must be called by an authenticated user.

  ## Performance Impact:
  - Indexes: Performance benefits from an index on `responses.created_at`.
  - Estimated Impact: Low to Medium, depending on the volume of responses.
*/
create or replace function public.get_daily_submission_counts(days_limit integer)
returns table (submission_date date, count bigint)
language sql
security definer set search_path = public
as $$
    select
        date(r.created_at) as submission_date,
        count(*) as count
    from public.responses r
    join public.forms f on r.form_id = f.id
    where
        f.created_by = auth.uid() and
        r.created_at >= (now() - (days_limit || ' days')::interval)
    group by
        date(r.created_at)
    order by
        submission_date asc;
$$;
