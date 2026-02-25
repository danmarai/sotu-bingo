import { sendMessage, getMessages } from "@/lib/state-engine";
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
    const { text } = body as { text: string };

    if (!text || typeof text !== "string") {
      return Response.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    const result = await sendMessage(gameId, auth, text);
    return Response.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const sinceTs = parseInt(
      req.nextUrl.searchParams.get("since") || "0",
      10
    );

    const result = await getMessages(gameId, sinceTs);
    return Response.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
