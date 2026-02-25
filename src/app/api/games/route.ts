import { createGame } from "@/lib/state-engine";
import { errorResponse } from "@/lib/errors";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, phrases } = body as { title?: string; phrases?: string };

    if (!phrases) {
      return Response.json({ error: "phrases is required" }, { status: 400 });
    }

    const baseUrl = new URL(req.url).origin;
    const result = await createGame(title || "SOTU Bingo", phrases, baseUrl);

    return Response.json(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
