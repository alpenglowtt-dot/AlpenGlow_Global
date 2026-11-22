-- PSS: the quietest 1-hour window per weekday over the last 60 days (IST), for choosing the
-- cutover hour. READ ONLY transaction, counts only, no customer data. Run like
-- phase1-inventory.sql (pooler string at read -rs, throw-away supabase/postgres container).
-- "events" = check-ins + check-outs + payments (transactions) + food bills in that hour;
-- "on_site" = average number of students checked in at some point during that hour.
\pset footer off
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '120s';

\echo == days counted
SELECT (now() - interval '60 days')::date AS from_day, now()::date AS to_day,
       (SELECT count(*) FROM bookings WHERE start_time >= now() - interval '60 days') AS sessions_in_window;

\echo == events per weekday (rows, 1 = Monday) and IST hour (columns 00 .. 23)
WITH ev AS (
  SELECT start_time AS t FROM bookings WHERE start_time >= now() - interval '60 days'
  UNION ALL SELECT end_time FROM bookings WHERE end_time >= now() - interval '60 days'
  UNION ALL SELECT created_at FROM transactions WHERE created_at >= now() - interval '60 days'
  UNION ALL SELECT created_at FROM food_bills WHERE created_at >= now() - interval '60 days'),
e AS (SELECT extract(isodow FROM t AT TIME ZONE 'Asia/Kolkata')::int AS dow,
             extract(hour FROM t AT TIME ZONE 'Asia/Kolkata')::int AS hr, count(*) AS n FROM ev GROUP BY 1, 2)
SELECT d.dow AS weekday, to_char(date '2026-11-16' + d.dow - 1, 'Dy') AS day,
       string_agg(lpad(coalesce(e.n, 0)::text, 5), '' ORDER BY h.hr) AS hours_00_to_23
  FROM generate_series(1, 7) d(dow) CROSS JOIN generate_series(0, 23) h(hr)
  LEFT JOIN e ON e.dow = d.dow AND e.hr = h.hr
 GROUP BY d.dow ORDER BY d.dow;

\echo == quietest hour per weekday (fewest events, then fewest students on site)
WITH ev AS (
  SELECT start_time AS t FROM bookings WHERE start_time >= now() - interval '60 days'
  UNION ALL SELECT end_time FROM bookings WHERE end_time >= now() - interval '60 days'
  UNION ALL SELECT created_at FROM transactions WHERE created_at >= now() - interval '60 days'
  UNION ALL SELECT created_at FROM food_bills WHERE created_at >= now() - interval '60 days'),
e AS (SELECT extract(isodow FROM t AT TIME ZONE 'Asia/Kolkata')::int AS dow,
             extract(hour FROM t AT TIME ZONE 'Asia/Kolkata')::int AS hr, count(*) AS n FROM ev GROUP BY 1, 2),
hours AS (SELECT h FROM generate_series(date_trunc('hour', now() - interval '60 days'), date_trunc('hour', now()) - interval '1 hour', interval '1 hour') h),
occ AS (SELECT extract(isodow FROM h AT TIME ZONE 'Asia/Kolkata')::int AS dow,
               extract(hour FROM h AT TIME ZONE 'Asia/Kolkata')::int AS hr,
               avg((SELECT count(*) FROM bookings b
                     WHERE b.start_time < h + interval '1 hour'
                       AND coalesce(b.end_time, CASE WHEN b.status = 'active' THEN now() ELSE b.start_time END) > h)) AS on_site
          FROM hours GROUP BY 1, 2),
g AS (SELECT o.dow, o.hr, coalesce(e.n, 0) AS events, round(o.on_site, 1) AS on_site
        FROM occ o LEFT JOIN e ON e.dow = o.dow AND e.hr = o.hr)
SELECT DISTINCT ON (dow) dow AS weekday, to_char(date '2026-11-16' + dow - 1, 'Dy') AS day,
       lpad(hr::text, 2, '0') || ':00-' || lpad(((hr + 1) % 24)::text, 2, '0') || ':00 IST' AS quietest_hour,
       events AS events_in_60_days, on_site AS avg_students_on_site
  FROM g ORDER BY dow, events, on_site, hr;

\echo == the 6 quietest hours over all weekdays together
WITH ev AS (
  SELECT start_time AS t FROM bookings WHERE start_time >= now() - interval '60 days'
  UNION ALL SELECT end_time FROM bookings WHERE end_time >= now() - interval '60 days'
  UNION ALL SELECT created_at FROM transactions WHERE created_at >= now() - interval '60 days'
  UNION ALL SELECT created_at FROM food_bills WHERE created_at >= now() - interval '60 days'),
hours AS (SELECT h FROM generate_series(date_trunc('hour', now() - interval '60 days'), date_trunc('hour', now()) - interval '1 hour', interval '1 hour') h)
SELECT lpad(hr::text, 2, '0') || ':00 IST' AS hour,
       (SELECT count(*) FROM ev WHERE extract(hour FROM t AT TIME ZONE 'Asia/Kolkata') = hr) AS events_in_60_days,
       round((SELECT avg((SELECT count(*) FROM bookings b WHERE b.start_time < h + interval '1 hour'
                            AND coalesce(b.end_time, CASE WHEN b.status = 'active' THEN now() ELSE b.start_time END) > h))
                FROM hours WHERE extract(hour FROM h AT TIME ZONE 'Asia/Kolkata') = hr), 1) AS avg_students_on_site
  FROM generate_series(0, 23) hr ORDER BY 2, 3, 1 LIMIT 6;

ROLLBACK;
\echo == done (read-only, nothing written)
