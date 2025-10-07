// This is a mock implementation of bcrypt for the demo
// In a real application, you would use the actual bcrypt package

export async function hash(data: string, saltOrRounds: string | number): Promise<string> {
  // This is just a simple mock that adds a prefix to simulate hashing
  return `hashed_${data}_${saltOrRounds}`
}

export async function compare(data: string, encrypted: string): Promise<boolean> {
  // This mock just checks if the encrypted string contains the original data
  return encrypted.includes(data)
}

// Add any other bcrypt methods that might be used
export const genSalt = async (rounds: number): Promise<string> => {
  return `salt_${rounds}_${Date.now()}`
}

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
