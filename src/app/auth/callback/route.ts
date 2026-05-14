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
          .select("id")
          .eq("id", data.user.id)
          .single();

        if (!existing) {
          const { error: insertErr } = await admin.from("profiles").insert({
            id: data.user.id,
            email: data.user.email,
            token_balance: 100000,
            credits_balance: 2, // 2 free credits on signup
            free_build_used: false,
          });
          if (insertErr) console.error("[Auth] Profile insert error:", insertErr.message);
          else console.log("[Auth] Profile created for new user:", data.user.email);
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
