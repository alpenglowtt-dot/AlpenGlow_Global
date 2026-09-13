---
type: "query"
date: "2026-09-13T12:51:55.141568+00:00"
question: "How were the em/en dashes in the generated SEO content fixed, and what's the escaping pitfall?"
contributor: "graphify"
outcome: "corrected"
source_nodes: ["scripts/seo-head.js", "scripts/seo-homepage.js", "api.js"]
---

# Q: How were the em/en dashes in the generated SEO content fixed, and what's the escaping pitfall?

## Answer

The generator scripts (scripts/seo-head.js, scripts/seo-homepage.js) stored em/en dashes as literal JS unicode escape text (backslash+u2014) inside string literals, not real UTF-8 characters, so a plain grep for the real character class [–—] against the .js source finds nothing - only the generated HTML/JSON output shows the real glyph. Fixing dashes means editing the escape text in the generator, not the HTML, then re-running seo-head.js/seo-homepage.js and re-syncing data/pages/*.json + data/bundle.js (since api.js's document.title/meta overwrite means CMS records must match). Also hit a shell-escaping trap: passing a Python heredoc through the Bash tool with a double-backslash (\u2014) intending literal escape text sometimes got collapsed by an extra unescape layer into the real unicode character before Python ever saw it, so string.replace() silently no-op'd instead of erroring. Fix was to bypass shell quoting entirely - write the replacement logic to a .js file with the Write tool (verbatim content, no re-escaping) and run it with node, or use the Edit tool directly against Read's verbatim output.

## Outcome

- Signal: corrected

## Source Nodes

- scripts/seo-head.js
- scripts/seo-homepage.js
- api.js