import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database, UserRole } from '@/types/database';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // If Supabase keys are not set yet (e.g. placeholder env), allow requests to proceed without blocking
  if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Define public and auth routes
  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/auth');
  const isApiRoute = pathname.startsWith('/api');
  const isPublicStatic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') || // static files like favicon.ico, images, etc.
    pathname === '/';

  // 1. Redirect unauthenticated users trying to access protected routes to /login
  if (!user && !isAuthRoute && !isPublicStatic && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // 2. Redirect authenticated users trying to access /login or /register to /dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // 3. Role-based Route Guarding:
  // /surpin-approval and /attendance/session require 'admin_inventaris' or 'pembina' role
  const isSurpinApprovalRoute = pathname.startsWith('/surpin-approval');
  const isAttendanceSessionRoute = pathname.startsWith('/attendance/session');

  if (user && (isSurpinApprovalRoute || isAttendanceSessionRoute)) {
    // Fetch user role from public.users table
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const allowedRoles: UserRole[] = ['admin_inventaris', 'pembina'];
    const userRole = (userData?.role || 'member') as UserRole;

    if (!allowedRoles.includes(userRole)) {
      // Non-admin trying to access admin route, redirect to /dashboard
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('denied', '1');
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
