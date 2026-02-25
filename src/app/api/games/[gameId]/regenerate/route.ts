import { regenerateBoard } from "@/lib/state-engine";
import { errorResponse } from "@/lib/errors";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const auth = req.headers.get("authorization");
    const result = await regenerateBoard(gameId, auth);
    return Response.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
