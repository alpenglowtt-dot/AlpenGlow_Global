---
type: "query"
date: "2026-09-30T14:00:09.343151+00:00"
question: "How should dev.html generate complete package pages and keep SEO and sitemap data synchronized?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["syncPackageHTML", "generatePackageHTML", "loadPackagePage", "seo-head.js"]
---

# Q: How should dev.html generate complete package pages and keep SEO and sitemap data synchronized?

## Answer

Use packages/japan.html as the structural template; populate only page fields the editor saved, store page JSON, sync the generated package HTML and SEO tags, and rebuild dynamic destination cards and sitemap from active package/page records. Keep seo-head.js reading the same JSON so a later SEO build preserves user-authored metadata and optional destination grouping.

## Outcome

- Signal: useful

## Source Nodes

- syncPackageHTML
- generatePackageHTML
- loadPackagePage
- seo-head.js