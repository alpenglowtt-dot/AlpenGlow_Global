---
type: "query"
date: "2026-07-21T08:33:18.728427+00:00"
question: "Why did the WhatsApp OTP template keep failing with Meta API errors 132001 and 132018?"
contributor: "graphify"
outcome: "corrected"
correction: "Stop guessing Meta API formats from documentation memory; add console.error logging of the full raw error_data.details field and read Meta actual response text, which named the exact required format directly."
source_nodes: ["send-sms-otp/index.ts"]
---

# Q: Why did the WhatsApp OTP template keep failing with Meta API errors 132001 and 132018?

## Answer

Three separate gotchas, not one bug. First, the template name must match Meta exact literal string including typos, the real approved template was named with a typo, alpenglow_otp_verfication, and the secret had to match that exact misspelling. Second, the language code must match what Meta actually shows for the template, plain English in Meta UI means the API code is en, not en_US, guessing en_US caused error 132001 template not found. Third, the button component sub_type must literally be url even though the template was configured as a Copy Code button in Meta UI, not copy_code as the naming would suggest, confirmed directly from Meta error text saying Button at index 0 must be of type Url. Guessing sub_type copy_code and a coupon_code parameter type both failed with 132018 before this was found by adding full error logging and reading Meta actual response instead of guessing further.

## Outcome

- Signal: corrected
- Correction: Stop guessing Meta API formats from documentation memory; add console.error logging of the full raw error_data.details field and read Meta actual response text, which named the exact required format directly.

## Source Nodes

- send-sms-otp/index.ts