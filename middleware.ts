import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas — no requieren autenticación
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const expected = process.env.APP_SESSION_TOKEN

  // Safety guard: si el env var no está configurado, dejar pasar todo
  // (el sitio sigue funcionando hasta que actives la protección en Vercel)
  if (!expected) return NextResponse.next()

  const token = request.cookies.get('auth_token')?.value
  if (token !== expected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
