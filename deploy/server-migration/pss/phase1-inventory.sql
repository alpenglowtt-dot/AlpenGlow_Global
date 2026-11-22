-- PSS inventory: Phase 1 against the live cloud project, Phase 2 step 8 against pss-db.
-- READ ONLY transaction (nothing can be written), counts and names only, no customer data.
--   docker run --rm -i -e PSS_CLOUD_DB_URL --entrypoint sh supabase/postgres:17.6.1.136 \
--     -c 'psql "$PSS_CLOUD_DB_URL" -X -q -P pager=off -f -' < ~/pss-phase1-inventory.sql
\pset footer off
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '120s';

\echo == server
SELECT current_setting('server_version') AS postgres, pg_size_pretty(pg_database_size(current_database())) AS db_size, now() AS read_at;

\echo == extensions installed
SELECT string_agg(extname || ' ' || extversion, ', ' ORDER BY extname) AS extensions FROM pg_extension;
SELECT (SELECT count(*) FROM pg_available_extensions WHERE name = 'pg_cron') AS pg_cron_available,
       (SELECT count(*) FROM pg_extension WHERE extname = 'pg_cron') AS pg_cron_installed;

\echo == public schema objects
SELECT (SELECT count(*) FROM pg_tables WHERE schemaname = 'public') AS tables,
       (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public') AS indexes,
       (SELECT count(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace) AS functions,
       (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid WHERE c.relnamespace = 'public'::regnamespace AND NOT t.tgisinternal) AS triggers,
       (SELECT count(*) FROM pg_policies WHERE schemaname = 'public') AS policies,
       (SELECT count(*) FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typtype = 'e') AS enums;

\echo == tables WITHOUT row security
SELECT coalesce(string_agg(relname, ', ' ORDER BY relname), '(none)') AS rls_off
  FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'r' AND NOT relrowsecurity;

\echo == rows per table
SELECT table_name,
       (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM public.%I', table_name), false, true, '')))[1]::text::bigint AS rows
  FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY 1;

\echo == names 052/053/054 would create (must be absent before 052-054 run)
SELECT n AS name, to_regclass('public.' || n) IS NOT NULL OR EXISTS (SELECT 1 FROM pg_proc WHERE proname = n AND pronamespace = 'public'::regnamespace) AS exists_already
  FROM unnest(ARRAY['login_failures','idempotency_keys','revenue_daily','revenue_daily_state','login_locked_until','report_revenue',
                    'report_revenue_live','refresh_revenue_summary','purge_scale_tables','money_record_payment','money_ledger',
                    'money_create_food_bill']) n;
SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'last_login_at') AS staff_last_login_at_exists;

\echo == one open session per student / per desk (053 skips its unique index if any count is not 0)
SELECT (SELECT count(*) FROM (SELECT student_id FROM bookings WHERE status = 'active' GROUP BY student_id HAVING count(*) > 1) x) AS students_with_2plus_open_sessions,
       (SELECT count(*) FROM (SELECT desk_id FROM bookings WHERE status = 'active' AND desk_id IS NOT NULL GROUP BY desk_id HAVING count(*) > 1) x) AS desks_with_2plus_open_sessions,
       (SELECT count(*) FROM bookings WHERE status = 'active') AS open_sessions_now;

\echo == students per branch
SELECT b.name AS branch, count(s.id) AS students,
       count(s.id) FILTER (WHERE EXISTS (SELECT 1 FROM memberships m WHERE m.student_id = s.id AND m.is_active)) AS with_active_membership
  FROM branches b LEFT JOIN students s ON s.branch_id = b.id GROUP BY b.name ORDER BY 1;

\echo == sessions and money per month (IST)
SELECT to_char(m, 'YYYY-MM') AS month,
       (SELECT count(*) FROM bookings WHERE (start_time AT TIME ZONE 'Asia/Kolkata') >= m AND (start_time AT TIME ZONE 'Asia/Kolkata') < m + interval '1 month') AS sessions,
       (SELECT count(*) FROM transactions WHERE (created_at AT TIME ZONE 'Asia/Kolkata') >= m AND (created_at AT TIME ZONE 'Asia/Kolkata') < m + interval '1 month') AS transactions,
       (SELECT round(coalesce(sum(amount), 0)) FROM transactions WHERE (created_at AT TIME ZONE 'Asia/Kolkata') >= m AND (created_at AT TIME ZONE 'Asia/Kolkata') < m + interval '1 month') AS revenue_rupees
  FROM generate_series(date_trunc('month', coalesce((SELECT min(created_at) FROM transactions), now()) AT TIME ZONE 'Asia/Kolkata'),
                       date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata'), interval '1 month') m ORDER BY 1;

\echo == largest tables
SELECT relname AS table_name, pg_size_pretty(pg_total_relation_size(oid)) AS size
  FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'r' ORDER BY pg_total_relation_size(oid) DESC LIMIT 8;

\echo == role timeouts (053 sets service_role to 30s)
SELECT rolname, coalesce(array_to_string(rolconfig, ', '), '-') AS settings FROM pg_roles
 WHERE rolname IN ('anon', 'authenticated', 'service_role', 'authenticator') ORDER BY 1;

\echo == not used by the code: auth, storage, cron, realtime, webhooks
SELECT CASE WHEN to_regclass('auth.users') IS NULL THEN NULL ELSE (xpath('/row/c/text()', query_to_xml('SELECT count(*) AS c FROM auth.users', false, true, '')))[1]::text::bigint END AS auth_users,
       CASE WHEN to_regclass('storage.buckets') IS NULL THEN NULL ELSE (xpath('/row/c/text()', query_to_xml('SELECT count(*) AS c FROM storage.buckets', false, true, '')))[1]::text::bigint END AS storage_buckets,
       CASE WHEN to_regclass('storage.objects') IS NULL THEN NULL ELSE (xpath('/row/c/text()', query_to_xml('SELECT count(*) AS c FROM storage.objects', false, true, '')))[1]::text::bigint END AS storage_objects,
       CASE WHEN to_regclass('cron.job') IS NULL THEN NULL ELSE (xpath('/row/c/text()', query_to_xml('SELECT count(*) AS c FROM cron.job', false, true, '')))[1]::text::bigint END AS cron_jobs,
       (SELECT count(*) FROM pg_publication_tables WHERE pubname = 'supabase_realtime') AS realtime_tables,
       CASE WHEN to_regclass('supabase_functions.hooks') IS NULL THEN NULL ELSE (xpath('/row/c/text()', query_to_xml('SELECT count(*) AS c FROM supabase_functions.hooks', false, true, '')))[1]::text::bigint END AS webhooks;
SELECT CASE WHEN to_regclass('storage.buckets') IS NULL THEN '(no storage schema)'
            ELSE (xpath('/row/b/text()', query_to_xml('SELECT coalesce(string_agg(name || CASE WHEN public THEN '' (public)'' ELSE '''' END, '', ''), ''(none)'') AS b FROM storage.buckets', false, true, '')))[1]::text END AS buckets;

\echo == migrations recorded by the Supabase CLI
SELECT CASE WHEN to_regclass('supabase_migrations.schema_migrations') IS NULL THEN NULL
            ELSE (xpath('/row/c/text()', query_to_xml('SELECT count(*) AS c FROM supabase_migrations.schema_migrations', false, true, '')))[1]::text::bigint END AS cli_migrations,
       CASE WHEN to_regclass('public._migrations_applied') IS NULL THEN NULL
            ELSE (xpath('/row/c/text()', query_to_xml('SELECT count(*) AS c FROM public._migrations_applied', false, true, '')))[1]::text::bigint END AS migrations_applied_table;

ROLLBACK;
\echo == done (read-only, nothing written)
