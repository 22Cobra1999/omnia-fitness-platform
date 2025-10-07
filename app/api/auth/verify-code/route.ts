import { type NextRequest, NextResponse } from "next/server"
// This would be stored in a database in a real application
const validCodes = new Map<string, string>()
export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()
    // Validate inputs
    if (!email || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    // In a real app, you would verify the code against one stored in your database
    // For this demo, we'll accept any 6-digit code for simplicity
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return NextResponse.json({ error: "Invalid recovery code" }, { status: 400 })
    }
    // Store the code as valid (in a real app, this would be done when generating the code)
    validCodes.set(email, code)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Code verification error:", error)
    return NextResponse.json({ error: "An error occurred while verifying your code" }, { status: 500 })
  }
}
