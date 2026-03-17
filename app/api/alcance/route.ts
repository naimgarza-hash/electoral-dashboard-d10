import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key if available (safer), fallback to anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  let body: { seccion?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const seccion = Number(body.seccion)
  if (!Number.isInteger(seccion) || seccion <= 0) {
    return NextResponse.json({ error: 'Número de sección inválido' }, { status: 400 })
  }

  // Atomic upsert via RPC
  const { data, error } = await supabase.rpc('increment_seccion', {
    p_seccion: seccion,
  })

  if (error) {
    console.error('Supabase RPC error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ seccion, count: data as number })
}
