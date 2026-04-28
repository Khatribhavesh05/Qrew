import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Workspace } from "@/components/qrew/workspace";
import type { Company, Employee } from "@/types";

const DEFAULT_EMPLOYEES: Array<{
  name: string;
  role: Employee["role"];
  status: Employee["status"];
}> = [
  { name: "Alex", role: "research", status: "idle" },
  { name: "Sam", role: "strategy", status: "idle" },
  { name: "Jordan", role: "launch", status: "idle" },
];

export default async function AppPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch company for this user
  const { data: companyData } = await supabase
    .from("companies")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const company = companyData as Company | null;

  if (!company) redirect("/onboarding");

  // Fetch existing employees
  const { data: employeeData } = await supabase
    .from("employees")
    .select("*")
    .eq("company_id", company.id);

  let employees = (employeeData as Employee[] | null) ?? [];

  // Upsert any missing roles
  const existingRoles = new Set(employees.map((e) => e.role));
  const missing = DEFAULT_EMPLOYEES.filter((e) => !existingRoles.has(e.role));

  if (missing.length > 0) {
    const { data: created } = await supabase
      .from("employees")
      .insert(missing.map((e) => ({ ...e, company_id: company.id })))
      .select("*");

    employees = [...employees, ...((created as Employee[] | null) ?? [])];
  }

  // Canonical order: research → strategy → launch
  const roleOrder: Employee["role"][] = ["research", "strategy", "launch"];
  employees.sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));

  return (
    <Workspace
      company={company}
      employees={employees}
      userId={user.id}
      userEmail={user.email ?? ""}
    />
  );
}
