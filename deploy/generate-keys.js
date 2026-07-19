#!/usr/bin/env node
// Generates the JWT_SECRET, ANON_KEY, and SERVICE_ROLE_KEY needed for a
// self-hosted Supabase instance's .env — the cloud dashboard normally
// generates these for you; self-hosted requires you to mint your own.
//
// Usage: node generate-keys.js
// Requires no dependencies beyond Node's built-in crypto (Node 16+).

const crypto = require('crypto')

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encHeader = base64url(JSON.stringify(header))
  const encPayload = base64url(JSON.stringify(payload))
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encHeader}.${encPayload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `${encHeader}.${encPayload}.${signature}`
}

const jwtSecret = crypto.randomBytes(32).toString('hex') // 64 hex chars
const now = Math.floor(Date.now() / 1000)
const tenYears = 10 * 365 * 24 * 60 * 60

const anonKey = signJwt(
  { role: 'anon', iss: 'supabase', iat: now, exp: now + tenYears },
  jwtSecret
)
const serviceRoleKey = signJwt(
  { role: 'service_role', iss: 'supabase', iat: now, exp: now + tenYears },
  jwtSecret
)
const postgresPassword = crypto.randomBytes(18).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)
const dashboardPassword = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)

console.log('# Paste these into your VPS .env (see deploy/.env.selfhost.example)')
console.log('# Keep this output somewhere safe — it will NOT be shown again.\n')
console.log(`JWT_SECRET=${jwtSecret}`)
console.log(`ANON_KEY=${anonKey}`)
console.log(`SERVICE_ROLE_KEY=${serviceRoleKey}`)
console.log(`POSTGRES_PASSWORD=${postgresPassword}`)
console.log(`DASHBOARD_USERNAME=admin`)
console.log(`DASHBOARD_PASSWORD=${dashboardPassword}`)
