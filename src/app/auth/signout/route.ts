import { createServerComponentClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const supabase = await createServerComponentClient()

  await supabase.auth.signOut()

  return NextResponse.redirect(`${requestUrl.origin}/auth/login`, { status: 302 })
}
