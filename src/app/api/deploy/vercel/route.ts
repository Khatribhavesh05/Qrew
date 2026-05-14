import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { githubUrl, projectName } = (await request.json()) as {
      githubUrl: string;
      projectName: string;
    };

    // Extract owner/repo from githubUrl
    // e.g. https://github.com/username/repo-name -> username/repo-name
    const repoPath = githubUrl.replace("https://github.com/", "");

    // Vercel's import URL — takes the user to their own Vercel account
    const vercelDeployUrl =
      `https://vercel.com/new/clone` +
      `?repository-url=${encodeURIComponent(githubUrl)}` +
      `&project-name=${encodeURIComponent(projectName)}` +
      `&repository-name=${encodeURIComponent(repoPath.split("/")[1])}`;

    return NextResponse.json({ vercelDeployUrl, success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate deploy URL" },
      { status: 500 }
    );
  }
}
