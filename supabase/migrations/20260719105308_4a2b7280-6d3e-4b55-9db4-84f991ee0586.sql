-- Access request approval system
CREATE TABLE public.richieste_accesso (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'in_attesa' CHECK (status IN ('in_attesa','approvato','rifiutato')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.richieste_accesso TO authenticated;
GRANT ALL ON public.richieste_accesso TO service_role;

ALTER TABLE public.richieste_accesso ENABLE ROW LEVEL SECURITY;

-- Only the admin (specific email) can read/manage via authenticated client
CREATE POLICY "Admin reads all requests"
  ON public.richieste_accesso FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'alessandro.zuffoli@gmail.com');

CREATE POLICY "Admin updates requests"
  ON public.richieste_accesso FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'alessandro.zuffoli@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'alessandro.zuffoli@gmail.com');

CREATE POLICY "Admin deletes requests"
  ON public.richieste_accesso FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'alessandro.zuffoli@gmail.com');

-- No INSERT policy for authenticated: inserts happen server-side with service role
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_richieste_updated_at
BEFORE UPDATE ON public.richieste_accesso
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
