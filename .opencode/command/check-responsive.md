---
description: Run a responsive design audit on the codebase. Checks JSX components for mobile layout issues, touch targets, overflow, and missing responsive variants.
---

Run a full responsive design audit on the LigaFC project.

1. Use Glob to find all `src/**/*.jsx` files in the project
2. Read each file
3. Analyze every element for responsive design issues using these checks:
   - Hardcoded widths without responsive variants
   - Grid layouts without responsive variants (grid-cols-2+ without sm:/md:)
   - Flex layouts missing direction changes (flex-col without sm:flex-row)
   - Touch targets below 44px (buttons with py-1, p-2 on icon-only is OK)
   - Large text without responsive sizing
   - Overflow risk (flex containers without min-w-0, tables without overflow-x-auto)
   - Excessive mobile spacing (p-6/p-8 without sm: prefix)
   - Missing z-index on modals/dropdowns
   - Images without max-w-full/object-contain
4. Output a structured report with Issues, Warnings, and Passed checks per file
5. End with a summary: files analyzed, total issues, total warnings, most common problem

If the user specifies a component name (e.g. `/check-responsive MatchForm`), only analyze that file.
