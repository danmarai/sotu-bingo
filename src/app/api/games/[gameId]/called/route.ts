import { toggleCalled } from "@/lib/state-engine";
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
    const { canonical, called } = body as {
      canonical: string;
      called: boolean;
    };

    if (typeof canonical !== "string" || typeof called !== "boolean") {
      return Response.json(
        { error: "canonical (string) and called (boolean) are required" },
        { status: 400 }
      );
    }

    const result = await toggleCalled(gameId, auth, canonical, called);
    return Response.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
