import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  let body: { password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { password } = body
  const appPassword = process.env.APP_PASSWORD
  const sessionToken = process.env.APP_SESSION_TOKEN

  if (!appPassword || !sessionToken) {
    return NextResponse.json({ error: 'Servidor no configurado' }, { status: 500 })
  }

  if (typeof password !== 'string' || password !== appPassword) {
    // Pequeño delay para dificultar fuerza bruta
    await new Promise((r) => setTimeout(r, 400))
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('auth_token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: '/',
  })
  return response
}
