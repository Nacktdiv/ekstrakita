# ExtraKita - Part 3: Sequential Implementation Phases & Surpin PDF Logic

Document Status: READY FOR AI AGENT EXECUTION
Target Application: ExtraKita (Extracurricular Management & Digital Inventory System)

---

## 5. SEQUENTIAL IMPLEMENTATION PHASES FOR AI AGENT

### Phase 1: Authentication, Database Setup & Middleware Guard
1. Konfigurasi Supabase SSR Client menggunakan `@supabase/ssr`.
2. Buat middleware Supabase untuk membatasi akses rute `/surpin-approval` dan `/attendance/session` khusus bagi role `admin_inventaris` dan `pembina`.
3. Bangun kontainer layout responsif (`Sidebar` untuk Desktop, `BottomNav` untuk Mobile).

---

### Phase 2: PDF Upload & Visual Bounding Box Selection (Core Feature)
1. Pada rute `[id]/request/page.tsx`, buat area *file dropzone* yang menerima berkas PDF maksimal 5MB.
2. Rendisi halaman PDF menggunakan `pdfjs-dist` di atas elemen HTML5 `<canvas>`.
3. Tumpukkan *overlay* kotak interaktif transparan yang dapat digeser (draggable) bertuliskan "Area Tanda Tangan" di atas canvas.
4. Ambil koordinat $(X, Y)$ yang sudah dinormalisasi terhadap ukuran asli dokumen PDF beserta nomor halaman target, lalu simpan ke tabel `borrowing_requests` dengan status `pending`.
5. Sediakan tombol aksi cepat: `"Auto-Snap Bottom Right"` untuk langsung menempatkan posisi $(X, Y)$ di sudut kanan bawah halaman standar.

---

### Phase 3: Admin Review, Digital Signature Canvas & PDF Processing
1. Bangun rute `surpin-approval/[id]/sign/page.tsx` khusus untuk role `admin_inventaris`.
2. Tampilkan dokumen PDF dengan sorotan kotak di area yang telah dipilih oleh anggota.
3. Sediakan modal berisi `react-signature-canvas` untuk digunakan admin saat membubuhkan tanda tangan.
4. Buat API Endpoint `/api/pdf/sign`:
   * Ambil berkas `original_pdf_url` dari Supabase Storage (bucket `surpin_docs`)[cite: 1].
   * Konversi data base64 tanda tangan dari canvas menjadi byte gambar PNG.
   * Gunakan pustaka `pdf-lib` pada Server Action / Route Handler untuk menyisipkan gambar TTD ke dalam PDF:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { requestId, signatureBase64 } = await req.json();
    const supabase = createClient();

    // 1. Ambil data pengajuan dari database
    const { data: request, error } = await supabase
      .from('borrowing_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // 2. Unduh PDF asli dari Supabase Storage
    const pdfResponse = await fetch(request.original_pdf_url);
    const existingPdfBytes = await pdfResponse.arrayBuffer();

    // 3. Load dokumen PDF & halaman target menggunakan pdf-lib
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const targetPage = pages[request.signature_page - 1];

    // 4. Transformasi base64 TTD ke PNG & embed ke PDF
    const signaturePngBytes = Buffer.from(
      signatureBase64.replace(/^data:image\/png;base64,/, ''),
      'base64'
    );
    const pngImage = await pdfDoc.embedPng(signaturePngBytes);

    // 5. Gambar TTD di koordinat yang telah ditentukan
    targetPage.drawImage(pngImage, {
      x: request.signature_pos_x,
      y: request.signature_pos_y,
      width: 120,
      height: 60,
    });

    // 6. Simpan dokumen PDF baru
    const signedPdfBytes = await pdfDoc.save();
    const fileName = `signed_${requestId}.pdf`;

    // 7. Unggah hasil TTD ke Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('surpin_docs')
      .upload(fileName, signedPdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 8. Dapatkan Public URL & Update Status
    const { data: publicUrlData } = supabase.storage
      .from('surpin_docs')
      .getPublicUrl(fileName);

    await supabase
      .from('borrowing_requests')
      .update({
        signed_pdf_url: publicUrlData.publicUrl,
        status: 'approved',
      })
      .eq('id', requestId);

    return NextResponse.json({ success: true, url: publicUrlData.publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

```

### Phase 4: Dynamic QR Attendance System

1. Sisi Pengurus (/attendance/session):
  Buat generator QR Code dinamis dengan payload token: JSON.stringify({ timestamp: Date.now(), sessionId: "uuid" }).Perbarui tampilan QR Code secara otomatis menggunakan react-qr-code setiap 10 detik.

2. Sisi Anggota (/attendance):
  Integrasikan komponen kamera html5-qrcode.
  Validasi timestamp saat proses pemindaian (tolak jika umur token lebih dari 10 detik untuk mencegah kecurangan pemakaian foto/screenshot).
  Saat pemindaian berhasil: Pemicu umpan balik getar via navigator.vibrate(200) dan tampilkan toast notification hijau.

### Phase 5: Digital Cash Ledger & Stat Analytics
1. Buat fungsi CRUD untuk cash_ledger beserta tag kategori (Iuran Anggota, Dana Sekolah, Beli Alat, dll).

2. Tambahkan fitur pengunggahan bukti nota transaksi ke Supabase Storage (bucket receipts).

3. Tampilkan 3 Stat Card di bagian atas halaman: Total Kas, Pemasukan Bulan Ini, dan Pengeluaran Bulan Ini.

4. Sediakan modal Lightbox untuk memperbesar gambar bukti nota transaksi saat diklik tanpa berpindah halaman.
