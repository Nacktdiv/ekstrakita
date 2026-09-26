'use client';

import * as React from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Loader2,
  ScanLine,
  Keyboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QrCodeScannerProps {
  onScanSuccess?: (result: any) => void;
  userId?: string;
}

export default function QrCodeScanner({ onScanSuccess, userId }: QrCodeScannerProps) {
  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const readerElementId = 'html5-qr-reader-container';

  const [isScanning, setIsScanning] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [scanResult, setScanResult] = React.useState<any | null>(null);
  const [scanError, setScanError] = React.useState<string | null>(null);
  const [manualToken, setManualToken] = React.useState('');
  const [showManualInput, setShowManualInput] = React.useState(false);

  // Initialize and start scanner
  const startScanner = async () => {
    setScanError(null);
    setScanResult(null);

    try {
      const html5QrCode = new Html5Qrcode(readerElementId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' }, // Rear camera preferred
        config,
        async (decodedText) => {
          // Temporarily pause scanner on detection
          await stopScanner();
          handleProcessToken(decodedText);
        },
        (errorMessage) => {
          // Frame parse error ignored during camera feed
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setScanError(
        'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan atau gunakan input manual.'
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Camera stop error:', e);
      }
    }
    setIsScanning(false);
  };

  // Process and verify scanned token
  const handleProcessToken = async (tokenString: string) => {
    setLoading(true);
    setScanError(null);
    setScanResult(null);

    try {
      // 1. Client-Side Preliminary Check
      let payload: { timestamp: number; sessionId: string };
      try {
        payload = JSON.parse(tokenString);
      } catch {
        throw new Error('Data QR Code tidak valid atau bukan token ExtraKita.');
      }

      const now = Date.now();
      const ageMs = now - payload.timestamp;

      // 2. Client-Side Anti-Cheat Early Check (10 seconds)
      if (ageMs > 10000) {
        const expiredSec = ((ageMs - 10000) / 1000).toFixed(1);
        throw new Error(
          `QR Code kedaluwarsa ${expiredSec} detik lalu! Penggunaan foto/screenshot dilarang (Anti-Cheat).`
        );
      }

      // 3. Server-Side Verification via /api/qr/verify
      const response = await fetch('/api/qr/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenString, userId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Verifikasi presensi gagal.');
      }

      // 4. Trigger Haptic Feedback (200ms Vibration)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(200);
        } catch {
          // Ignored if device does not support vibration
        }
      }

      setScanResult(data);
      if (onScanSuccess) {
        onScanSuccess(data);
      }
    } catch (err: any) {
      setScanError(err?.message || 'Gagal memproses kode QR.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Success Toast Notification */}
      {scanResult && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-5 shadow-lg text-emerald-950 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {scanResult.alreadyCheckedIn ? 'Sudah Tercatat Hadir!' : 'Presensi Berhasil Dicatat! 🎉'}
              </h3>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                {scanResult.message}
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-emerald-900 bg-emerald-100/60 px-3 py-1.5 rounded-lg">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>Terverifikasi • Anti-Cheat Valid</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error / Anti-Cheat Alert */}
      {scanError && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-md text-rose-950 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900">Validasi Presensi Ditolak</h3>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed">{scanError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Camera Viewport Container */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Pemindai Kamera QR</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Batas Waktu: 10 Detik</span>
        </div>

        {/* The Viewport Element */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 min-h-[280px] flex items-center justify-center">
          <div id={readerElementId} className="w-full" />

          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-slate-900/90 z-10">
              <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-3">
                <ScanLine className="h-8 w-8 text-blue-400" />
              </div>
              <h4 className="text-base font-bold">Kamera Belum Aktif</h4>
              <p className="text-xs text-slate-300 mt-1 max-w-xs">
                Arahkan kamera ke layar proyektor atau HP pengurus yang menampilkan Dynamic QR Code.
              </p>
              <Button
                onClick={startScanner}
                disabled={loading}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white min-h-[44px] px-6 font-semibold"
              >
                <Camera className="h-4 w-4 mr-2" />
                Mulai Pindai Kamera
              </Button>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
              <Loader2 className="h-8 w-8 text-blue-400 animate-spin mb-2" />
              <p className="text-xs font-semibold">Memverifikasi Anti-Cheat & Token...</p>
            </div>
          )}
        </div>

        {/* Scanner Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-2">
          {isScanning ? (
            <Button
              variant="outline"
              size="sm"
              onClick={stopScanner}
              className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200 min-h-[38px]"
            >
              Hentikan Kamera
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={startScanner}
              className="text-xs min-h-[38px]"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Pindai Ulang
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-xs text-slate-600 hover:text-slate-900 min-h-[38px]"
          >
            <Keyboard className="h-3.5 w-3.5 mr-1" />
            {showManualInput ? 'Tutup Input' : 'Uji Salin Token'}
          </Button>
        </div>

        {/* Testing / Manual Token Input Area */}
        {showManualInput && (
          <div className="pt-3 border-t border-slate-100 space-y-2 animate-in fade-in">
            <label className="block text-xs font-semibold text-slate-700">
              Tempel Token QR (Untuk Pengujian Simulator / Tanpa Kamera):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder='{"timestamp": 1234567890, "sessionId": "..."}'
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <Button
                size="sm"
                onClick={() => handleProcessToken(manualToken)}
                disabled={!manualToken || loading}
                className="text-xs bg-slate-900 text-white min-h-[36px]"
              >
                Kirim
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
