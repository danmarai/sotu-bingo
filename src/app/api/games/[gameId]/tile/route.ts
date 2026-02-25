import { toggleTile } from "@/lib/state-engine";
import { errorResponse } from "@/lib/errors";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const auth = req.headers.get("authorization");
    const body = await req.json();
    const { pos, checked } = body as { pos: number; checked: boolean };

    if (typeof pos !== "number" || typeof checked !== "boolean") {
      return Response.json(
        { error: "pos (number) and checked (boolean) are required" },
        { status: 400 }
      );
    }

    const result = await toggleTile(gameId, auth, pos, checked);
    return Response.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
