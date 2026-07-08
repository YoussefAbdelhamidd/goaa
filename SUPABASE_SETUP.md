# Supabase Setup

1. Create a new Supabase project from the Supabase dashboard.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local`.
4. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Project Settings > API.
5. Restart the Vite dev server.

The app will seed the default admin, cashiers, and menu items into Supabase the first time it connects to empty tables.

Default admin:

- Username: `Omar`
- Password: `01277554354`

Security note: this keeps the current app's username/password pattern so the POS can work immediately. For production, move login to Supabase Auth or an Edge Function so passwords are not readable from browser-accessible tables.
