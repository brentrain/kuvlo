-- Keep job ownership secure and make authenticated inserts reliable.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

UPDATE public.jobs AS job
   SET user_id = client.user_id
  FROM public.clients AS client
 WHERE job.client_id = client.id
   AND job.user_id IS NULL;

ALTER TABLE public.jobs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.jobs ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;

CREATE POLICY "Users can view their own jobs"
  ON public.jobs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs"
  ON public.jobs FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.clients
       WHERE public.clients.id = client_id
         AND public.clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own jobs"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs"
  ON public.jobs FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
