import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Ensure profile row exists with free credit — use service role to bypass RLS
      try {
        const admin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: existing } = await admin
          .from("profiles")
          .select("id, credits_balance, created_at")
          .eq("id", data.user.id)
          .single();

        if (!existing) {
          // Trigger didn't fire — create profile manually
          const { error: insertErr } = await admin.from("profiles").insert({
            id: data.user.id,
            email: data.user.email,
            token_balance: 100000,
            credits_balance: 10,
            free_build_used: false,
          });
          if (insertErr) console.error("[Auth] Profile insert error:", insertErr.message);
          else console.log("[Auth] Profile created for new user:", data.user.email);
        } else {
          // Profile already exists — likely created by the Postgres trigger
          // (which fires before this callback runs). If it was just created
          // and has 0 credits, grant the 10 free signup credits now.
          const ageMs = Date.now() - new Date(existing.created_at as string).getTime();
          const isNewSignup = Number(existing.credits_balance) === 0 && ageMs < 30_000;
          if (isNewSignup) {
            const { error: updateErr } = await admin
              .from("profiles")
              .update({ credits_balance: 10 })
              .eq("id", data.user.id);
            if (updateErr) console.error("[Auth] Credits grant error:", updateErr.message);
            else console.log("[Auth] Granted 10 signup credits to:", data.user.email);
          }
        }
      } catch (profileErr) {
        // Non-fatal — user can still proceed
        console.error("[Auth] Profile upsert failed:", profileErr);
      }

      return NextResponse.redirect(`${origin}/app`);
    }

    console.error("[Auth] exchangeCodeForSession error:", error);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_error`);
}
