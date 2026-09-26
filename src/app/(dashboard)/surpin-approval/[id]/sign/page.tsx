'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FileCheck,
  ArrowLeft,
  Calendar,
  User,
  MapPin,
  Boxes,
  PenTool,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BorrowingRequestWithDetails } from '@/types';
import { MOCK_BORROWING_REQUESTS } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, getBorrowingStatusBadge } from '@/lib/utils';
import PdfVisualSelector from '@/components/pdf/PdfVisualSelector';
import PdfSignCanvasModal from '@/components/pdf/PdfSignCanvasModal';

export default function AdminSignPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = React.useState<BorrowingRequestWithDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Signature modal state
  const [isSignModalOpen, setIsSignModalOpen] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [signedResultUrl, setSignedResultUrl] = React.useState<string | null>(null);

  // 1. Load Borrowing Request Details
  React.useEffect(() => {
    async function loadRequest() {
      try {
        const supabase = createClient();
        const { data, error: fetchErr } = await supabase
          .from('borrowing_requests')
          .select('*, user:users(*), item:items(*)')
          .eq('id', requestId)
          .single();

        if (!fetchErr && data) {
          setRequest(data as BorrowingRequestWithDetails);
        } else {
          // Fallback to mock borrowing requests
          const found = MOCK_BORROWING_REQUESTS.find((r) => r.id === requestId);
          setRequest(found || MOCK_BORROWING_REQUESTS[0]);
        }
      } catch (err: any) {
        console.error('Error loading request for signing:', err);
        const found = MOCK_BORROWING_REQUESTS.find((r) => r.id === requestId);
        setRequest(found || MOCK_BORROWING_REQUESTS[0]);
      } finally {
        setLoading(false);
      }
    }

    if (requestId) {
      loadRequest();
    }
  }, [requestId]);

  // 2. Handle Signature Submission via /api/pdf/sign
  const handleSignatureConfirm = async (signatureBase64: string) => {
    if (!request) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/pdf/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: request.id,
          signatureBase64,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal menandatangani dokumen PDF.');
      }

      setSignedResultUrl(result.url || result.signedPdfBase64);
      setIsSignModalOpen(false);

      // Update local state to approved
      setRequest((prev) =>
        prev
          ? {
              ...prev,
              status: 'approved',
              signed_pdf_url: result.url || result.signedPdfBase64,
            }
          : null
      );
    } catch (err: any) {
      console.error('Signing error:', err);
      setError(err?.message || 'Terjadi kesalahan saat memproses embedding TTD.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Pengajuan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 mt-1">
          Dokumen pengajuan surpin dengan ID ini tidak tersedia.
        </p>
        <Link href="/surpin-approval" className="inline-block mt-4">
          <Button variant="outline" size="sm">
            Kembali ke Antrean
          </Button>
        </Link>
      </div>
    );
  }

  const statusBadge = getBorrowingStatusBadge(request.status);
  const isApproved = request.status === 'approved' || !!signedResultUrl;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/surpin-approval"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Kembali ke Antrean Persetujuan
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-blue-600" />
            Tinjau & Tanda Tangani Dokumen Surpin
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Periksa dokumen surpin pemohon dan bubuhkan tanda tangan digital pada area yang disorot hijau.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Status Pengajuan:</span>
          <span className={`text-xs px-3 py-1 rounded-full font-bold shadow-sm ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>
      </div>

      {/* Success Notification if Signed */}
      {isApproved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-emerald-950 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold">Dokumen Berhasil Ditandatangani & Disetujui! 🎉</p>
              <p className="text-xs text-emerald-800 mt-0.5">
                Tanda tangan digital telah disematkan via <span className="font-semibold">pdf-lib</span> ke dalam dokumen PDF asli.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={signedResultUrl || request.signed_pdf_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white min-h-[40px]">
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Lihat & Unduh PDF
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main 2-Column Review Layout (Desktop Side-by-Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: PDF Preview with Target Highlight Box */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pratinjau Dokumen PDF
              </span>
              <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                Target Halaman {request.signature_page}
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Area Sorotan TTD
            </span>
          </div>

          {/* Render PDF with highlight box locked in student's chosen position */}
          <PdfVisualSelector
            file={signedResultUrl || request.signed_pdf_url || request.original_pdf_url}
            initialPage={request.signature_page}
            readOnly={true}
            highlightPosition={{
              x: request.signature_pos_x,
              y: request.signature_pos_y,
              page: request.signature_page,
            }}
          />
        </div>

        {/* Right Column: Information Panel & Signature Action */}
        <div className="lg:col-span-4 space-y-5">
          {/* Item & Loan Detail Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              Rincian Pengajuan Peminjaman
            </h2>

            {/* Item Info */}
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center">
                {request.item?.image_url ? (
                  <img
                    src={request.item.image_url}
                    alt={request.item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Boxes className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold uppercase text-blue-600 tracking-wider">
                  {request.item?.category || 'Inventaris'}
                </span>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {request.item?.name || 'Peralatan Ekstrakurikuler'}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                  {request.item?.location || 'Gudang Sarpras'}
                </p>
              </div>
            </div>

            {/* Applicant Info */}
            <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Pemohon:</span>
                <span className="font-bold text-slate-900">{request.user?.name || 'Siswa Anggota'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Email:</span>
                <span className="text-slate-700">{request.user?.email || 'siswa@sekolah.sch.id'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Mulai Pinjam:</span>
                <span className="font-semibold text-slate-800">{formatDate(request.borrow_date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Rencana Kembali:</span>
                <span className="font-semibold text-slate-800">{formatDate(request.return_date)}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Koordinat TTD:</span>
                <span className="font-mono text-blue-700 font-semibold">
                  Hal {request.signature_page} ({Math.round(request.signature_pos_x)}, {Math.round(request.signature_pos_y)})
                </span>
              </div>
            </div>
          </div>

          {/* Action Trigger Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900">
              Otorisasi Tanda Tangan Digital
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dengan menandatangani dokumen ini, pengurus menyetujui peminjaman alat dan sistem akan otomatis menyematkan tanda tangan ke berkas PDF secara permanen.
            </p>

            <div className="pt-2 space-y-2">
              {!isApproved ? (
                <Button
                  onClick={() => setIsSignModalOpen(true)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white min-h-[46px] shadow-sm font-semibold"
                >
                  <PenTool className="h-4 w-4 mr-2 text-blue-400" />
                  Bubuhkan Tanda Tangan Sekarang
                </Button>
              ) : (
                <Button
                  disabled
                  variant="outline"
                  className="w-full opacity-70 min-h-[46px] bg-emerald-50 text-emerald-800 border-emerald-200"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                  Sudah Ditandatangani
                </Button>
              )}

              <Link href="/surpin-approval" className="block">
                <Button variant="ghost" className="w-full text-xs min-h-[40px] text-slate-500">
                  Kembali ke Daftar Antrean
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Canvas Modal */}
      <PdfSignCanvasModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onConfirm={handleSignatureConfirm}
        loading={isProcessing}
      />
    </div>
  );
}
