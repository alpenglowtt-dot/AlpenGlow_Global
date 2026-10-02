---
type: "query"
date: "2026-10-02T10:04:51.028209+00:00"
question: "Why were package Destinations Page Group edits not reliably reflected in the destination list?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["seo-head.js", "syncDynamicDestinationCards", "packageSEOBlock"]
---

# Q: Why were package Destinations Page Group edits not reliably reflected in the destination list?

## Answer

The CMS editor wrote seo_group to packages.json, but the SEO generator kept known package slugs in hardcoded groups and skipped their saved overrides. The editor sync also deleted a built-in card during a move, so clearing the override could not restore its default group. The fix makes the generator honor overrides and none, moves built-in cards between groups with a default-group fallback, recreates missing assigned cards, and hides cards while either package or page is inactive. Preview links now share the existing ag2025 gate token and inactive SEO redirects are query-aware.

## Outcome

- Signal: useful

## Source Nodes

- seo-head.js
- syncDynamicDestinationCards
- packageSEOBlock