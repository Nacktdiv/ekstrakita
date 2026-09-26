'use client';

import * as React from 'react';
import {
  Move,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  CheckCircle2,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SignaturePosition {
  x: number;
  y: number;
  page: number;
  pdfWidth: number;
  pdfHeight: number;
  canvasX: number;
  canvasY: number;
}

interface PdfVisualSelectorProps {
  file: File | ArrayBuffer | string;
  onPositionChange?: (pos: SignaturePosition) => void;
  initialPage?: number;
  readOnly?: boolean;
  highlightPosition?: { x: number; y: number; page: number };
}

export default function PdfVisualSelector({
  file,
  onPositionChange,
  initialPage = 1,
  readOnly = false,
  highlightPosition,
}: PdfVisualSelectorProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const [pdfDoc, setPdfDoc] = React.useState<any>(null);
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [numPages, setNumPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Original PDF dimensions in Points
  const [pdfPageSize, setPdfPageSize] = React.useState({ width: 595.28, height: 841.89 }); // default A4
  // Rendered Canvas dimensions in px
  const [canvasSize, setCanvasSize] = React.useState({ width: 600, height: 850 });

  // Signature Bounding Box dimensions in Canvas px
  const BOX_WIDTH = 130;
  const BOX_HEIGHT = 65;

  // Box position relative to Canvas (top-left based)
  const [boxPos, setBoxPos] = React.useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartRef = React.useRef<{ mouseX: number; mouseY: number; boxX: number; boxY: number }>({
    mouseX: 0,
    mouseY: 0,
    boxX: 0,
    boxY: 0,
  });

  // 1. Load PDF Document via pdfjs-dist
  React.useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      try {
        setLoading(true);
        setError(null);

        const pdfjsLib = await import('pdfjs-dist');
        // Set worker CDN URL
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        let arrayBuffer: ArrayBuffer;
        if (file instanceof File) {
          arrayBuffer = await file.arrayBuffer();
        } else if (typeof file === 'string') {
          const res = await fetch(file);
          arrayBuffer = await res.arrayBuffer();
        } else {
          arrayBuffer = file;
        }

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const doc = await loadingTask.promise;

        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(Math.min(initialPage, doc.numPages));
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        if (!isCancelled) setError(err?.message || 'Gagal memuat dokumen PDF.');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [file, initialPage]);

  // 2. Render Page to Canvas
  const renderPage = React.useCallback(
    async (pageNum: number) => {
      if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        const unscaledViewport = page.getViewport({ scale: 1.0 });

        // Save original PDF page size in points
        const origWidth = unscaledViewport.width;
        const origHeight = unscaledViewport.height;
        setPdfPageSize({ width: origWidth, height: origHeight });

        // Calculate responsive scale based on container width
        const containerWidth = Math.min(containerRef.current.clientWidth - 16, 750);
        const scale = containerWidth / origWidth;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        setCanvasSize({ width: viewport.width, height: viewport.height });

        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        // If highlightPosition is specified, position box there
        if (highlightPosition && highlightPosition.page === pageNum) {
          // Reverse normalization to canvas
          const cx = (highlightPosition.x / origWidth) * viewport.width;
          const cy = ( (origHeight - highlightPosition.y) / origHeight ) * viewport.height - BOX_HEIGHT;
          setBoxPos({ x: Math.max(0, cx), y: Math.max(0, cy) });
        }
      } catch (err: any) {
        console.error('Error rendering page:', err);
      }
    },
    [pdfDoc, highlightPosition]
  );

  React.useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, renderPage]);

  // Re-calculate & emit normalized coordinates when box position changes
  const emitCoordinates = React.useCallback(
    (bx: number, by: number, page: number) => {
      if (!onPositionChange || canvasSize.width === 0 || canvasSize.height === 0) return;

      // Coordinate Scaling Normalization Formula (.agents/skills/verification-rules/SKILL.md)
      // Signature_X = (Canvas_X / CanvasWidth) * PDFPageWidth
      // In PDF format, origin (0,0) is at Bottom-Left.
      // Therefore, PDF Y = PDFPageHeight - ((Canvas_Y + BoxHeight) / CanvasHeight) * PDFPageHeight
      const normalizedX = (bx / canvasSize.width) * pdfPageSize.width;
      const normalizedY =
        pdfPageSize.height - ((by + BOX_HEIGHT) / canvasSize.height) * pdfPageSize.height;

      onPositionChange({
        x: Math.round(normalizedX * 100) / 100,
        y: Math.round(normalizedY * 100) / 100,
        page,
        pdfWidth: Math.round(pdfPageSize.width * 100) / 100,
        pdfHeight: Math.round(pdfPageSize.height * 100) / 100,
        canvasX: bx,
        canvasY: by,
      });
    },
    [canvasSize, pdfPageSize, onPositionChange]
  );

  // 3. Auto-Snap Bottom Right Action
  const handleAutoSnapBottomRight = () => {
    const snapX = Math.max(0, canvasSize.width - BOX_WIDTH - 24);
    const snapY = Math.max(0, canvasSize.height - BOX_HEIGHT - 32);
    setBoxPos({ x: snapX, y: snapY });
    emitCoordinates(snapX, snapY, currentPage);
  };

  // 4. Drag and Drop Handlers (Mouse & Touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (readOnly) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      boxX: boxPos.x,
      boxY: boxPos.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || readOnly) return;

    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    let newX = dragStartRef.current.boxX + deltaX;
    let newY = dragStartRef.current.boxY + deltaY;

    // Constrain within canvas boundaries
    const maxX = Math.max(0, canvasSize.width - BOX_WIDTH);
    const maxY = Math.max(0, canvasSize.height - BOX_HEIGHT);

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    setBoxPos({ x: newX, y: newY });
    emitCoordinates(newX, newY, currentPage);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (readOnly) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored if capture wasn't held
    }
  };

  return (
    <div className="flex flex-col items-center w-full space-y-4" ref={containerRef}>
      {/* Top Toolbar: Pagination & Quick Actions */}
      <div className="w-full bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Page Switcher */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage <= 1 || loading}
            onClick={() => {
              const p = currentPage - 1;
              setCurrentPage(p);
              emitCoordinates(boxPos.x, boxPos.y, p);
            }}
            className="h-8 px-2 text-xs"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
          </Button>
          <span className="text-xs font-semibold text-slate-700 px-2">
            Halaman {currentPage} dari {numPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage >= numPages || loading}
            onClick={() => {
              const p = currentPage + 1;
              setCurrentPage(p);
              emitCoordinates(boxPos.x, boxPos.y, p);
            }}
            className="h-8 px-2 text-xs"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Action: Auto-Snap Bottom Right */}
        {!readOnly && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAutoSnapBottomRight}
              className="h-8 px-3 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
              Auto-Snap Bottom Right
            </Button>
          </div>
        )}
      </div>

      {/* PDF Viewport & Canvas Overlay Container */}
      <div className="relative border-2 border-slate-300 rounded-xl shadow-md bg-slate-200/50 p-2 overflow-auto max-w-full">
        {loading && (
          <div className="min-h-[450px] min-w-[320px] flex flex-col items-center justify-center p-8 text-slate-500">
            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold">Merendisi PDF Surpin...</p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center text-rose-600 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* HTML5 Canvas */}
        <canvas
          ref={canvasRef}
          className="rounded-lg shadow-sm bg-white block select-none touch-none mx-auto"
        />

        {/* Draggable Bounding Box Overlay for Digital Signature */}
        {!loading && !error && (
          <div
            style={{
              position: 'absolute',
              top: `${boxPos.y + 8}px`, // +8px padding of container
              left: `${boxPos.x + 8}px`,
              width: `${BOX_WIDTH}px`,
              height: `${BOX_HEIGHT}px`,
              touchAction: 'none',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`cursor-move select-none rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-shadow shadow-md ${
              readOnly
                ? 'border-emerald-600 bg-emerald-500/20 text-emerald-950 ring-2 ring-emerald-500/30'
                : isDragging
                ? 'border-blue-700 bg-blue-600/30 shadow-xl scale-[1.02] ring-2 ring-blue-500'
                : 'border-blue-600 bg-blue-500/20 hover:bg-blue-500/30 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-1 text-[11px] font-bold tracking-tight">
              <Crosshair className="h-3.5 w-3.5" />
              <span>Area Tanda Tangan</span>
            </div>
            <span className="text-[9px] font-semibold text-slate-600 mt-0.5">
              {readOnly ? 'Posisi TTD Siswa' : 'Geser untuk mengatur'}
            </span>
          </div>
        )}
      </div>

      {/* Realtime Coordinate Readout */}
      {!loading && (
        <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-center gap-4 bg-white px-4 py-2 rounded-lg border border-slate-200">
          <span>
            Halaman: <strong className="text-slate-800">{currentPage}</strong>
          </span>
          <span>
            Canvas Pos: <strong className="text-slate-800">{Math.round(boxPos.x)}, {Math.round(boxPos.y)} px</strong>
          </span>
          <span>
            PDF Points: <strong className="text-blue-600">
              X: {Math.round((boxPos.x / canvasSize.width) * pdfPageSize.width)}pt, 
              Y: {Math.round(pdfPageSize.height - ((boxPos.y + BOX_HEIGHT) / canvasSize.height) * pdfPageSize.height)}pt
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
