/*
          # [Function] get_dashboard_stats
          Retrieves key performance indicators for the admin dashboard.

          ## Query Description: [This function calculates the total number of forms, the total number of responses, and the count of forms that have at least one response for the currently authenticated user. It is designed to be a single, efficient query for populating the main dashboard analytics cards. This is a read-only operation and has no impact on existing data.]
          
          ## Metadata:
          - Schema-Category: ["Safe", "Data"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Tables: forms, responses
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [Authenticated User]
          
          ## Performance Impact:
          - Indexes: [Uses primary keys and foreign keys on forms and responses]
          - Triggers: [None]
          - Estimated Impact: [Low. The query is optimized to run quickly for the logged-in user.]
          */
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    total_forms BIGINT,
    total_responses BIGINT,
    active_forms BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    WITH user_forms AS (
        SELECT id FROM forms WHERE created_by = user_id
    ),
    user_responses AS (
        SELECT form_id FROM responses WHERE form_id IN (SELECT id FROM user_forms)
    )
    SELECT
        (SELECT COUNT(*) FROM user_forms) AS total_forms,
        (SELECT COUNT(*) FROM user_responses) AS total_responses,
        (SELECT COUNT(DISTINCT form_id) FROM user_responses) AS active_forms;
END;
$$;


/*
          # [Function] get_daily_submission_counts
          Retrieves the daily count of form submissions over a specified number of past days.

          ## Query Description: [This function generates a time-series of submission counts for the currently authenticated user, which is ideal for populating charts. It groups responses by their creation day and returns a count for each day within the look-back period. This is a read-only operation.]
          
          ## Metadata:
          - Schema-Category: ["Safe", "Data"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Tables: forms, responses
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [Authenticated User]
          
          ## Performance Impact:
          - Indexes: [Benefits from an index on responses(created_at)]
          - Triggers: [None]
          - Estimated Impact: [Low. The query is efficient, especially with an index on the date column.]
          */
CREATE OR REPLACE FUNCTION get_daily_submission_counts(days_to_look_back INT)
RETURNS TABLE (
    submission_date DATE,
    count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH date_series AS (
        SELECT generate_series(
            CURRENT_DATE - (days_to_look_back - 1) * INTERVAL '1 day',
            CURRENT_DATE,
            '1 day'::interval
        )::DATE AS day
    ),
    daily_counts AS (
        SELECT
            DATE(r.created_at) AS submission_date,
            COUNT(r.id) AS count
        FROM responses r
        JOIN forms f ON r.form_id = f.id
        WHERE f.created_by = auth.uid()
          AND r.created_at >= CURRENT_DATE - (days_to_look_back - 1) * INTERVAL '1 day'
        GROUP BY DATE(r.created_at)
    )
    SELECT
        ds.day,
        COALESCE(dc.count, 0)
    FROM date_series ds
    LEFT JOIN daily_counts dc ON ds.day = dc.submission_date
    ORDER BY ds.day;
$$;

-- Grant execution rights to the authenticated role
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_submission_counts(INT) TO authenticated;
