---
type: "bug"
date: "2026-09-22T12:17:01.621450+00:00"
question: "Why could OTPs for non-Indian numbers go to the wrong person or fail to verify?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["normalisePhone", "sendOfferOTP", "verifyOfferOTP", "api.js"]
---

# Q: Why could OTPs for non-Indian numbers go to the wrong person or fail to verify?

## Answer

send-sms-otp and verify-sms-otp normalisePhone() assumed any 10-digit number was Indian and prepended 91, so +65 8123 4567 (10 digits total) was sent to +91 6581234567; 8-digit NZ numbers too. Fixed 2026-09-22: a raw number starting with '+' is trusted as already international; bare-number heuristics kept for legacy input. Both copies must stay identical. Separately, every frontend gate hard-required exactly 10 digits, blocking SG/AU/UAE/MY/NZ/FR; replaced by shared PHONE_RULES + AlpenAPI.phone.validate/bind in api.js. The offer gate also verified/resent with the bare number (no country code) while sending with cc+number, breaking offers for non-Indian numbers; offer claim check now tests both full and legacy bare formats because check_offer does an exact string match.

## Outcome

- Signal: useful

## Source Nodes

- normalisePhone
- sendOfferOTP
- verifyOfferOTP
- api.js