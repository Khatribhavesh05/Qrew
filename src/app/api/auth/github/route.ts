import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID ?? "",
    scope: "repo user:email",
    redirect_uri: `${process.env.NEXTAUTH_URL ?? ""}/api/auth/github/callback`,
    state: user.id,
  });

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
}
