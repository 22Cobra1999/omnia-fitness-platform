import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json()
    // Validate inputs
    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    // In a real application, you would verify the code against one stored in your database
    // For this demo, we'll simulate code verification
    // Simulate checking the code
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return NextResponse.json({ error: "Invalid recovery code" }, { status: 400 })
    }
    // Check if the user exists
    const result = await sql`SELECT * FROM users WHERE email = ${email}`
    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword)
    // Update the user's password
    await sql`UPDATE users SET password = ${hashedPassword} WHERE email = ${email}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json({ error: "An error occurred while resetting your password" }, { status: 500 })
  }
}
