// Shared OTP rate limiter — protects the SMS/WhatsApp/email send
// endpoints from abuse (spam, cost-draining, harassment).
//
// Uses the otp_verifications table itself as the counter, so it needs
// no extra infrastructure. Send functions must only delete EXPIRED
// unverified codes (not recent ones), otherwise the window resets.
//
// Limits: at most 1 code per 45s and 5 codes per hour, per contact+type.

// deno-lint-ignore no-explicit-any
export async function otpRateLimited(
  sb: any,
  contact: string,
  type: 'sms' | 'email',
): Promise<string | null> {
  const now = Date.now()

  const { count: burst } = await sb
    .from('otp_verifications')
    .select('id', { count: 'exact', head: true })
    .eq('contact', contact)
    .eq('type', type)
    .gte('created_at', new Date(now - 45_000).toISOString())
  if ((burst ?? 0) >= 1) {
    return 'Please wait a moment before requesting another code.'
  }

  const { count: hourly } = await sb
    .from('otp_verifications')
    .select('id', { count: 'exact', head: true })
    .eq('contact', contact)
    .eq('type', type)
    .gte('created_at', new Date(now - 3_600_000).toISOString())
  if ((hourly ?? 0) >= 5) {
    return 'Too many codes requested. Please try again later.'
  }

  return null
}
