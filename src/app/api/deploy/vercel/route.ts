import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface DeployRequestBody {
  repoUrl: string;
  repoName: string;
  projectName: string;
}

interface VercelProjectResponse {
  id: string;
  name: string;
  error?: { message: string };
  [key: string]: unknown;
}

interface VercelDeploymentResponse {
  url: string;
  id: string;
  error?: { message: string };
  [key: string]: unknown;
}

interface ProfileRow {
  github_username: string | null;
  github_access_token: string | null;
}

interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    console.log("[deploy] VERCEL_TOKEN present:", !!VERCEL_TOKEN);
    if (!VERCEL_TOKEN) {
      return NextResponse.json({ error: "Vercel token not configured" }, { status: 500 });
    }

    const body = (await request.json()) as DeployRequestBody;
    const { repoName, projectName } = body;
    console.log("[deploy] body:", { repoName, projectName, repoUrl: body.repoUrl });

    // Get GitHub username and token for repo linking
    const { data: profileData } = await supabase
      .from("profiles")
      .select("github_username, github_access_token")
      .eq("id", user.id)
      .maybeSingle();

    const profile = profileData as ProfileRow | null;
    const githubUsername = profile?.github_username;
    const githubToken = profile?.github_access_token;
    console.log("[deploy] githubUsername:", githubUsername, "hasGithubToken:", !!githubToken);

    const safeName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);

    const vercelHeaders = {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    };

    // Create Vercel project linked to the GitHub repo
    const projectBody: Record<string, unknown> = {
      name: safeName,
      framework: "nextjs",
    };

    if (githubUsername) {
      projectBody.gitRepository = {
        type: "github",
        repo: `${githubUsername}/${repoName}`,
      };
    }

    // Try to find an existing project first
    let project: VercelProjectResponse | null = null;

    console.log("[deploy] checking for existing Vercel project:", safeName);
    const getRes = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(safeName)}`, {
      method: "GET",
      headers: vercelHeaders,
    });

    if (getRes.ok) {
      const existing = JSON.parse(await getRes.text()) as VercelProjectResponse;
      if (existing.id) {
        console.log("[deploy] found existing project id:", existing.id);
        project = existing;
      }
    }

    if (!project) {
      console.log("[deploy] creating Vercel project:", JSON.stringify(projectBody));
      const projectRes = await fetch("https://api.vercel.com/v9/projects", {
        method: "POST",
        headers: vercelHeaders,
        body: JSON.stringify(projectBody),
      });

      const projectRaw = await projectRes.text();
      console.log("[deploy] Vercel project status:", projectRes.status, "| body:", projectRaw.slice(0, 600));

      const created = JSON.parse(projectRaw) as VercelProjectResponse;
      if (!created.id) {
        return NextResponse.json(
          { error: created.error?.message ?? `Failed to create Vercel project (${projectRes.status})` },
          { status: 500 }
        );
      }
      project = created;
    }

    // Fetch the numeric GitHub repo ID — required by Vercel's gitSource API
    let githubRepoId: number | null = null;
    if (githubUsername && githubToken) {
      try {
        const ghRes = await fetch(
          `https://api.github.com/repos/${githubUsername}/${repoName}`,
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github+json",
            },
          }
        );
        const ghData = (await ghRes.json()) as GitHubRepoResponse;
        githubRepoId = ghData.id ?? null;
        console.log("[deploy] GitHub repo numeric ID:", githubRepoId);
      } catch (err) {
        console.error("[deploy] failed to fetch GitHub repo ID:", err);
      }
    }

    // Trigger deployment
    const deployBody: Record<string, unknown> = {
      name: project.name,
    };

    if (githubUsername && githubRepoId) {
      deployBody.gitSource = {
        type: "github",
        repoId: githubRepoId,
        ref: "main",
      };
    }

    console.log("[deploy] triggering deployment:", JSON.stringify(deployBody).slice(0, 400));
    const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: vercelHeaders,
      body: JSON.stringify(deployBody),
    });

    const deployRaw = await deployRes.text();
    console.log("[deploy] Vercel deployment status:", deployRes.status, "| body:", deployRaw.slice(0, 600));

    const deployment = JSON.parse(deployRaw) as VercelDeploymentResponse;

    if (!deployment.url) {
      return NextResponse.json(
        { error: deployment.error?.message ?? `Deployment failed (HTTP ${deployRes.status})` },
        { status: 500 }
      );
    }

    return NextResponse.json({ deploymentUrl: `https://${deployment.url}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Deployment failed";
    console.error("[deploy] unexpected error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
