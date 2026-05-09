import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Dashboard } from "@/components/qrew/dashboard";
import type { Startup } from "@/types";

export default async function AppPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: startupsData } = await supabase
    .from("startups")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const startups = (startupsData as Startup[] | null) ?? [];

  return (
    <Dashboard
      startups={startups}
      userEmail={user.email ?? ""}
    />
  );
}
