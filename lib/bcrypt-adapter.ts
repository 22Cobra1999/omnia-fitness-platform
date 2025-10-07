import bcryptjs from "bcryptjs"

// This adapter provides the same API as bcrypt but uses bcryptjs
export const bcrypt = {
  hash: async (data: string, saltOrRounds: string | number): Promise<string> => {
    if (typeof saltOrRounds === "string") {
      return bcryptjs.hashSync(data, saltOrRounds)
    } else {
      const salt = bcryptjs.genSaltSync(saltOrRounds)
      return bcryptjs.hashSync(data, salt)
    }
  },

  compare: async (data: string, encrypted: string): Promise<boolean> => {
    return bcryptjs.compareSync(data, encrypted)
  },

  genSalt: async (rounds: number): Promise<string> => {
    return bcryptjs.genSaltSync(rounds)
  },
}

export default bcrypt
