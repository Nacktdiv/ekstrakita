'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  ArrowRight,
  ExternalLink,
  Filter,
  FileText,
  Boxes,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BorrowingRequestWithDetails, BorrowingStatus } from '@/types';
import { MOCK_BORROWING_REQUESTS } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getBorrowingStatusBadge, formatDate } from '@/lib/utils';

export default function SurpinApprovalPage() {
  const [requests, setRequests] = React.useState<BorrowingRequestWithDetails[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterStatus, setFilterStatus] = React.useState<string>('all');

  React.useEffect(() => {
    async function loadRequests() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('borrowing_requests')
          .select('*, user:users(*), item:items(*)')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setRequests(data as BorrowingRequestWithDetails[]);
        } else {
          setRequests(MOCK_BORROWING_REQUESTS);
        }
      } catch (err) {
        console.error('Error fetching borrowing requests:', err);
        setRequests(MOCK_BORROWING_REQUESTS);
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, []);

  const filteredRequests = requests.filter((req) => {
    if (filterStatus === 'all') return true;
    return req.status === filterStatus;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-blue-600" />
            Antrean Persetujuan Surpin & TTD Digital
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar pengajuan surat peminjaman inventaris yang memerlukan verifikasi dan tanda tangan digital admin/pembina.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3.5 py-2 rounded-xl font-medium self-start sm:self-auto shadow-sm">
            <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
            <span>
              <strong>{pendingCount}</strong> pengajuan menunggu TTD
            </span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'Semua Pengajuan' },
          { key: 'pending', label: 'Menunggu TTD' },
          { key: 'approved', label: 'Disetujui / Siap Diambil' },
          { key: 'picked_up', label: 'Sedang Dipinjam' },
          { key: 'returned', label: 'Selesai Dikembalikan' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`text-xs px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
              filterStatus === tab.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak ada pengajuan surpin</h3>
          <p className="text-xs text-slate-500 mt-1">
            Belum ada berkas peminjaman dengan status ini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const statusBadge = getBorrowingStatusBadge(req.status);
            const isPending = req.status === 'pending';

            return (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Left: Item & Applicant Info */}
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center">
                    {req.item?.image_url ? (
                      <img
                        src={req.item.image_url}
                        alt={req.item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Boxes className="h-6 w-6 text-slate-400" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {req.item?.name || 'Peralatan Ekstrakurikuler'}
                      </h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {req.user?.name || 'Siswa Anggota'} ({req.user?.email || 'siswa@sekolah.sch.id'})
                      </span>

                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(req.borrow_date)} s/d {formatDate(req.return_date)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono">
                      Target TTD: Halaman {req.signature_page} • Posisi (X: {Math.round(req.signature_pos_x)}, Y: {Math.round(req.signature_pos_y)})
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 flex-shrink-0">
                  {isPending ? (
                    <Link href={`/surpin-approval/${req.id}/sign`}>
                      <Button className="bg-slate-900 hover:bg-slate-800 text-white min-h-[44px]">
                        <FileCheck className="h-4 w-4 mr-2 text-blue-400" />
                        Tinjau & Tanda Tangani
                      </Button>
                    </Link>
                  ) : req.signed_pdf_url ? (
                    <a
                      href={req.signed_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex"
                    >
                      <Button variant="outline" className="min-h-[44px] text-xs">
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        Lihat PDF Bertanda Tangan
                      </Button>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">Telah Disetujui</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
