'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ScanLine,
  Users,
  Clock,
  ShieldCheck,
  Maximize,
  Minimize,
  ArrowLeft,
  Calendar,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AttendanceWithUser } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatTime, formatDate } from '@/lib/utils';
import QrCodeGenerator from '@/components/qr/QrCodeGenerator';

export default function AttendanceSessionPage() {
  const [attendees, setAttendees] = React.useState<AttendanceWithUser[]>([]);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [sessionId, setSessionId] = React.useState(
    'ses-' + new Date().toISOString().split('T')[0]
  );

  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch attendees who checked in today
  const loadAttendees = React.useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('attendance')
        .select('*, user:users(*)')
        .eq('meeting_date', todayStr)
        .order('checkin_time', { ascending: false });

      if (!error && data) {
        setAttendees(data as AttendanceWithUser[]);
      }
    } catch (err) {
      console.error('Error fetching attendees:', err);
    }
  }, [todayStr]);

  React.useEffect(() => {
    loadAttendees();
    // Poll attendees every 5 seconds during active session
    const interval = setInterval(loadAttendees, 5000);
    return () => clearInterval(interval);
  }, [loadAttendees]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/attendance"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Kembali ke Presensi Siswa
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ScanLine className="h-6 w-6 text-blue-600" />
            Layar Sesi Dynamic QR Presensi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tampilkan layar ini di proyektor atau tablet pengurus agar siswa dapat memindai kehadiran secara langsung.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={toggleFullscreen}
            className="text-xs min-h-[40px]"
          >
            {isFullscreen ? (
              <>
                <Minimize className="h-4 w-4 mr-1.5" /> Keluar Layar Penuh
              </>
            ) : (
              <>
                <Maximize className="h-4 w-4 mr-1.5" /> Mode Proyektor Penuh
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Grid: QR Code Generator & Live Attendees Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Dynamic QR Display */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <QrCodeGenerator
            sessionId={sessionId}
            sessionTitle="Presensi Latihan Mingguan Ekstrakurikuler"
          />
        </div>

        {/* Right Column: Live Attendees Statistics & Feed */}
        <div className="lg:col-span-6 space-y-4">
          {/* Quick Stats Card */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-600" /> Total Hadir Hari Ini
              </span>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {attendees.length}{' '}
                <span className="text-xs font-medium text-slate-400">anggota</span>
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-emerald-600" /> Tanggal Sesi
              </span>
              <p className="text-base font-bold text-slate-900 mt-2">
                {formatDate(todayStr)}
              </p>
            </div>
          </div>

          {/* Live Check-in Activity List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Aktivitas Siswa Hadir (Live Feed)
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Sync
              </span>
            </div>

            {attendees.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Belum ada siswa yang memindai QR code hari ini.
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {attendees.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {att.user?.name ? att.user.name.slice(0, 2).toUpperCase() : 'SW'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 truncate">
                          {att.user?.name || 'Siswa Anggota'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {att.user?.email || 'siswa@sekolah.sch.id'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Hadir
                      </Badge>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">
                        {formatTime(att.checkin_time)} WIB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
