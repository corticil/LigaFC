---
description: Runs a full database audit on all SQL migrations and schema changes.
agent: db-guardian
---

Review all SQL migrations in `supabase/migrations/` and the current database schema. 

Run a comprehensive audit checking:
1. Schema design (types, constraints, defaults)
2. Referential integrity (FKs, ON DELETE actions)
3. Indexes (missing, redundant, composite)
4. RLS policies (security)
5. Performance (data types, JSONB usage)
6. Migration safety (idempotent, ordering)
7. Naming conventions (consistency)

Output the structured JSON report with passed/warnings/critical/suggestions.
