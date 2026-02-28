# Supabase Setup (Planned Production Persistence)

This repo currently persists to browser localStorage.

To move to multi-user persistence:

1. Create a Supabase project.
2. Run `supabase/schema.sql` in SQL editor.
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Replace localStorage save/load paths in `src/App.tsx` with Supabase CRUD.

## Suggested Rollout

1. Keep localStorage as fallback while implementing Supabase reads.
2. Add write operations entity-by-entity (apps -> customers -> tasks -> campaigns -> interactions).
3. Introduce auth + row-level security policies before production data.
4. Add optimistic UI updates and retry queue for failed writes.
