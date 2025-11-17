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
