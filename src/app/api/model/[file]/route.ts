import { NextRequest, NextResponse } from "next/server";

const RELEASE_BASE =
  "https://github.com/saadmusani97/IamIronman/releases/download/3d_assets";

// Allowed files whitelist
const ALLOWED = new Set([
  "arc-reactor.glb",
  "suit-mark1.glb",
  "suit-mark6.glb",
  "suit-mark7.glb",
  "suit-mark50.glb",
  "suit-hulkbuster.glb",
  "suit-mark85.glb",
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;

  if (!ALLOWED.has(file)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const upstream = await fetch(`${RELEASE_BASE}/${file}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (!upstream.ok) {
    return new NextResponse("Failed to fetch model", { status: upstream.status });
  }

  const buffer = await upstream.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "model/gltf-binary",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
