import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    // console.log('🔍 Listando todos los buckets disponibles...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    if (bucketsError) {
      console.error('❌ Error listando buckets:', bucketsError)
      return NextResponse.json({ 
        error: "Error listando buckets", 
        details: bucketsError 
      }, { status: 500 })
    }
    // // console.log('📊 Buckets encontrados:', buckets?.map(b => b.name))
    return NextResponse.json({
      success: true,
      buckets: buckets || [],
      bucketNames: buckets?.map(b => b.name) || []
    })
  } catch (error) {
    console.error('❌ Error general:', error)
    return NextResponse.json({ 
      error: "Error general", 
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
