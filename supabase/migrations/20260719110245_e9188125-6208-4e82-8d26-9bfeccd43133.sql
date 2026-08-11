
DROP POLICY IF EXISTS "Admin can view all access requests" ON public.richieste_accesso;
DROP POLICY IF EXISTS "Admin can update access requests" ON public.richieste_accesso;
DROP POLICY IF EXISTS "Admin can delete access requests" ON public.richieste_accesso;

CREATE POLICY "Admin can view all access requests"
  ON public.richieste_accesso FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'zuffolia@gmail.com');

CREATE POLICY "Admin can update access requests"
  ON public.richieste_accesso FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'zuffolia@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'zuffolia@gmail.com');

CREATE POLICY "Admin can delete access requests"
  ON public.richieste_accesso FOR DELETE
  USING ((auth.jwt() ->> 'email') = 'zuffolia@gmail.com');
