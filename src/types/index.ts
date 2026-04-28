export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  user_id: string;
  created_at: string;
}

export interface Employee {
  id: string;
  company_id: string;
  name: string;
  role: "research" | "strategy" | "launch";
  status: "idle" | "thinking" | "done";
  created_at: string;
}

export interface Message {
  id: string;
  employee_id: string;
  company_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
