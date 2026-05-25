import { NextRequest, NextResponse } from "next/server";

const RELEASE_BASE =
  "https://github.com/saadmusani97/IamIronman/releases/download/3d_assets";

const ALLOWED = new Set([
  "arc-reactor.glb",
  "suit-mark1.glb",
  "suit-mark6.glb",
  "suit-mark7.glb",
  "suit-mark50.glb",
  "suit-hulkbuster.glb",
  "suit-mark85.glb",
]);

export const maxDuration = 60;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;

  if (!ALLOWED.has(file)) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Fetch from GitHub releases — follows redirects automatically
  const upstream = await fetch(`${RELEASE_BASE}/${file}`, {
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Failed to fetch model", { status: 502 });
  }

  // Stream the response body directly — no buffering, no size limit
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "model/gltf-binary",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
      ...(upstream.headers.get("content-length")
        ? { "Content-Length": upstream.headers.get("content-length")! }
        : {}),
    },
  });
}
