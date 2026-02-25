import { joinGame } from "@/lib/state-engine";
import { errorResponse } from "@/lib/errors";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const body = await req.json();
    const { name } = body as { name: string };

    if (!name || typeof name !== "string") {
      return Response.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const result = await joinGame(gameId, name);
    return Response.json(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
