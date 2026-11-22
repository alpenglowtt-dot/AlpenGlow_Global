// Checks the local PSS rehearsal stack (setup-local.sh + seed.sql, DUMMY data only).
//
//   node check.mjs [--orig-only|--fixed-only]
//
// For every list that can grow past 1000 rows it asks the database for the true
// number, then calls the fixed function ("api") and the original one ("apiorig",
// from origin/main) with the same request. PASS means the fixed function returns
// exactly the database's number; the original's number is shown next to it. Then:
// create_staff role rules, branch isolation, and the longest internal REST URL each
// version sent (read from Kong's access log; Kong and nginx refuse a URL over 8 KB
// by default). It never prints row contents.
import { execFileSync } from "node:child_process";

const BASE = "http://127.0.0.1:8010/functions/v1";
const DB = "psslocal-db";
const KONG = "psslocal-kong";

const sql = (q) => execFileSync("docker", ["exec", DB, "psql", "-U", "postgres", "-d", "postgres", "-tAc", q], { encoding: "utf8" }).trim();
const num = (q) => Number(sql(q));
// The same IST day and month bounds the function uses (istDayStart/istDayEnd).
const T = "(now() AT TIME ZONE 'Asia/Kolkata')::date";
const MS = `(date_trunc('month', ${T})::timestamp AT TIME ZONE 'Asia/Kolkata')`;
const TE = `((${T} + 1)::timestamp AT TIME ZONE 'Asia/Kolkata' - interval '1 microsecond')`;

