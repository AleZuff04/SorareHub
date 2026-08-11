import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAIL = "zuffolia@gmail.com";
const ADMIN_EMAILS = new Set(["zuffolia@gmail.com", "alessandro.zuffoli@gmail.com"]);

// PUBLIC: create an access request (no auth required)
export const requestAccess = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({ email: z.string().email().max(200), redirectTo: z.string().url().optional() })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // If already a user, block
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (existing?.users?.some((u) => (u.email ?? "").toLowerCase() === email)) {
      return { ok: false, reason: "already_registered" as const };
    }

    // Admin emails: bypass approval — invite directly and mark approved
    if (ADMIN_EMAILS.has(email)) {
      const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: data.redirectTo,
      });
      if (inviteErr) throw new Error(inviteErr.message);

      const { data: existingReq } = await supabaseAdmin
        .from("richieste_accesso")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      const nowIso = new Date().toISOString();
      if (existingReq) {
        await supabaseAdmin
          .from("richieste_accesso")
          .update({ status: "approvato", approved_at: nowIso })
          .eq("id", existingReq.id);
      } else {
        await supabaseAdmin
          .from("richieste_accesso")
          .insert({ email, status: "approvato", approved_at: nowIso });
      }
      return { ok: true, reason: "admin_invited" as const };
    }

    // Upsert request (do not overwrite already approved/rifiutato)
    const { data: existingReq } = await supabaseAdmin
      .from("richieste_accesso")
      .select("id, status")
      .eq("email", email)
      .maybeSingle();

    if (existingReq) {
      if (existingReq.status === "approvato")
        return { ok: false, reason: "already_approved" as const };
      if (existingReq.status === "rifiutato") return { ok: false, reason: "rejected" as const };
      return { ok: true, reason: "pending_existing" as const };
    }

    const { error } = await supabaseAdmin
      .from("richieste_accesso")
      .insert({ email, status: "in_attesa" });
    if (error) throw new Error(error.message);

    return { ok: true, reason: "created" as const };
  });

// ADMIN: list pending
export const listAccessRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if ((context.claims.email as string | undefined)?.toLowerCase() !== ADMIN_EMAIL) {
      throw new Error("Forbidden");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("richieste_accesso")
      .select("id, email, status, created_at, approved_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ADMIN: approve → invite user (sends Supabase confirmation email)
export const approveAccessRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z.object({ id: z.string().uuid(), redirectTo: z.string().url().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if ((context.claims.email as string | undefined)?.toLowerCase() !== ADMIN_EMAIL) {
      throw new Error("Forbidden");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: req, error: e1 } = await supabaseAdmin
      .from("richieste_accesso")
      .select("id, email, status")
      .eq("id", data.id)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!req) throw new Error("Richiesta non trovata");
    if (req.status === "approvato") return { ok: true, already: true };

    const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(req.email, {
      redirectTo: data.redirectTo,
    });
    if (inviteErr) throw new Error(inviteErr.message);

    const { error: updErr } = await supabaseAdmin
      .from("richieste_accesso")
      .update({
        status: "approvato",
        approved_at: new Date().toISOString(),
        approved_by: context.userId,
      })
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);

    return { ok: true };
  });

// ADMIN: reject/delete request. If user account exists for that email, delete it too.
export const rejectAccessRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if ((context.claims.email as string | undefined)?.toLowerCase() !== ADMIN_EMAIL) {
      throw new Error("Forbidden");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: req, error: reqErr } = await supabaseAdmin
      .from("richieste_accesso")
      .select("id, email")
      .eq("id", data.id)
      .maybeSingle();
    if (reqErr) throw new Error(reqErr.message);

    if (req?.email) {
      const email = req.email.toLowerCase();
      let page = 1;
      const perPage = 200;
      let foundUserId: string | null = null;
      for (let i = 0; i < 20 && !foundUserId; i++) {
        const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage,
        });
        if (listErr) throw new Error(listErr.message);
        const match = list?.users?.find((u) => (u.email ?? "").toLowerCase() === email);
        if (match) {
          foundUserId = match.id;
          break;
        }
        if (!list?.users || list.users.length < perPage) break;
        page += 1;
      }
      if (foundUserId) {
        await supabaseAdmin.from("user_data").delete().eq("user_id", foundUserId);
        const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(foundUserId);
        if (delErr) throw new Error(delErr.message);
      }
    }

    const { error } = await supabaseAdmin.from("richieste_accesso").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ADMIN: send a password-reset email to a user
export const adminSendPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({ email: z.string().email().max(200), redirectTo: z.string().url().optional() })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if ((context.claims.email as string | undefined)?.toLowerCase() !== ADMIN_EMAIL) {
      throw new Error("Forbidden");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(
      data.email.trim().toLowerCase(),
      {
        redirectTo: data.redirectTo,
      },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
