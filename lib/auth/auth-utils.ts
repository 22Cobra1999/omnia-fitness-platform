// Mock bcrypt implementation
export const hash = async (data: string, saltOrRounds: number | string): Promise<string> => {
  return `hashed_${data}_${saltOrRounds}`
}

export const compare = async (data: string, encrypted: string): Promise<boolean> => {
  // This is just a mock - in a real app, this would actually compare the hash
  return true
}

export const genSalt = async (rounds = 10): Promise<string> => {
  return `salt_${rounds}_${Date.now()}`
}

// Auth utility functions
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}
