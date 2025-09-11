import { NextResponse } from "next/server";

/**
 * Simple health check endpoint for network connectivity testing
 * Returns a minimal response to check if the server is reachable
 */
export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: Date.now() });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
