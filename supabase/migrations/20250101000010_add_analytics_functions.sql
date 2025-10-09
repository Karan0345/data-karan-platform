/*
# [Function] get_analytics_summary
[This function calculates summary analytics for the authenticated user, including total forms, total responses, and the average number of responses per form.]

## Query Description: [This is a read-only operation that aggregates data from the 'forms' and 'responses' tables. It is safe and does not modify any data. It respects Row Level Security by only considering data owned by the current user.]

## Metadata:
- Schema-Category: ["Safe", "Data"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Reads from: public.forms, public.responses
- Creates function: public.get_analytics_summary()

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [Requires authenticated user]

## Performance Impact:
- Indexes: [Uses existing primary keys and foreign keys.]
- Triggers: [None]
- Estimated Impact: [Low. Performance depends on the number of forms and responses for the user.]
*/
CREATE OR REPLACE FUNCTION public.get_analytics_summary()
RETURNS TABLE(total_forms BIGINT, total_responses BIGINT, avg_responses_per_form NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    auth_user_id UUID := auth.uid();
    v_total_forms BIGINT;
    v_total_responses BIGINT;
BEGIN
    SELECT COUNT(*)
    INTO v_total_forms
    FROM forms
    WHERE created_by = auth_user_id;

    SELECT COUNT(*)
    INTO v_total_responses
    FROM responses r
    JOIN forms f ON r.form_id = f.id
    WHERE f.created_by = auth_user_id;

    RETURN QUERY
    SELECT
        v_total_forms,
        v_total_responses,
        CASE
            WHEN v_total_forms > 0 THEN v_total_responses::NUMERIC / v_total_forms::NUMERIC
            ELSE 0
        END;
END;
$$;


/*
# [Function] get_daily_submission_counts
[This function retrieves the daily count of form submissions over a specified number of past days for the authenticated user.]

## Query Description: [This is a read-only operation that aggregates data from the 'responses' table. It is safe and does not modify any data. It respects Row Level Security by only considering responses to forms owned by the current user.]

## Metadata:
- Schema-Category: ["Safe", "Data"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Reads from: public.responses, public.forms
- Creates function: public.get_daily_submission_counts(days_limit INT)

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [Requires authenticated user]

## Performance Impact:
- Indexes: [Benefits from an index on responses.created_at and forms.created_by.]
- Triggers: [None]
- Estimated Impact: [Low to Medium. Performance depends on the number of responses within the date range.]
*/
CREATE OR REPLACE FUNCTION public.get_daily_submission_counts(days_limit INT)
RETURNS TABLE(submission_date DATE, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            (NOW() AT TIME ZONE 'utc' - (days_limit - 1) * '1 day'::interval)::date,
            (NOW() AT TIME ZONE 'utc')::date,
            '1 day'::interval
        )::date AS day
    ),
    user_responses AS (
        SELECT r.created_at::date as response_date
        FROM responses r
        JOIN forms f ON r.form_id = f.id
        WHERE f.created_by = auth.uid()
          AND r.created_at >= (NOW() AT TIME ZONE 'utc' - (days_limit - 1) * '1 day'::interval)::date
    )
    SELECT
        ds.day AS submission_date,
        COUNT(ur.response_date) AS count
    FROM date_series ds
    LEFT JOIN user_responses ur ON ds.day = ur.response_date
    GROUP BY ds.day
    ORDER BY ds.day;
END;
$$;
