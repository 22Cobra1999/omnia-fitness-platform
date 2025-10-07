import { hashPassword } from "@/lib/auth"
import { NextResponse } from "next/server"
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body
    // In a real app, you would check the database for the user
    // For now, we'll just hash the password and return a mock response
    const hashedPassword = await hashPassword(password)
    return NextResponse.json({
      success: true,
      user: {
        id: "123",
        email,
        name: "Demo User",
        type: "client",
      },
    })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }
}
