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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;

  if (!ALLOWED.has(file)) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Redirect browser directly to the GitHub objects CDN
  // GitHub releases redirect to objects.githubusercontent.com which has CORS headers
  return NextResponse.redirect(
    `${RELEASE_BASE}/${file}`,
    { status: 302 }
  );
}
