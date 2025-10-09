/*
# [Fix] Correct Analytics Database Functions
[This script resolves a migration error by safely dropping and recreating the database functions required for the analytics dashboard. It ensures the function signatures are correct and security settings are properly applied.]

## Query Description: [This operation will drop two existing database functions (get_analytics_summary and get_daily_submission_counts) and recreate them. This is a safe operation as it only affects function definitions and does not alter any stored data. It is necessary to fix a function signature mismatch that was causing migration failures.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Drops function: public.get_analytics_summary()
- Drops function: public.get_daily_submission_counts(integer)
- Recreates function: public.get_analytics_summary()
- Recreates function: public.get_daily_submission_counts(integer)

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [Functions use auth.uid() to scope data to the logged-in user.]

## Performance Impact:
- Indexes: [N/A]
- Triggers: [N/A]
- Estimated Impact: [None. This is a metadata change.]
*/

-- Drop the existing functions to avoid signature conflicts.
DROP FUNCTION IF EXISTS public.get_analytics_summary();
DROP FUNCTION IF EXISTS public.get_daily_submission_counts(integer);

-- Recreate the summary function with security definer.
CREATE OR REPLACE FUNCTION public.get_analytics_summary()
RETURNS TABLE(total_forms bigint, total_responses bigint, avg_responses_per_form numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT f.id) AS total_forms,
    COUNT(r.id) AS total_responses,
    CASE
      WHEN COUNT(DISTINCT f.id) > 0 THEN COUNT(r.id)::numeric / COUNT(DISTINCT f.id)
      ELSE 0
    END AS avg_responses_per_form
  FROM
    forms f
  LEFT JOIN
    responses r ON f.id = r.form_id
  WHERE
    f.created_by = auth.uid();
END;
$$;

-- Recreate the daily counts function with the correct parameter name and security definer.
CREATE OR REPLACE FUNCTION public.get_daily_submission_counts(days_limit integer)
RETURNS TABLE(submission_date date, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_forms AS (
    SELECT id FROM forms WHERE created_by = auth.uid()
  )
  SELECT
    r.created_at::date AS submission_date,
    COUNT(r.id) AS count
  FROM
    responses r
  WHERE
    r.form_id IN (SELECT id FROM user_forms)
    AND r.created_at >= (NOW() - (days_limit || ' days')::interval)
  GROUP BY
    r.created_at::date
  ORDER BY
    submission_date;
END;
$$;
