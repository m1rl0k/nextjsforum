import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes (except install), and install pages
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/install') ||
    pathname.startsWith('/install') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // For production, check installation status
  if (process.env.NODE_ENV === 'production' || process.env.USE_DATABASE_SETTINGS === 'true') {
    // In a real implementation, you would check the database here
    // For now, we'll assume installation is needed if no specific flag is set
    const isInstalled = process.env.FORUM_INSTALLED === 'true';
    
    if (!isInstalled && !pathname.startsWith('/install')) {
      return NextResponse.redirect(new URL('/install', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
