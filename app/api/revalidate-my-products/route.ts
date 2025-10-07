import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
export async function GET() {
  revalidatePath("/my-products")
  return NextResponse.json({ revalidated: true, now: Date.now() })
}
