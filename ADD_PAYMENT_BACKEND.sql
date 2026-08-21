-- Kuvlo subscription billing and connected invoice payments.

ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS lemonsqueezy_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS subscription_renews_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS lemonsqueezy_link TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS company_profiles_lemonsqueezy_subscription_id_key
  ON public.company_profiles (lemonsqueezy_subscription_id)
  WHERE lemonsqueezy_subscription_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS company_profiles_stripe_account_id_key
  ON public.company_profiles (stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS payment_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

UPDATE public.invoices
   SET payment_token = gen_random_uuid()
 WHERE payment_token IS NULL;

ALTER TABLE public.invoices
  ALTER COLUMN payment_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS invoices_payment_token_key
  ON public.invoices (payment_token);

CREATE TABLE IF NOT EXISTS public.webhook_events (
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  PRIMARY KEY (provider, event_id)
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.webhook_events FROM anon, authenticated;
