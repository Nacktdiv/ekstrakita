-- ExtraKita Database Schema & Storage Setup
-- Reference: .agents/skills/database-architecture/SKILL.md & verification-rules/SKILL.md

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member', -- Options: 'member', 'admin_inventaris', 'bendahara', 'pembina'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Items Table (Inventaris)
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'available', -- Options: 'available', 'borrowed', 'maintenance'
    location VARCHAR(100) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Borrowing Requests Table (Pengajuan Surpin & TTD Digital)
CREATE TABLE IF NOT EXISTS public.borrowing_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    meeting_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL, -- Options: 'present', 'permission', 'sick', 'absent'
    checkin_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. Cash Ledger Table (Buku Kas)
CREATE TABLE IF NOT EXISTS public.cash_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(10) NOT NULL, -- Options: 'income', 'expense'
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    proof_image_url TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 6. Trigger to automatically sync auth.users to public.users on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'member')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Supabase Storage Buckets Setup
-- Note: Buckets can also be created via Supabase Dashboard > Storage
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('surpin_docs', 'surpin_docs', true),
  ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage Policies (Allow public read and authenticated uploads)
CREATE POLICY "Public Read surpin_docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'surpin_docs');

CREATE POLICY "Authenticated Upload surpin_docs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'surpin_docs' AND auth.role() = 'authenticated');

CREATE POLICY "Public Read receipts" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated Upload receipts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');
