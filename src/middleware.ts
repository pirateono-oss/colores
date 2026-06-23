import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'es', 'pt'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip non-page routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check if path already has a valid locale prefix
  const hasLocale = locales.some(locale => 
    pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
  
  if (hasLocale) {
    return NextResponse.next();
  }

  // Detect locale from browser
  const acceptLang = request.headers.get('accept-language') || '';
  const detected = locales.find(l => acceptLang.startsWith(l)) || 'es';
  
  // Redirect to detected locale  
  const url = request.nextUrl.clone();
  url.pathname = `/${detected}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
