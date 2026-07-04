# Kuvlo

Kuvlo is a flat-rate business management app for scheduling, billing, and client communication.

## Features
- Landing page for the Kuvlo value proposition
- Auth flow using Supabase
- Ready-to-apply Supabase schema for jobs, clients, and invoices

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template and add your Supabase values:
   ```bash
   cp .env.example .env
   ```
3. In the Supabase dashboard, unpause the project and copy the project URL and anon key into the env file.
4. Apply the SQL in [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL editor.
5. Start the app:
   ```bash
   npm run dev
   ```

## Supabase notes
The app is wired to use the Supabase project ID `bovlfgxwlxrlwjlhlkvj`. The project must be unpaused in the Supabase dashboard before authentication and database operations will work.
