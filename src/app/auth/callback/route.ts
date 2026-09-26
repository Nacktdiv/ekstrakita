import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';
  const errorParam = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle provider cancellation or error
  if (errorParam) {
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set(
      'error',
      errorDescription || 'Otentikasi OAuth dibatalkan atau terjadi kesalahan pada penyedia.'
    );
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data.user) {
        const user = data.user;
        const meta = user.user_metadata || {};

        // Extract display name from Google / GitHub OAuth metadata
        const fullName =
          meta.full_name ||
          meta.name ||
          meta.user_name ||
          user.email?.split('@')[0] ||
          'Pengguna EkstraKita';

        // Ensure user profile is registered in public.users table
        const { error: upsertError } = await supabase.from('users').upsert(
          {
            id: user.id,
            name: fullName,
            email: user.email || '',
            role: 'member', // Default role for OAuth users
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );

        if (upsertError) {
          console.warn('Auto-upsert public.users profile warning:', upsertError.message);
        }

        // Validate destination path to prevent open redirects
        const safeDestination = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
        return NextResponse.redirect(new URL(safeDestination, requestUrl.origin));
      } else if (error) {
        console.error('exchangeCodeForSession error:', error.message);
      }
    } catch (err: any) {
      console.error('OAuth callback processing error:', err);
    }
  }

  // Redirect to login if code exchange failed or invalid
  const loginUrl = new URL('/login', requestUrl.origin);
  loginUrl.searchParams.set('error', 'Gagal memverifikasi sesi OAuth. Silakan coba lagi.');
  return NextResponse.redirect(loginUrl);
}
