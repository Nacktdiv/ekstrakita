'use client';

import * as React from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
  PenTool,
  RotateCcw,
  Check,
  X,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PdfSignCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureBase64: string) => void;
  loading?: boolean;
}

export default function PdfSignCanvasModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}: PdfSignCanvasModalProps) {
  const sigCanvasRef = React.useRef<SignatureCanvas | null>(null);
  const [isEmpty, setIsEmpty] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleClear = () => {
    sigCanvasRef.current?.clear();
    setIsEmpty(true);
    setError(null);
  };

  const handleSave = () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      setError('Harap bubuhkan tanda tangan terlebih dahulu sebelum menyimpan.');
      return;
    }

    try {
      // Get base64 PNG data URL with transparent background
      const dataUrl = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
      onConfirm(dataUrl);
    } catch (err: any) {
      setError(err?.message || 'Gagal mengekstrak tanda tangan.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
              <PenTool className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Tanda Tangan Digital Pengurus
              </h3>
              <p className="text-xs text-slate-500">
                Gunakan jari, stylus, atau kursor untuk membubuhkan TTD resmi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-xs">
              <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Signature Canvas Area */}
          <div className="relative border-2 border-slate-300 rounded-xl bg-slate-50 overflow-hidden shadow-inner">
            <SignatureCanvas
              ref={(ref) => {
                sigCanvasRef.current = ref;
              }}
              penColor="#0f172a"
              canvasProps={{
                className: 'w-full h-56 bg-white cursor-crosshair touch-none',
              }}
              onBegin={() => {
                setIsEmpty(false);
                setError(null);
              }}
            />

            {/* Baseline guideline */}
            <div className="absolute bottom-10 left-6 right-6 border-b border-dashed border-slate-200 pointer-events-none flex justify-between">
              <span className="text-[10px] text-slate-300 select-none pb-1">Area Penandatanganan Resmi</span>
              <span className="text-[10px] text-slate-300 select-none pb-1">ExtraKita Signature</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Format: PNG Transparan (High Definition)</span>
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="inline-flex items-center text-slate-600 hover:text-rose-600 font-medium py-1 px-2 rounded hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Bersihkan Canvas
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="min-h-[44px]"
          >
            Batal
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 text-white min-h-[44px] px-5"
          >
            {loading ? (
              'Menyematkan ke PDF...'
            ) : (
              <>
                <FileCheck2 className="h-4 w-4 mr-2" />
                Terapkan & Tanda Tangani
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
