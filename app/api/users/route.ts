import { NextResponse } from "next/server"
import { query, insert, getAll, getById, update, remove } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (id) {
      const user = await getById("users", Number.parseInt(id))
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      // Remove password from response
      delete user.password_hash
      return NextResponse.json(user)
    }
    const users = await getAll("users")
    // Remove passwords from response
    users.forEach((user) => delete user.password_hash)
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, age, weight, height, gender, level = "client" } = body
    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }
    // Check if user already exists
    const existingUsers = await query("SELECT * FROM users WHERE email = $1", [email])
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }
    // Hash password
    const hashedPassword = await hashPassword(password)
    // Create user
    const newUser = await insert("users", {
      email,
      password_hash: hashedPassword,
      name,
      age,
      weight,
      height,
      gender,
      level,
      created_at: new Date(),
      updated_at: new Date(),
    })
    // Remove password from response
    delete newUser.password_hash
    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    const body = await request.json()
    const { password, ...updateData } = body
    // If password is being updated, hash it
    if (password) {
      updateData.password_hash = await hashPassword(password)
    }
    updateData.updated_at = new Date()
    const updatedUser = await update("users", Number.parseInt(id), updateData)
    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    // Remove password from response
    delete updatedUser.password_hash
    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    const deletedUser = await remove("users", Number.parseInt(id))
    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
