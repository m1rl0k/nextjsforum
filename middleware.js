import { NextResponse } from 'next/server';

// Cache for installation status to reduce API calls
let installStatusCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute cache

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow install API routes during installation
  if (pathname.startsWith('/api/install')) {
    return NextResponse.next();
  }

  // Check installation status (for production or when explicitly enabled)
  const shouldCheckInstall = process.env.NODE_ENV === 'production' ||
                             process.env.USE_DATABASE_SETTINGS === 'true';

  if (shouldCheckInstall) {
    const now = Date.now();
    let isInstalled = process.env.FORUM_INSTALLED === 'true';

    // Use cached status if available and not expired
    if (installStatusCache !== null && (now - cacheTimestamp) < CACHE_TTL) {
      isInstalled = installStatusCache;
    } else {
      // Try to verify install status via API
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const statusRes = await fetch(
          new URL('/api/install/status', request.url).toString(),
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (statusRes.ok) {
          const data = await statusRes.json();
          isInstalled = !!data.isInstalled;
          installStatusCache = isInstalled;
          cacheTimestamp = now;
        }
      } catch (err) {
        // If the status check fails, use cached value or env flag
        console.warn('Install status check failed:', err.message);
      }
    }

    // Redirect logic based on installation status
    if (isInstalled) {
      // Forum is installed - block access to install pages
      if (pathname.startsWith('/install')) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } else {
      // Forum is NOT installed - redirect everything to install page
      if (!pathname.startsWith('/install')) {
        return NextResponse.redirect(new URL('/install', request.url));
      }
    }
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/moderation', '/admin', '/profile', '/messages', '/settings'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - except /api/install which we handle above
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
