---
description: Run a full security audit on the LigaFC codebase. Checks for Supabase RLS issues, credential leaks, XSS, JWT handling, and Tailwind class injection.
---

Run a comprehensive security audit on the LigaFC project using the SecOps-Guardian agent.

1. Use Glob to find all relevant files:
   - `src/**/*.jsx`, `src/**/*.tsx`, `src/**/*.js`, `src/**/*.ts` (React code)
   - `src/config/**` (Supabase config)
   - `api/**` (serverless functions)
   - `.env*` (environment files — check for leaked secrets)
   - `supabase/migrations/**` (RLS policies)

2. For each module, read the files and analyze:

**Module 1 - Supabase API (Black Box):**
- Check `supabaseClient.js` for exposed service_role_key
- Review migration files for RLS policies — are they restrictive enough?
- Check if anon key is properly used (not service_role)

**Module 2 - Static Code Analysis (React):**
- Search for `dangerouslySetInnerHTML` usage
- Search for `service_role` or `SERVICE_ROLE` in client-side code
- Check JWT/token handling in auth logic
- Look for hardcoded secrets or API keys

**Module 3 - Tailwind CSS Audit:**
- Search for dynamic className patterns: template literals with user input
- Look for className={\`...\${variable}...\`} patterns
- Check for string concatenation in className attributes

3. Output the findings in the structured JSON format with id, componente, severidad, vulnerabilidad, descripcion, evidencia, and solucion fields.

If the user specifies a module or file (e.g. `/security-audit supabase` or `/security-audit MatchForm`), only analyze that scope.
