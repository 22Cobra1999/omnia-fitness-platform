"use server"

import { verifyToken as mockVerifyToken } from "./mock-bcrypt"

// Mock JWT verification function
export async function verifyToken(token: string): Promise<{ sub: string; email: string; exp: number } | null> {
  try {
    // Basic token format check
    if (typeof token !== "string" || token.length < 10) {
      console.warn("Invalid token format")
      return null
    }

    // Decode the token (this is insecure, but fine for a demo)
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"))

    // Validate the decoded token
    if (
      !decoded ||
      typeof decoded.sub !== "string" ||
      typeof decoded.email !== "string" ||
      typeof decoded.exp !== "number"
    ) {
      console.warn("Invalid token payload")
      return null
    }

    // Check if the token is expired
    if (decoded.exp * 1000 < Date.now()) {
      console.warn("Token expired")
      return null
    }

    return decoded
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10 // You can adjust the number of salt rounds
  return mockVerifyToken(password, saltRounds)
}
