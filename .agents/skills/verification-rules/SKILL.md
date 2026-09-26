# ExtraKita - Part 4: Verification, Security Rules & Important Notes

Document Status: READY FOR AI AGENT EXECUTION
Target Application: ExtraKita (Extracurricular Management & Digital Inventory System)

---

## 6. VERIFICATION & ACCEPTANCE CRITERIA

AI Agent harus memastikan aplikasi memenuhi standar kriteria pengujian berikut sebelum dianggap selesai:

1. **PDF Integrity & Visual Accuracy:**
   * Hasil *embedding* tanda tangan digital menggunakan `pdf-lib` harus mempertahankan ketajaman vektor dan kejelasan teks dokumen PDF asli tanpa merusak struktur file.
   * Posisi letak TTD pada berkas PDF akhir harus presisi dan proporsional sesuai koordinat $(X, Y)$ yang dipilih oleh anggota pada komponen canvas UI.

2. **Attendance Anti-Cheat Enforcement:**
   * Token QR Code harus memiliki batas kedaluwarsa (*expiration*) maksimal 10 detik.
   * Hasil pemindaian QR Code yang kedaluwarsa atau merupakan hasil tangkapan layar (*screenshot*) lama harus ditolak oleh *server action* / API endpoint.

3. **Role Enforcement & Route Guarding:**
   * Pengguna dengan *role* non-admin (`member`) yang mencoba mengakses rute `/surpin-approval` atau `/attendance/session` harus langsung di-redirect ke halaman `/dashboard`.
   * Middleware Supabase harus memvalidasi session dan *role* pengguna dari tabel `users` pada setiap permintaan rute sensitif.

4. **UX Polish & Visual Consistency:**
   * Seluruh indikator status (*Pending*, *Approved*, *Borrowed*, dll.) wajib menggunakan *soft-background pill badges* sesuai dengan skema warna yang ditentukan pada Design System.
   * Tampilan antarmuka anggota pada perangkat seluler harus bebas dari *horizontal scrollbar* dan memenuhi kriteria responsif.

---

## 7. CRITICAL TECHNICAL NOTES FOR AI AGENT

1. **Supabase Storage Buckets Setup:**
   Pastikan dua *bucket* berikut telah dibuat dan dikonfigurasi sebagai *public* atau diakses melalui kreden internal di Supabase Storage:
   * `surpin_docs`: Digunakan untuk menyimpan berkas PDF Surpin asli dan PDF yang telah ditandatangani.
   * `receipts`: Digunakan untuk menyimpan foto/gambar bukti nota transaksi kas.

2. **Coordinate Scaling Normalization (PDF vs Canvas):**
   * Ukuran canvas `pdfjs-dist` di browser bersifat fleksibel (*responsive/view-port dependent*), sedangkan koordinat halaman `pdf-lib` menggunakan satuan ukuran *Points* asli dokumen PDF.
   * AI Agent wajib menerapkan kalkulasi rasio normalisasi berikut saat menangkap dan menyimpan posisi $(X, Y)$:
     $$\text{Signature}_X = \left(\frac{\text{Canvas}_X}{\text{CanvasWidth}}\right) \times \text{PDFPageWidth}$$
     $$\text{Signature}_Y = \left(\frac{\text{Canvas}_Y}{\text{CanvasHeight}}\right) \times \text{PDFPageHeight}$$

---

## 8. SUMMARY OF CREATED BLUEPRINT FILES

Seluruh dokumen perancangan aplikasi ExtraKita telah terbagi menjadi 4 berkas utama:
1. `01-architecture-database.md` - Context, Tech Stack, & Schema PostgreSQL (Supabase)
2. `02-folder-design-system.md` - Directory Structure (App Router) & UI/UX Design System
3. `03-implementation-phases.md` - Phase Execution Plan & Dynamic PDF Signing Logic
4. `04-verification-rules.md` - Verification Criteria, Security Guards, & Coordinate Normalization

Proses perancangan teknis ExtraKita kini **selesai dan siap dieksekusi** sepenuhnya oleh AI Agent.