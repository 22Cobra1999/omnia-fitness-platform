"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from '@/lib/supabase-browser'
import { useToast } from "@/components/ui/use-toast"

export function RunCoachMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const runMigration = async () => {
    setIsRunning(true)
    try {
      // SQL para crear la tabla coach_profiles
      const sql = `
        -- Create coach profiles table
        CREATE TABLE IF NOT EXISTS coach_profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT,
          email TEXT,
          bio TEXT,
          age INTEGER,
          gender TEXT,
          profile_image TEXT,
          specialties JSONB DEFAULT '[]'::JSONB,
          certifications JSONB DEFAULT '[]'::JSONB,
          experience_years INTEGER DEFAULT 0,
          hourly_rate NUMERIC DEFAULT 0,
          total_clients INTEGER DEFAULT 0,
          total_sessions INTEGER DEFAULT 0,
          rating NUMERIC DEFAULT 5.0,
          total_earnings NUMERIC DEFAULT 0,
          earnings_breakdown JSONB DEFAULT '{"products": 0, "group_classes": 0, "individual_classes": 0, "tips": 0, "programs": 0}'::JSONB,
          monthly_growth JSONB DEFAULT '[]'::JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create RLS policies
        ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

        -- Coach profiles policies
        CREATE POLICY "Coaches can view their own profile"
          ON coach_profiles FOR SELECT
          USING (auth.uid() = user_id);

        CREATE POLICY "Coaches can update their own profile"
          ON coach_profiles FOR UPDATE
          USING (auth.uid() = user_id);

        CREATE POLICY "Coaches can insert their own profile"
          ON coach_profiles FOR INSERT
          WITH CHECK (auth.uid() = user_id);

        -- Create index
        CREATE INDEX IF NOT EXISTS idx_coach_profiles_user_id ON coach_profiles(user_id);
      `

      // Ejecutar la migración
      const { error } = await supabase.rpc("exec_sql", { sql })

      if (error) {
        throw error
      }

      toast({
        title: "Migración completada",
        description: "La tabla coach_profiles ha sido creada correctamente.",
      })
    } catch (error) {
      console.error("Error al ejecutar la migración:", error)
      toast({
        title: "Error",
        description: "No se pudo ejecutar la migración. Verifica los logs para más detalles.",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="p-4 bg-gray-900 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-white">Migración de Coach Profiles</h2>
      <p className="text-gray-300 mb-4">
        Este proceso creará la tabla coach_profiles necesaria para el funcionamiento del perfil de coach.
      </p>
      <Button onClick={runMigration} disabled={isRunning} className="bg-orange-500 hover:bg-orange-600">
        {isRunning ? "Ejecutando..." : "Ejecutar Migración"}
      </Button>
    </div>
  )
}
