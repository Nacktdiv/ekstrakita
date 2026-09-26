import * as React from 'react';
import Link from 'next/link';
import {
  Boxes,
  FileCheck,
  QrCode,
  ScanLine,
  Wallet,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
  PackageCheck,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function DashboardPage(props: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const searchParams = await props.searchParams;
  const accessDenied = searchParams?.denied === '1';

  return (
    <div className="space-y-6">
      {/* Access Denied Warning from Middleware Guard */}
      {accessDenied && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900 shadow-sm animate-in fade-in">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Akses Dibatasi oleh Middleware Guard</p>
            <p className="text-amber-700 mt-0.5">
              Halaman yang Anda tuju khusus diperuntukkan bagi pengguna dengan role{' '}
              <span className="font-medium">Admin Inventaris</span> atau{' '}
              <span className="font-medium">Pembina</span>. Anda telah dialihkan kembali ke Dashboard.
            </p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="max-w-2xl">
          <Badge className="bg-blue-500/20 text-blue-300 border-none mb-3">
            Sistem Operasional Ekstrakurikuler
          </Badge>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Selamat Datang di ExtraKita! 👋
          </h1>
          <p className="mt-2 text-slate-300 text-sm md:text-base leading-relaxed">
            Platform terpadu pengelolaan inventaris dengan tanda tangan digital Surpin PDF, absensi dynamic QR code anti-cheat, dan pencatatan buku kas transparan.
          </p>
        </div>
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Inventaris & Surpin */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Inventaris & Surpin
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-bold text-slate-900">Peminjaman Barang</h3>
            <p className="text-xs text-slate-500 mt-1">
              Unggah PDF Surpin, tentukan posisi koordinat TTD secara visual, dan pantau persetujuan.
            </p>
            <div className="mt-4 flex gap-2">
              <Link href="/inventory" className="flex-1">
                <Button size="sm" variant="outline" className="w-full text-xs">
                  Katalog Barang
                </Button>
              </Link>
              <Link href="/surpin-approval">
                <Button size="sm" variant="secondary" className="text-xs">
                  <FileCheck className="h-3.5 w-3.5 mr-1" /> Antrean
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Card 2: Absensi Dynamic QR */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Presensi Kegiatan
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <QrCode className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-bold text-slate-900">Dynamic QR Code</h3>
            <p className="text-xs text-slate-500 mt-1">
              Presensi anti-cheat rotasi token 10 detik. Scan via kamera HP atau buka sesi baru.
            </p>
            <div className="mt-4 flex gap-2">
              <Link href="/attendance" className="flex-1">
                <Button size="sm" className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                  Scan Hadir
                </Button>
              </Link>
              <Link href="/attendance/session">
                <Button size="sm" variant="outline" className="text-xs">
                  Sesi QR
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Card 3: Buku Kas */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Keuangan Ekskul
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-bold text-slate-900">Buku Kas Transparan</h3>
            <p className="text-xs text-slate-500 mt-1">
              Pencatatan iuran anggota dan pengeluaran operasional dengan lampiran foto nota transaksi.
            </p>
            <div className="mt-4">
              <Link href="/finance">
                <Button size="sm" variant="outline" className="w-full text-xs">
                  Buka Buku Kas <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Security & System Status Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Phase 1 Status: Authentication, Database & Middleware Guard
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Seluruh tipe database TypeScript, SSR Supabase Client, dan Middleware Guard aktif melindungi rute sensitif.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>Database Types (`types/database.ts`)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>Supabase SSR Client & Server</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>Role Guard (`/surpin-approval`, `/attendance/session`)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>Responsive Shell (Sidebar & BottomNav)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
