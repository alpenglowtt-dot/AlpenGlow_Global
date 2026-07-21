---
type: "explain"
date: "2026-07-21T08:33:37.307106+00:00"
question: "Why does the graph barely represent compass.html even though it has hundreds of lines of real logic?"
contributor: "graphify"
outcome: "corrected"
correction: "For any HTML file with inline script logic in this project, skip graphify entirely and read the file directly, since the extractor does not parse inline scripts inside HTML."
source_nodes: ["compass.js"]
---

# Q: Why does the graph barely represent compass.html even though it has hundreds of lines of real logic?

## Answer

compass.html embeds its entire application logic in an inline script tag rather than a separate .js file. The AST extractor only picked up compass.js, a near empty one line stub file with just a comment, and never parsed the inline script inside compass.html at all. This means the graph is structurally blind to a large, functionally important part of this codebase, including the verification gate check, the lead saving logic, and the daily question limit tracking. Any future session should know that questions about COMPASS chatbot behavior will get zero useful results from graphify and must go straight to reading compass.html directly.

## Outcome

- Signal: corrected
- Correction: For any HTML file with inline script logic in this project, skip graphify entirely and read the file directly, since the extractor does not parse inline scripts inside HTML.

## Source Nodes

- compass.js