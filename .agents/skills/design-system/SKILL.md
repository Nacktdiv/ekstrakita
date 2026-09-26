# ExtraKita - Part 2: Folder Structure, Routing & UI/UX Design System

Document Status: READY FOR AI AGENT EXECUTION
Target Application: ExtraKita (Extracurricular Management & Digital Inventory System)

---

## 1. DIRECTORY STRUCTURE & ROUTING (NEXT.JS 14 APP ROUTER)

Susun arsitektur folder dan file Next.js sesuai dengan spesifikasi berikut:

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx              # Form Login User & Auth Handler
│   │   └── register/
│   │       └── page.tsx              # Form Registrasi Anggota Baru
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Shell Utama: BottomNav (Member) & Sidebar (Admin/Pembina)
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Overview Ringkasan & Redirect Berdasarkan Role
│   │   ├── inventory/
│   │   │   ├── page.tsx              # Katalog Barang & Status Availability
│   │   │   └── [id]/
│   │   │       └── request/
│   │   │           └── page.tsx      # Unggah Surpin PDF & Interaktif Bounding Box TTD
│   │   ├── surpin-approval/
│   │   │   ├── page.tsx              # Daftar Antrean Pengajuan Surpin (Admin/Pengurus)
│   │   │   └── [id]/
│   │   │       └── sign/
│   │   │           └── page.tsx      # Review PDF & Touch Canvas Modal TTD Digital
│   │   ├── attendance/
│   │   │   ├── page.tsx              # Kamera Scanner QR (Siswa) & Riwayat Presensi
│   │   │   └── session/
│   │   │       └── page.tsx      # Tampilan Dynamic QR Code Display (Pengurus)
│   │   └── finance/
│   │       └── page.tsx              # Buku Kas, Stat Cards & Receipt Lightbox Modal
│   ├── api/
│   │   ├── pdf/
│   │   │   └── sign/
│   │   │       └── route.ts         # Endpoint Server-Side pdf-lib Embedding TTD
│   │   └── qr/
│   │       └── generate/
│   │           └── route.ts         # Endpoint Token Payload Dynamic QR
│   └── globals.css                   # Custom CSS & CSS Variables Tailwind
├── components/
│   ├── ui/                           # Komponen Primitif shadcn/ui (Button, Dialog, Badge, Card, Table)
│   ├── pdf/
│   │   ├── PdfVisualSelector.tsx     # Canvas Overlay Draggable Bounding Box TTD
│   │   └── PdfSignCanvasModal.tsx    # Modal Touch Canvas TTD untuk Admin
│   ├── qr/
│   │   ├── QrCodeGenerator.tsx       # Renderer QR Code Auto-Refresh
│   │   └── QrCodeScanner.tsx         # Scanner Kamera dengan Haptic Feedback
│   └── finance/
│       └── ReceiptLightbox.tsx       # Preview Modal Gambar Nota Transaksi
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Supabase Browser Client
│   │   ├── server.ts                 # Supabase Server Action Client
│   │   └── middleware.ts             # Auth & Role Access Guard
│   ├── pdf-service.ts                # Helper Utility Pemrosesan pdf-lib
│   └── utils.ts                      # Helper shadcn (cn, formatCurrency, formatDate)

```

## 2. Tailwind CSS Theme Configuration (`tailwind.config.ts`)

Gunakan variabel warna berikut untuk menyesuaikan tema bawaan Tailwind dengan panduan identitas visual ExtraKita:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1E293B", // Primary Deep Navy
          blue: "#3B82F6",    // Accent Blue
        },
        status: {
          success: "#10B981", // Emerald Green (Available / Approved)
          warning: "#F59E0B", // Amber (Pending / Menunggu TTD)
          danger: "#EF4444",  // Rose Red (Borrowed / Maintenance / Expense)
          neutral: "#64748B", // Slate Gray (Borders / Secondary Text)
        },
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

```
## 3. Layout Responsive rules

Layout Strategy Based on User Role
Member Layout (Mobile-First):

Menggunakan Bottom Navigation Bar 4 Tab (Home, Inventory, Scan QR, Profile).

Area tombol interaktif utama diletakkan pada posisi mudah dijangkau satu tangan (Thumb Zone Optimization).

Elemen tombol dan input pada versi seluler memiliki ukuran area sentuh minimal 44x44 px.

Admin & Pembina Layout (Desktop-First):

Menggunakan Collapsible Sidebar di sebelah kiri.

Menyediakan tampilan multi-kolom untuk tabel data, peninjauan dokumen PDF berdampingan (side-by-side), dan statistik keuangan.


## 4. MICRO-INTERACTIONS & STATE BADGES

Seluruh indikator status di dalam aplikasi harus menggunakan pola soft-background pill badges sebagai berikut : 

```html

<Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
  Menunggu TTD
</Badge>

<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
  Siap Diambil
</Badge>

<Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">
  Dipinjam
</Badge>

```