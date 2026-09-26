'use client';

import * as React from 'react';
import { X, ExternalLink, Download, FileText, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ReceiptLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  amount?: number;
  date?: string;
}

export default function ReceiptLightbox({
  isOpen,
  onClose,
  imageUrl,
  title,
  amount,
  date,
}: ReceiptLightboxProps) {
  const [scale, setScale] = React.useState(1);

  // Reset scale when image changes
  React.useEffect(() => {
    setScale(1);
  }, [imageUrl, isOpen]);

  // Handle ESC key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[90vh] bg-slate-950/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between text-white bg-slate-900/60">
          <div className="flex items-center gap-2.5 truncate pr-4">
            <div className="h-8 w-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="truncate">
              <h4 className="text-sm font-bold truncate">
                {title || 'Bukti Nota Transaksi'}
              </h4>
              <p className="text-[11px] text-slate-400 flex items-center gap-2">
                {amount !== undefined && (
                  <span className="font-semibold text-emerald-400">
                    {formatCurrency(amount)}
                  </span>
                )}
                {date && <span>• {formatDate(date)}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setScale((s) => Math.min(s + 0.25, 2.5))}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 min-h-[38px] min-w-[38px] flex items-center justify-center transition-colors"
              title="Perbesar Gambar"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setScale((s) => Math.max(s - 0.25, 0.75))}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 min-h-[38px] min-w-[38px] flex items-center justify-center transition-colors"
              title="Perkecil Gambar"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 min-h-[38px] min-w-[38px] flex items-center justify-center transition-colors"
              title="Buka Ukuran Asli di Tab Baru"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 min-h-[38px] min-w-[38px] flex items-center justify-center transition-colors"
              title="Tutup (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Image Preview Container */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40 min-h-[300px]">
          <img
            src={imageUrl}
            alt={title || 'Bukti Nota'}
            style={{ transform: `scale(${scale})` }}
            className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg transition-transform duration-150 select-none"
          />
        </div>

        {/* Bottom Help Text */}
        <div className="py-2.5 px-5 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Gunakan tombol zoom atau buka di tab baru untuk inspeksi nota detail.</span>
          <span>Zoom: {Math.round(scale * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
