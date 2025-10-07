import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase"
import { TABLES } from "@/lib/supabase-config"
// Añadir esta constante al inicio del archivo, después de las importaciones
// Caché en memoria para perfiles (TTL de 5 minutos)
const profileCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos
// Función para calcular la edad a partir de la fecha de nacimiento
function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  // Validar que la fecha sea válida
  if (isNaN(birth.getTime())) return null
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  // Ajustar la edad si aún no ha cumplido años en este año
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}
// Modificar la función GET para implementar caché en el servidor
export async function GET(request: Request) {
  try {
    // Crear un cliente Supabase específico para este manejador de ruta
    const supabase = createRouteHandlerClient()
    // Obtener el usuario actual con manejo de errores mejorado
    let user
    try {
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        console.error("Error de autenticación:", error)
        // Return a guest profile instead of an error
        return NextResponse.json({
          id: "guest",
          full_name: "Guest User",
          email: "guest@example.com",
          height: 170,
          weight: 70,
          birth_date: null,
          fitness_goals: [],
          health_conditions: [],
          activity_level: "Beginner",
          Genre: "male",
          description: "Guest profile",
          age: null,
        })
      }
      user = data.user
    } catch (authError) {
      console.error("Error de autenticación:", authError)
      // Return a guest profile instead of an error
      return NextResponse.json({
        id: "guest",
        full_name: "Guest User",
        email: "guest@example.com",
        height: 170,
        weight: 70,
        birth_date: null,
        fitness_goals: [],
        health_conditions: [],
        activity_level: "Beginner",
        Genre: "male",
        description: "Guest profile",
        age: null,
      })
    }
    if (!user) {
      // Return a guest profile instead of an error
      return NextResponse.json({
        id: "guest",
        full_name: "Guest User",
        email: "guest@example.com",
        height: 170,
        weight: 70,
        birth_date: null,
        fitness_goals: [],
        health_conditions: [],
        activity_level: "Beginner",
        Genre: "male",
        description: "Guest profile",
        age: null,
      })
    }
    // Verificar caché
    const now = Date.now()
    const cachedProfile = profileCache.get(user.id)
    if (cachedProfile && now - cachedProfile.timestamp < CACHE_TTL) {
      console.log("Returning cached profile for user:", user.id)
      return NextResponse.json(cachedProfile.data)
    }
    console.log("Usuario autenticado:", user.id)
    // Obtener el perfil del usuario desde la tabla clients
    const { data: clientProfile, error: clientError } = await supabase
      .from(TABLES.CLIENTS)
      .select("*")
      .eq("id", user.id)
      .single()
    if (clientError) {
      console.error("Error al obtener perfil de cliente:", clientError)
      // Si no existe el perfil, crear uno básico
      const basicProfile = {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || "Usuario",
        email: user.email,
        Height: 170,
        weight: 70,
        Genre: "male",
        description: "Soy @ y me gusta...",
        birth_date: null,
        fitness_goals: [],
        health_conditions: [],
        activity_level: "Beginner",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      // Intentar crear un perfil básico
      try {
        const { data: newProfile, error: insertError } = await supabase
          .from(TABLES.CLIENTS)
          .insert(basicProfile)
          .select()
          .single()
        if (insertError) {
          console.error("Error al crear perfil básico:", insertError)
          // Devolver el perfil básico aunque no se haya podido guardar
          const responseData = {
            ...basicProfile,
            height: basicProfile.Height, // Normalizar para el cliente
            age: null, // No hay fecha de nacimiento, así que no hay edad
          }
          // Guardar en caché
          profileCache.set(user.id, { data: responseData, timestamp: now })
          return NextResponse.json(responseData)
        }
        // Calcular la edad a partir de la fecha de nacimiento
        const age = calculateAge(newProfile.birth_date)
        // Devolver el nuevo perfil con la edad calculada
        const responseData = {
          ...newProfile,
          height: newProfile.Height, // Normalizar para el cliente
          age,
        }
        // Guardar en caché
        profileCache.set(user.id, { data: responseData, timestamp: now })
        return NextResponse.json(responseData)
      } catch (createError) {
        console.error("Error al crear perfil básico:", createError)
        // Devolver el perfil básico aunque no se haya podido guardar
        const responseData = {
          ...basicProfile,
          height: basicProfile.Height, // Normalizar para el cliente
          age: null, // No hay fecha de nacimiento, así que no hay edad
        }
        // Guardar en caché
        profileCache.set(user.id, { data: responseData, timestamp: now })
        return NextResponse.json(responseData)
      }
    }
    // Calcular la edad a partir de la fecha de nacimiento
    const age = calculateAge(clientProfile.birth_date)
    // Devolver el perfil con la edad calculada y normalizar height
    const responseData = {
      ...clientProfile,
      height: clientProfile.Height, // Normalizar para el cliente
      age,
    }
    // Guardar en caché
    profileCache.set(user.id, { data: responseData, timestamp: now })
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error del servidor:", error)
    return NextResponse.json({
      id: "guest",
      full_name: "Guest User",
      email: "guest@example.com",
      height: 170,
      weight: 70,
      birth_date: null,
      fitness_goals: [],
      health_conditions: [],
      activity_level: "Beginner",
      Genre: "male",
      description: "Guest profile",
      age: null,
    })
  }
}
// Modificar la función PUT para actualizar la caché después de modificar el perfil
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient()
    let data
    try {
      data = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }
    // Obtener el usuario actual con manejo de errores mejorado
    let user
    try {
      const { data: userData, error } = await supabase.auth.getUser()
      if (error) {
        console.error("Error de autenticación:", error)
        return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
      }
      user = userData.user
    } catch (authError) {
      console.error("Error de autenticación:", authError)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }
    // Preparar los datos para actualizar - Corregir height a Height
    const updateData = {
      ...data,
      Height: data.height, // Usar Height en lugar de height para la base de datos
      updated_at: new Date().toISOString(),
    }
    // Eliminar height para evitar conflictos
    if (updateData.height) {
      delete updateData.height
    }
    console.log("Datos a actualizar:", updateData)
    // Actualizar el perfil en la tabla clients
    try {
      const { data: updatedProfile, error: updateError } = await supabase
        .from(TABLES.CLIENTS)
        .update(updateData)
        .eq("id", user.id)
        .select()
        .single()
      if (updateError) {
        console.error("Error al actualizar perfil:", updateError)
        // Si el perfil no existe, crearlo
        if (updateError.code === "PGRST116") {
          const newProfileData = {
            id: user.id,
            ...data,
            Height: data.height, // Usar Height en lugar de height
            full_name: data.full_name || user.user_metadata?.full_name || user.user_metadata?.name || "Usuario",
            email: user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          // Eliminar height para evitar conflictos
          if (newProfileData.height) {
            delete newProfileData.height
          }
          const { data: newProfile, error: insertError } = await supabase
            .from(TABLES.CLIENTS)
            .insert(newProfileData)
            .select()
            .single()
          if (insertError) {
            console.error("Error al crear perfil:", insertError)
            return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
          }
          // Calcular la edad a partir de la fecha de nacimiento
          const age = calculateAge(newProfile.birth_date)
          // Devolver el nuevo perfil con la edad calculada
          return NextResponse.json({
            ...newProfile,
            height: newProfile.Height, // Normalizar para el cliente
            age,
          })
        }
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
      }
      // Calcular la edad a partir de la fecha de nacimiento
      const age = calculateAge(updatedProfile.birth_date)
      // Devolver el perfil actualizado con la edad calculada
      const responseData = {
        ...updatedProfile,
        height: updatedProfile.Height, // Normalizar para el cliente
        age,
      }
      // Actualizar caché
      profileCache.set(user.id, { data: responseData, timestamp: Date.now() })
      return NextResponse.json(responseData)
    } catch (dbError) {
      console.error("Error de base de datos:", dbError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error del servidor:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
