import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { zipSync, strToU8 } from "fflate";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ startupId: string }> }
) {
  const { startupId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("code_maps")
    .select("file_map")
    .eq("startup_id", startupId)
    .single();

  if (!data?.file_map) {
    return NextResponse.json({ error: "No generated code found" }, { status: 404 });
  }

  const fileMap = data.file_map as Record<string, string>;
  const zipFiles: Record<string, Uint8Array> = {};
  for (const [path, content] of Object.entries(fileMap)) {
    zipFiles[path] = strToU8(content);
  }

  const zipped = zipSync(zipFiles);

  return new Response(zipped.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="qrew-${startupId}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
