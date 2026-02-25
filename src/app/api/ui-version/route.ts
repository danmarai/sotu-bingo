// This value changes on every build/deploy, triggering widget reload
const BUILD_VERSION = process.env.NEXT_PUBLIC_BUILD_ID || Date.now().toString();

export async function GET() {
  return Response.json({ version: BUILD_VERSION });
}
