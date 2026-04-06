import { NextResponse } from "next/server";
import { validateCredentials, getAuthCookieName, getAuthToken } from "@/lib/auth";

// POST /api/auth — login
export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!validateCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(getAuthCookieName(), getAuthToken(), {
    httpOnly: true,
    secure: false, // localhost
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}

// DELETE /api/auth — logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(getAuthCookieName());
  return response;
}
