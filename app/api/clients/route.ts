import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/db"
export async function GET() {
  try {
    // console.log("🔍 GET /api/clients - Obteniendo todos los clientes")
    const supabaseAdmin = await getSupabaseAdmin()
    const { data: clients, error } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("level", "client")
      .order("created_at", { ascending: false })
    if (error) {
      throw error
    }
    return NextResponse.json(clients || [])
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user_id, coach_id, level = "client" } = body
    if (!user_id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    const supabaseAdmin = await getSupabaseAdmin()
    const { data: newClient, error } = await supabaseAdmin
      .from("user_profiles")
      .insert({
        user_id,
        coach_id,
        level,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) {
      throw error
    }
    return NextResponse.json(newClient, { status: 201 })
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }
    const body = await request.json()
    body.updated_at = new Date().toISOString()
    const supabaseAdmin = await getSupabaseAdmin()
    const { data: updatedClient, error } = await supabaseAdmin
      .from("user_profiles")
      .update(body)
      .eq("id", id)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error("Error updating client:", error)
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }
    const supabaseAdmin = await getSupabaseAdmin()
    const { data: deletedClient, error } = await supabaseAdmin
      .from("user_profiles")
      .delete()
      .eq("id", id)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Client deleted successfully" })
  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 })
  }
}
