-- Kuvlo free plan: up to five clients per user.
-- Existing clients are preserved. Pro accounts are not limited.

ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

ALTER TABLE public.company_profiles
  DROP CONSTRAINT IF EXISTS company_profiles_plan_check;

ALTER TABLE public.company_profiles
  ADD CONSTRAINT company_profiles_plan_check
  CHECK (plan IN ('free', 'pro'));

CREATE OR REPLACE FUNCTION public.enforce_client_plan_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_plan TEXT;
  client_count INTEGER;
BEGIN
  SELECT cp.plan
    INTO current_plan
    FROM public.company_profiles AS cp
   WHERE cp.user_id = NEW.user_id;

  IF COALESCE(current_plan, 'free') = 'free' THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 0));

    SELECT COUNT(*)
      INTO client_count
      FROM public.clients AS c
     WHERE c.user_id = NEW.user_id;

    IF client_count >= 5 THEN
      RAISE EXCEPTION 'FREE_PLAN_CLIENT_LIMIT'
        USING ERRCODE = 'P0001',
              HINT = 'Upgrade to a Pro plan to add more than five clients.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_client_plan_limit ON public.clients;

CREATE TRIGGER enforce_client_plan_limit
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_client_plan_limit();
