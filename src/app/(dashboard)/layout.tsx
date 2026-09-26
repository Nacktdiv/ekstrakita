import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import DashboardShell from '@/components/layout/DashboardShell';
import { User, UserRole } from '@/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let currentUser: User | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        currentUser = profile;
      } else {
        currentUser = {
          id: authUser.id,
          name:
            authUser.user_metadata?.name ||
            authUser.email?.split('@')[0] ||
            'Pengguna',
          email: authUser.email || '',
          role: (authUser.user_metadata?.role as UserRole) || 'member',
          created_at: authUser.created_at,
        };
      }
    }
  } catch (error) {
    console.error('Error fetching Supabase user in layout:', error);
  }

  // Fallback demo user for local UI development and testing
  const activeUser: User = currentUser || {
    id: 'demo-member',
    name: 'Siswa Ekskul',
    email: 'siswa@extrakita.sch.id',
    role: 'member',
    created_at: new Date().toISOString(),
  };

  return <DashboardShell user={activeUser}>{children}</DashboardShell>;
}
