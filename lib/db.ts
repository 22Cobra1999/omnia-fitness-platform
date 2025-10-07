import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

// Verificar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Supabase environment variables not configured")
}

// Función para obtener el cliente de Supabase
export async function getSupabaseAdmin() {
  return createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseServiceKey || "placeholder-key"
  )
}

export async function query(statement: string, params: any[] = []) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Supabase not configured, skipping query")
      return null
    }

    console.log("Query:", statement, params)
    const supabaseAdmin = await getSupabaseAdmin()
    const { data, error } = await supabaseAdmin.from("users").select("count").limit(1)

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("Database query failed:", error)
    return null
  }
}

export async function insert(tableName: string, data: Record<string, any>) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Supabase not configured, skipping insert")
      return null
    }

    const supabaseAdmin = await getSupabaseAdmin()
    const { data: result, error } = await supabaseAdmin.from(tableName).insert([data]).select().single()

    if (error) throw error
    return result
  } catch (error) {
    console.error(`Database insert failed for table ${tableName}:`, error)
    return null
  }
}

export async function update(tableName: string, id: number, data: Record<string, any>) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Supabase not configured, skipping update")
      return null
    }

    const supabaseAdmin = await getSupabaseAdmin()
    const { data: result, error } = await supabaseAdmin.from(tableName).update(data).eq("id", id).select().single()

    if (error) throw error
    return result
  } catch (error) {
    console.error(`Database update failed for table ${tableName}:`, error)
    return null
  }
}

export async function remove(tableName: string, id: number) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Supabase not configured, skipping remove")
      return null
    }

    const supabaseAdmin = await getSupabaseAdmin()
    const { data: result, error } = await supabaseAdmin.from(tableName).delete().eq("id", id).select().single()

    if (error) throw error
    return result
  } catch (error) {
    console.error(`Database delete failed for table ${tableName}:`, error)
    return null
  }
}

export async function getAll(tableName: string) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Supabase not configured, skipping getAll")
      return []
    }

    const supabaseAdmin = await getSupabaseAdmin()
    const { data, error } = await supabaseAdmin.from(tableName).select("*")

    if (error) throw error
    return data || []
  } catch (error) {
    console.error(`Database getAll failed for table ${tableName}:`, error)
    return []
  }
}

export async function getById(tableName: string, id: number) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Supabase not configured, skipping getById")
      return null
    }

    const supabaseAdmin = await getSupabaseAdmin()
    const { data, error } = await supabaseAdmin.from(tableName).select("*").eq("id", id).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error(`Database getById failed for table ${tableName}:`, error)
    return null
  }
}

export async function initializeTables() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Supabase not configured, skipping initialization")
      return false
    }

    // Verificar conexión a la base de datos
    const supabaseAdmin = await getSupabaseAdmin()
    const { data, error } = await supabaseAdmin.from("users").select("count").limit(1)

    if (error) {
      console.error("Database connection failed:", error)
      return false
    }

    console.log("Database connection successful")
    return true
  } catch (error) {
    console.error("Database initialization failed:", error)
    return false
  }
}

export const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
  let query = ""
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase not configured, skipping sql query")
    return null
  }
  const params: any[] = []
  for (let i = 0; i < strings.length; i++) {
    query += strings[i]
    if (i < values.length) {
      query += `$${i + 1}`
      params.push(values[i])
    }
  }

  try {
    const supabaseAdmin = await getSupabaseAdmin()
    const { data, error } = await supabaseAdmin.from("users").select("count").limit(1)

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("SQL query failed:", error)
    return null
  }
}
