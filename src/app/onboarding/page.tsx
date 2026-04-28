import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { OnboardingWizard } from "@/components/qrew/onboarding-wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Already onboarded — skip the wizard
  const { data: existingCompany } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingCompany) redirect("/app");

  return <OnboardingWizard userId={user.id} />;
}
