import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const emailSchema = z.string().email().max(200);

/**
 * PUBLIC: given any email (primary or backup), resolve the primary account email.
 * Falls back to the input when no backup match exists.
 */
export const resolvePrimaryEmail = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ email: emailSchema }).parse(input))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows } = await supabaseAdmin
      .from("profiles")
      .select("email, backup_email_1, backup_email_2")
      .or(`backup_email_1.eq.${email},backup_email_2.eq.${email}`)
      .limit(1);

    const match = rows?.[0];
    if (match?.email) {
      return { email: match.email.toLowerCase(), viaBackup: true as const };
    }
    return { email, viaBackup: false as const };
  });

/** AUTH: read own profile */
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, email, backup_email_1, backup_email_2")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data;

    const email = (context.claims.email as string | undefined) ?? null;
    const { data: created, error: insErr } = await context.supabase
      .from("profiles")
      .insert({ id: context.userId, email })
      .select("id, email, backup_email_1, backup_email_2")
      .single();
    if (insErr) throw new Error(insErr.message);
    return created;
  });

/** AUTH: update own backup emails */
export const updateBackupEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        backup_email_1: z.union([emailSchema, z.literal("")]).nullable().optional(),
        backup_email_2: z.union([emailSchema, z.literal("")]).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const norm = (v: string | null | undefined) => {
      const t = (v ?? "").trim().toLowerCase();
      return t === "" ? null : t;
    };
    const b1 = norm(data.backup_email_1);
    const b2 = norm(data.backup_email_2);
    const primary = (context.claims.email as string | undefined)?.toLowerCase() ?? null;

    if (b1 && b2 && b1 === b2) throw new Error("Le due email di backup devono essere diverse.");
    if (primary && (b1 === primary || b2 === primary))
      throw new Error("L'email di backup non può coincidere con l'email principale.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const candidate of [b1, b2].filter(Boolean) as string[]) {
      const { data: clash } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .or(`email.eq.${candidate},backup_email_1.eq.${candidate},backup_email_2.eq.${candidate}`)
        .neq("id", context.userId)
        .limit(1);
      if (clash && clash.length > 0) {
        throw new Error(`L'email ${candidate} è già associata a un altro account.`);
      }
    }

    const { error } = await context.supabase
      .from("profiles")
      .upsert(
        { id: context.userId, email: primary, backup_email_1: b1, backup_email_2: b2 },
        { onConflict: "id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true, backup_email_1: b1, backup_email_2: b2 };
  });
