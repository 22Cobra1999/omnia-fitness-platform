import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
export async function POST(request: Request) {
  try {
    // Drop the existing clients table if it exists
    await sql`DROP TABLE IF EXISTS clients`
    // Create the clients table with the correct schema
    await sql`
      CREATE TABLE clients (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        coach_id INTEGER,
        "Height" INTEGER,
        weight INTEGER,
        birth_date DATE,
        fitness_goals JSONB DEFAULT '[]',
        health_conditions JSONB DEFAULT '[]',
        activity_level VARCHAR(50),
        "Genre" VARCHAR(20),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    // Add indexes for better performance
    await sql`CREATE INDEX idx_clients_user_id ON clients(user_id)`
    await sql`CREATE INDEX idx_clients_coach_id ON clients(coach_id)`
    return NextResponse.json({ success: true, message: "Clients table recreated successfully" })
  } catch (error) {
    console.error("Error recreating clients table:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to recreate clients table",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
