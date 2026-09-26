# ExtraKita - Part 1: System Architecture & Database Schema

Document Status: READY FOR AI AGENT EXECUTION
Target Application: ExtraKita (Extracurricular Management & Digital Inventory System)
Tech Stack: Next.js 14+ (App Router), Tailwind CSS, shadcn/ui, Supabase (Auth, Postgres, Storage), `pdf-lib`, `pdfjs-dist`, `react-signature-canvas`, `html5-qrcode`

---

## 1. PROJECT OVERVIEW & SCOPE

ExtraKita adalah aplikasi utilitas operasional ekstrakulikuler sekolah[cite: 1]. Aplikasi ini mengintegrasikan tiga fungsi utama:
1. **Absensi Dynamic QR Code** (dengan rotasi token harian/detik untuk mencegah kecurangan)[cite: 1].
2. **Buku Kas Digital** (Pencatatan iuran & pengeluaran transparan dengan lampiran bukti nota)[cite: 1].
3. **Peminjaman Inventaris Berbasis Surpin PDF & Digital Signature** (Siswa mengunggah PDF Surpin, menentukan koordinat TTD secara visual via Canvas, Admin menandatangani via Canvas UI, dan sistem melakukan embedding TTD ke dalam PDF menggunakan `pdf-lib`)[cite: 1].

---

## 2. DATABASE SCHEMA (SUPABASE POSTGRESQL)

Jalankan script SQL berikut pada Supabase SQL Editor[cite: 1]. Seluruh ID entitas menggunakan UUID (`gen_random_uuid()`).

```sql
-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Extends Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member', -- Options: 'member', 'admin_inventaris', 'bendahara', 'pembina'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Items Table (Inventaris)
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'available', -- Options: 'available', 'borrowed', 'maintenance'
    location VARCHAR(100) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Borrowing Requests Table (Pengajuan Surpin & TTD Digital)
CREATE TABLE borrowing_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    original_pdf_url TEXT NOT NULL,
    signed_pdf_url TEXT,
    signature_pos_x FLOAT NOT NULL,
    signature_pos_y FLOAT NOT NULL,
    signature_page INT NOT NULL DEFAULT 1,
    status VARCHAR(30) DEFAULT 'pending', -- Options: 'pending', 'approved', 'rejected', 'picked_up', 'returned'
    borrow_date DATE NOT NULL,
    return_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Attendance Table (Absensi QR)
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    meeting_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL, -- Options: 'present', 'permission', 'sick', 'absent'
    checkin_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. Cash Ledger Table (Buku Kas)
CREATE TABLE cash_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(10) NOT NULL, -- Options: 'income', 'expense'
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    proof_image_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);