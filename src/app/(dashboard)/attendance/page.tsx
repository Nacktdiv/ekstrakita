'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  QrCode,
  ScanLine,
  CheckCircle2,
  Calendar,
  Clock,
  History,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  LayoutList,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Attendance, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime } from '@/lib/utils';
import QrCodeScanner from '@/components/qr/QrCodeScanner';

export default function AttendancePage() {
  const [activeTab, setActiveTab] = React.useState<'scan' | 'history'>('scan');
  const [history, setHistory] = React.useState<Attendance[]>([]);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [todayAttendance, setTodayAttendance] = React.useState<Attendance | null>(null);
  const [loading, setLoading] = React.useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadData = React.useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profile) setCurrentUser(profile);

        // Fetch attendance history for this user
        const { data: attList } = await supabase
          .from('attendance')
          .select('*')
          .eq('user_id', authUser.id)
          .order('meeting_date', { ascending: false });

        if (attList) {
          setHistory(attList);
          const todayCheck = attList.find((a) => a.meeting_date === todayStr);
          if (todayCheck) setTodayAttendance(todayCheck);
        }
      } else {
        // Fallback demo attendance history for UI preview
        setHistory([
          {
            id: 'att-prev-1',
            user_id: 'demo-user',
            meeting_date: '2026-09-19',
            status: 'present',
            checkin_time: '2026-09-19T08:15:30Z',
          },
          {
            id: 'att-prev-2',
            user_id: 'demo-user',
            meeting_date: '2026-09-12',
            status: 'present',
            checkin_time: '2026-09-12T08:05:12Z',
          },
          {
            id: 'att-prev-3',
            user_id: 'demo-user',
            meeting_date: '2026-09-05',
            status: 'permission',
            checkin_time: '2026-09-05T08:00:00Z',
          },
        ]);
      }
    } catch (err) {
      console.error('Error loading attendance data:', err);
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleScanSuccess = (result: any) => {
    if (result?.data) {
      setTodayAttendance(result.data);
      loadData();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return { label: 'Hadir', className: 'bg-emerald-100 text-emerald-800' };
      case 'permission':
        return { label: 'Izin', className: 'bg-blue-100 text-blue-800' };
      case 'sick':
        return { label: 'Sakit', className: 'bg-amber-100 text-amber-800' };
      case 'absent':
        return { label: 'Alpa', className: 'bg-rose-100 text-rose-800' };
      default:
        return { label: status, className: 'bg-slate-100 text-slate-800' };
    }
  };

  const isAdminOrPembina =
    currentUser?.role === 'admin_inventaris' || currentUser?.role === 'pembina';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <QrCode className="h-6 w-6 text-blue-600" />
            Presensi Kehadiran Ekstrakurikuler
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pindai Dynamic QR Code sesi pertemuan dengan kamera HP untuk mencatat kehadiran secara langsung.
          </p>
        </div>

        {/* Link for Admins to Open Session Display */}
        <Link href="/attendance/session">
          <Button variant="outline" size="sm" className="text-xs min-h-[40px] shadow-sm">
            <ScanLine className="h-4 w-4 mr-1.5 text-blue-600" />
            Buka Layar Sesi QR (Pengurus)
          </Button>
        </Link>
      </div>

      {/* Today's Check-in Status Banner */}
      {todayAttendance ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-emerald-950">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold">Anda Sudah Tercatat Hadir Hari Ini! 🎉</p>
              <p className="text-xs text-emerald-800 mt-0.5">
                Waktu Presensi: <span className="font-semibold">{formatTime(todayAttendance.checkin_time)} WIB</span> • Tanggal: {formatDate(todayAttendance.meeting_date)}
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-600 text-white text-xs px-3 py-1 font-bold self-start sm:self-auto">
            Status: Hadir
          </Badge>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3 text-blue-900 text-xs shadow-sm">
          <LayoutList className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <p>
            Sesi latihan hari ini telah dibuka! Arahkan kamera scanner ke layar proyektor untuk mencatat absensi sebelum token 10 detik berganti.
          </p>
        </div>
      )}

      {/* Tabs Switcher: Scanner vs History */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('scan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
            activeTab === 'scan'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CameraIcon className="h-4 w-4" />
          Kamera Pindai QR
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="h-4 w-4" />
          Riwayat Kehadiran ({history.length})
        </button>
      </div>

      {/* Tab 1: QR Scanner */}
      {activeTab === 'scan' && (
        <div className="py-2">
          <QrCodeScanner
            userId={currentUser?.id}
            onScanSuccess={handleScanSuccess}
          />
        </div>
      )}

      {/* Tab 2: Attendance History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <History className="h-4 w-4 text-blue-600" />
            Catatan Kehadiran Ekstrakurikuler
          </h3>

          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Belum ada riwayat presensi yang tercatat.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {history.map((record) => {
                const badge = getStatusBadge(record.status);
                return (
                  <div
                    key={record.id}
                    className="py-3.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          Pertemuan: {formatDate(record.meeting_date)}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3 text-slate-400" />
                          Check-in: {formatTime(record.checkin_time)} WIB
                        </p>
                      </div>
                    </div>

                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CameraIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
