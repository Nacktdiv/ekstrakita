'use client';

import * as React from 'react';
import QRCode from 'react-qr-code';
import {
  RotateCcw,
  ShieldCheck,
  Clock,
  QrCode,
  Pause,
  Play,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface QrCodeGeneratorProps {
  sessionId?: string;
  sessionTitle?: string;
  onTokenChange?: (token: string) => void;
}

export default function QrCodeGenerator({
  sessionId = 'ses-ekskul-' + new Date().toISOString().split('T')[0],
  sessionTitle = 'Sesi Presensi Kegiatan Mingguan',
  onTokenChange,
}: QrCodeGeneratorProps) {
  const ROTATION_INTERVAL_SEC = 10;
  const [token, setToken] = React.useState<string>('');
  const [timeLeft, setTimeLeft] = React.useState<number>(ROTATION_INTERVAL_SEC);
  const [isPaused, setIsPaused] = React.useState<boolean>(false);
  const [isPulsing, setIsPulsing] = React.useState<boolean>(false);
  const [copied, setCopied] = React.useState(false);

  // Generate dynamic token
  const generateNewToken = React.useCallback(() => {
    const payload = {
      timestamp: Date.now(),
      sessionId,
      nonce: Math.random().toString(36).substring(2, 9),
    };
    const tokenStr = JSON.stringify(payload);
    setToken(tokenStr);
    setTimeLeft(ROTATION_INTERVAL_SEC);
    setIsPulsing(true);

    if (onTokenChange) {
      onTokenChange(tokenStr);
    }

    setTimeout(() => setIsPulsing(false), 500);
  }, [sessionId, onTokenChange]);

  // Initial token generation
  React.useEffect(() => {
    generateNewToken();
  }, [generateNewToken]);

  // 10-Second Rotation & Countdown Timer
  React.useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          generateNewToken();
          return ROTATION_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, generateNewToken]);

  const progressPercent = ((ROTATION_INTERVAL_SEC - timeLeft) / ROTATION_INTERVAL_SEC) * 100;

  const handleCopy = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto w-full bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-lg text-center space-y-5">
      {/* Session Title & Badge */}
      <div>
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-semibold mb-2">
          <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
          Anti-Cheat Rotasi 10 Detik
        </Badge>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {sessionTitle}
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          ID Sesi: {sessionId}
        </p>
      </div>

      {/* QR Code Container with Pulse Animation on Token Rotation */}
      <div className="relative p-5 bg-slate-50 rounded-2xl border-2 border-slate-200/80 shadow-inner">
        <div
          className={`p-4 bg-white rounded-xl shadow-md transition-all duration-300 ${
            isPulsing ? 'scale-[1.03] ring-4 ring-blue-500/30' : 'scale-100'
          }`}
        >
          {token ? (
            <QRCode
              value={token}
              size={240}
              level="H"
              className="w-full h-auto max-w-[240px] max-h-[240px]"
            />
          ) : (
            <div className="h-60 w-60 flex items-center justify-center text-slate-400 text-xs">
              Membuat token QR...
            </div>
          )}
        </div>

        {/* Live Countdown Tag */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
          <Clock className={`h-3 w-3 ${timeLeft <= 3 ? 'text-amber-400 animate-spin' : 'text-blue-400'}`} />
          <span>Berganti dalam {timeLeft}s</span>
        </div>
      </div>

      {/* Countdown Progress Bar */}
      <div className="w-full pt-2">
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${
              timeLeft <= 3 ? 'bg-amber-500' : 'bg-blue-600'
            }`}
            style={{ width: `${100 - progressPercent}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-center gap-1">
          <QrCode className="h-3 w-3 text-blue-500" />
          QR code otomatis diperbarui untuk mencegah kecurangan foto atau screenshot.
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100 w-full">
        <Button
          size="sm"
          variant="outline"
          onClick={generateNewToken}
          className="text-xs h-9 px-3"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
          Paksa Rotasi
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsPaused(!isPaused)}
          className="text-xs h-9 px-3"
        >
          {isPaused ? (
            <>
              <Play className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> Lanjutkan
            </>
          ) : (
            <>
              <Pause className="h-3.5 w-3.5 mr-1.5 text-amber-600" /> Jeda
            </>
          )}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="text-xs h-9 px-3 text-slate-500"
          title="Salin token teks untuk pengujian"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Tersalin
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 mr-1" /> Salin Token
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
