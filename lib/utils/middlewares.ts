import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "./auth"

// Middleware to check authentication for API routes
export async function withAuth(req: NextRequest, handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  // Get token from cookies
  const token = req.cookies.get("auth_token")?.value

  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  // Verify token
  const user = verifyToken(token)

  if (!user) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
  }

  // Call the handler with the authenticated user
  return handler(req, user)
}

// Middleware to check if user is a coach
export async function withCoachAuth(req: NextRequest, handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return withAuth(req, (req, user) => {
    if (user.level !== "coach") {
      return NextResponse.json({ error: "Coach access required" }, { status: 403 })
    }

    return handler(req, user)
  })
}
