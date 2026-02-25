import { pollGame } from "@/lib/state-engine";
import { errorResponse } from "@/lib/errors";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const auth = req.headers.get("authorization");
    const sinceVersion = parseInt(
      req.nextUrl.searchParams.get("sinceVersion") || "0",
      10
    );

    const result = await pollGame(gameId, sinceVersion, auth);
    return Response.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