async function call(fn, action, payload = {}, token) {
  const t0 = performance.now();
  const res = await fetch(`${BASE}/${fn}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ action, ...payload }),
  });
  const text = await res.text();
  let body; try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 200) }; }
  return { status: res.status, body, ms: Math.round(performance.now() - t0) };
}
async function login(fn, username, password) {
  const r = await call(fn, "login", { username, password });
  if (r.status !== 200) throw new Error(`${fn} login ${username}: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.token;
}

const branches = sql("SELECT string_agg(id::text, ',' ORDER BY name) FROM branches WHERE is_active").split(",");
const B0 = branches[0];
const dbTruth = {
  students: num(`SELECT count(*) FROM students WHERE branch_id IN (SELECT id FROM branches WHERE is_active)`),
  activeMembers: num(`SELECT count(*) FROM memberships WHERE is_active AND branch_id IN (SELECT id FROM branches WHERE is_active)`),
  overtimeDue: num(`SELECT coalesce(sum(o.billed_amount), 0) FROM memberships m JOIN overtime_sessions o ON o.student_id = m.student_id
                    WHERE m.is_active AND m.branch_id IN (SELECT id FROM branches WHERE is_active) AND o.billed_at IS NULL AND NOT o.excluded`),
  pendingCashbacks: num(`SELECT count(*) FROM memberships m JOIN cashbacks c ON c.student_id = m.student_id
                         WHERE m.is_active AND m.branch_id IN (SELECT id FROM branches WHERE is_active) AND c.status = 'pending'`),
  dueAll: num(`SELECT count(*) FROM memberships WHERE is_active AND fee_due > 0`),
  expiringSoon: num(`SELECT count(*) FROM memberships WHERE is_active AND end_date BETWEEN ${T} AND ${T} + 7`),
  expired: num(`SELECT count(*) FROM memberships WHERE is_active AND end_date < ${T}`),
  overdueLockers: num(`SELECT count(*) FROM lockers WHERE is_active AND locker_due_date < ${T}`),
  expiringToday: num(`SELECT count(*) FROM memberships WHERE is_active AND end_date = ${T}`),
  openBookings: num(`SELECT count(*) FROM bookings WHERE status = 'active' AND branch_id IN (SELECT id FROM branches WHERE is_active)`),
  openFoodTotal: num(`SELECT coalesce(sum(f.total), 0) FROM bookings b JOIN food_bills f ON f.booking_id = b.id WHERE b.status = 'active'`),
  openUnpaid: num(`SELECT coalesce(sum(CASE WHEN b.booking_type = 'walkin'
                     THEN (SELECT coalesce(sum(total), 0) FROM food_bills WHERE booking_id = b.id AND NOT paid)
                     ELSE (SELECT coalesce(sum(total), 0) FROM food_bills WHERE student_id = b.student_id AND NOT paid) END), 0)
                   FROM bookings b WHERE b.status = 'active'`),
  openWithPass: num(`SELECT count(*) FROM bookings b WHERE b.status = 'active' AND b.booking_type <> 'walkin' AND EXISTS (SELECT 1 FROM food_passes p WHERE p.student_id = b.student_id)`),
  monthWalkins: num(`SELECT count(*) FROM bookings WHERE booking_type = 'walkin' AND created_at BETWEEN ${MS} AND ${TE}`),
  monthNewMembers: num(`SELECT count(*) FROM memberships WHERE created_at BETWEEN ${MS} AND ${TE}`),
  monthAttendance: num(`SELECT count(DISTINCT student_id) FROM bookings WHERE start_time BETWEEN ${MS} AND ${TE}`),
  activeNow: num(`SELECT count(*) FROM memberships WHERE is_active AND end_date >= ${T}`),
  b0MonthBookings: num(`SELECT count(*) FROM bookings WHERE branch_id = '${B0}' AND created_at BETWEEN ${MS} AND ${TE}`),
  b0MonthTxns: num(`SELECT count(*) FROM transactions WHERE branch_id = '${B0}' AND created_at BETWEEN ${MS} AND ${TE}`),
  b0TopVisits: num(`SELECT coalesce(max(n), 0) FROM (SELECT count(*) n FROM bookings WHERE branch_id = '${B0}' AND start_time >= ${MS} GROUP BY student_id) x`),
  b0Cashbacks: num(`SELECT count(*) FROM cashbacks WHERE branch_id = '${B0}'`),
  b0Alerts: num(`SELECT count(*) FROM alerts WHERE branch_id = '${B0}' AND status = 'pending'`),
  monthFoodBills: num(`SELECT count(*) FROM food_bills WHERE created_at BETWEEN ${MS} AND ${TE}`),
  enquiries: num(`SELECT count(*) FROM enquiries`),
  tasks: num(`SELECT count(*) FROM tasks`),
  missedTasks: num(`SELECT count(*) FROM tasks WHERE repeat_interval = 'none' AND status <> 'done' AND due_date < ${T} AND due_date >= ${T} - 7`),
  dueTodayTasks: num(`SELECT count(*) FROM tasks t JOIN staff s ON s.id = t.assigned_to_staff_id
                      WHERE (t.repeat_interval = 'daily' AND coalesce(t.due_date, t.created_at::date) <= ${T} AND s.is_active)
                         OR (t.repeat_interval = 'none' AND t.due_date = ${T} AND t.status <> 'done' AND s.is_active)`),
  allMemberships: num(`SELECT count(*) FROM memberships`),
};

const len = (x) => (Array.isArray(x) ? x.length : NaN);
const sum = (xs, f) => (Array.isArray(xs) ? xs.reduce((a, x) => a + Number(f(x) ?? 0), 0) : NaN);
// [label, expected, action, payload, as, pick]
const CHECKS = [
  ["list_students (all branches)", "students", "list_students", { allBranches: true }, "owner", (b) => len(b.students)],
  ["list_active_memberships: members", "activeMembers", "list_active_memberships", { allBranches: true }, "owner", (b) => len(b.members)],
  ["list_active_memberships: unbilled overtime Rs", "overtimeDue", "list_active_memberships", { allBranches: true }, "owner", (b) => sum(b.members, (m) => m.unbilled_overtime_due)],
  ["list_active_memberships: pending cashbacks", "pendingCashbacks", "list_active_memberships", { allBranches: true }, "owner", (b) => sum(b.members, (m) => m.pending_cashbacks?.length)],
  ["get_actionable_items: fee due", "dueAll", "get_actionable_items", { allBranches: true }, "owner", (b) => len(b.dueToday)],
  ["get_actionable_items: expiring in 7 days", "expiringSoon", "get_actionable_items", { allBranches: true }, "owner", (b) => len(b.expiringSoon)],
  ["get_actionable_items: expired", "expired", "get_actionable_items", { allBranches: true }, "owner", (b) => len(b.expiredMemberships)],
  ["get_actionable_items: overdue lockers", "overdueLockers", "get_actionable_items", { allBranches: true }, "owner", (b) => len(b.overdueLockers)],
  ["get_combined_pending: fee due", "dueAll", "get_combined_pending", {}, "owner", (b) => len(b.duePayments)],
  ["get_combined_pending: ending today", "expiringToday", "get_combined_pending", {}, "owner", (b) => len(b.expiredMemberships)],
  ["list_today_bookings: open sessions", "openBookings", "list_today_bookings", { allBranches: true }, "owner", (b) => len(b.bookings)],
  ["list_today_bookings: food total Rs", "openFoodTotal", "list_today_bookings", { allBranches: true }, "owner", (b) => sum(b.bookings, (x) => x.foodTotal)],
  ["list_today_bookings: unpaid food Rs", "openUnpaid", "list_today_bookings", { allBranches: true }, "owner", (b) => sum(b.bookings, (x) => x.unpaidFoodTotal)],
  ["list_today_bookings: with food pass", "openWithPass", "list_today_bookings", { allBranches: true }, "owner", (b) => sum(b.bookings, (x) => (x.hasFoodPass ? 1 : 0))],
  ["get_daily_report month: walk-ins", "monthWalkins", "get_daily_report", { allBranches: true, period: "month" }, "owner", (b) => len(b.walkins)],
  ["get_daily_report month: new memberships", "monthNewMembers", "get_daily_report", { allBranches: true, period: "month" }, "owner", (b) => len(b.newMembers)],
  ["get_daily_report month: students attended", "monthAttendance", "get_daily_report", { allBranches: true, period: "month" }, "owner", (b) => b.attendanceBreakdown?.total],
  ["get_daily_report: active memberships", "activeNow", "get_daily_report", { allBranches: true, period: "month" }, "owner", (b) => b.activeMemberships],
  ["get_recent_activity branch 1 month: sessions", "b0MonthBookings", "get_recent_activity", { branchId: B0, period: "month" }, "owner", (b) => b.recentActivity?.filter((x) => x.kind === "booking").length],
  ["get_recent_activity branch 1 month: payments", "b0MonthTxns", "get_recent_activity", { branchId: B0, period: "month" }, "owner", (b) => b.recentActivity?.filter((x) => x.kind === "transaction").length],
  ["get_top_students branch 1 month: top visits", "b0TopVisits", "get_top_students", { branchId: B0, period: "month", sortBy: "visits" }, "owner", (b) => b.students?.[0]?.total_visits],
  ["list_cashbacks branch 1", "b0Cashbacks", "list_cashbacks", { branchId: B0 }, "owner", (b) => len(b.cashbacks)],
  ["list_alerts branch 1", "b0Alerts", "list_alerts", { branchId: B0 }, "owner", (b) => len(b.alerts)],
  ["list_food_bills this month (all branches)", "monthFoodBills", "list_food_bills", { allBranches: true, dateFrom: null, dateTo: null }, "owner", (b) => len(b.bills)],
  ["list_enquiries (all branches)", "enquiries", "list_enquiries", { allBranches: true }, "owner", (b) => len(b.enquiries)],
  ["list_tasks (all branches)", "tasks", "list_tasks", { allBranches: true }, "owner", (b) => len(b.tasks)],
  ["list_incomplete_tasks (all branches)", "missedTasks", "list_incomplete_tasks", { allBranches: true }, "owner", (b) => len(b.tasks)],
  ["get_task_completion_report today", "dueTodayTasks", "get_task_completion_report", { allBranches: true }, "owner", (b) => len(b.tasks)],
];

const mode = process.argv[2] ?? "";
const fns = mode === "--orig-only" ? ["apiorig"] : mode === "--fixed-only" ? ["api"] : ["api", "apiorig"];
const tokens = {};
for (const fn of fns) {
  tokens[fn] = {
    owner: await login(fn, "owner", "local-owner-pass"),
    admin: await login(fn, "localadmin", "local-admin-pass"),
    staff1: await login(fn, "staff_1", "local-staff-pass"),
  };
}
// list_food_bills needs explicit dates: this IST month.
const today = sql(`SELECT ${T}`);
for (const c of CHECKS) if (c[2] === "list_food_bills") Object.assign(c[3], { dateFrom: `${today.slice(0, 7)}-01`, dateTo: today });

const kongWindows = {};
const results = [];
let fails = 0;
for (const fn of fns) {
  const since = new Date().toISOString();
  for (const [label, key, action, payload, as, pick] of CHECKS) {
    const r = await call(fn, action, payload, tokens[fn][as]);
    const got = r.status === 200 ? pick(r.body) : `HTTP ${r.status}`;
    results.push({ fn, label, expected: dbTruth[key], got, ms: r.ms, err: r.status === 200 ? "" : JSON.stringify(r.body).slice(0, 120) });
  }
  kongWindows[fn] = { since, until: new Date().toISOString() };
  await new Promise((r) => setTimeout(r, 2000));
}

console.log(`\nToday (IST) ${today}; branch 1 = ${B0.slice(0, 8)}…\n`);
console.log("check".padEnd(48), "database".padStart(9), "fixed".padStart(9), "original".padStart(9), "  result   fixed ms / orig ms");
for (const [label] of CHECKS) {
  const f = results.find((r) => r.fn === "api" && r.label === label);
  const o = results.find((r) => r.fn === "apiorig" && r.label === label);
  const exp = (f ?? o).expected;
  const ok = f ? f.got === exp : null;
  if (ok === false) fails++;
  const res = ok === null ? "" : ok ? "PASS" : "FAIL";
  const shown = (x) => (x == null ? "-" : String(x.got));
  console.log(label.padEnd(48), String(exp).padStart(9), shown(f).padStart(9), shown(o).padStart(9),
    `  ${res.padEnd(7)} ${f ? f.ms : "-"} / ${o ? o.ms : "-"}${f?.err ? "  " + f.err : ""}`);
}

// ── create_staff role rules and branch isolation ───────────────────────────
console.log("\n-- create_staff role rules (expected for the fixed version)");
const roleCases = [
  ["owner creates staff", "owner", "staff", 200],
  ["owner creates owner", "owner", "owner", 200],
  ["owner creates ADMIN", "owner", "admin", 403],
  ["owner sends an unknown role", "owner", "superuser", 400],
  ["admin creates admin", "admin", "admin", 200],
  ["staff creates staff", "staff1", "staff", 403],
];
for (const fn of fns) {
  for (const [label, as, role, want] of roleCases) {
    const username = `t_${fn}_${as}_${role}_${Date.now() % 100000}`;
    const r = await call(fn, "create_staff", { username, password: "local-test-pass", displayName: username, role, branchId: B0 }, tokens[fn][as]);
    const made = sql(`SELECT coalesce(string_agg(role::text, ','), 'none') FROM staff WHERE username = '${username}'`);
    const ok = fn === "api" ? r.status === want : null;
    if (ok === false) fails++;
    console.log(`  ${fn.padEnd(8)} ${label.padEnd(30)} HTTP ${r.status}  row created: ${made.padEnd(6)} ${ok === null ? "" : ok ? "PASS" : `FAIL (want ${want})`}`);
  }
}
console.log("\n-- branch isolation (staff_1 belongs to branch 1)");
for (const fn of fns) {
  const other = await call(fn, "list_students", { branchId: branches[1] }, tokens[fn].staff1);
  const all = await call(fn, "list_students", { allBranches: true }, tokens[fn].staff1);
  const own = await call(fn, "list_students", { branchId: B0 }, tokens[fn].staff1);
  const ownWant = num(`SELECT count(*) FROM students WHERE branch_id = '${B0}'`);
  const ok = other.status === 403 && all.status === 403 && own.status === 200 && len(own.body.students) === ownWant;
  if (fn === "api" && !ok) fails++;
  console.log(`  ${fn.padEnd(8)} other branch HTTP ${other.status}, all branches HTTP ${all.status}, own branch ${len(own.body.students)} of ${ownWant}  ${fn === "api" ? (ok ? "PASS" : "FAIL") : ""}`);
}

// ── longest internal REST URL per version (Kong access log) ────────────────
console.log("\n-- longest URL the function sent to REST through Kong (limit 8 KB by default)");
for (const fn of fns) {
  const { since, until } = kongWindows[fn];
  const log = execFileSync("docker", ["logs", "--since", since, "--until", until, KONG], { encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "pipe"] });
  let max = 0, over8k = 0, s414 = 0, n = 0;
  for (const line of log.split("\n")) {
    const m = line.match(/"(GET|POST|PATCH|DELETE|HEAD) (\/rest\/v1\/\S*) HTTP\/[\d.]+" (\d{3})/);
    if (!m) continue;
    n++; max = Math.max(max, m[2].length);
    if (m[2].length > 8192) over8k++;
    if (m[3] === "414") s414++;
  }
  console.log(`  ${fn.padEnd(8)} ${n} REST calls, longest URL ${(max / 1024).toFixed(1)} KB, ${over8k} over 8 KB, ${s414} answered 414`);
}

console.log(`\nResult: ${fails === 0 ? "all checks PASS" : `${fails} FAIL`}`);
process.exit(fails === 0 ? 0 : 1);
