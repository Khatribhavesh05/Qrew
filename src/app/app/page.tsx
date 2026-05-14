import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Dashboard } from "@/components/qrew/dashboard";
import type { Startup } from "@/types";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AppPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: startupsData }, { data: profileData }, params] = await Promise.all([
    supabase
      .from("startups")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("credits_balance")
      .eq("id", user.id)
      .single(),
    searchParams,
  ]);

  const startups = (startupsData as Startup[] | null) ?? [];
  const creditsBalance = (profileData as { credits_balance?: number } | null)?.credits_balance ?? 0;
  const paymentSuccess = params.payment === "success";
  const openBuy = params.buy === "true";

  return (
    <Dashboard
      startups={startups}
      userEmail={user.email ?? ""}
      creditsBalance={Number(creditsBalance)}
      paymentSuccess={paymentSuccess}
      openBuy={openBuy}
    />
  );
}
