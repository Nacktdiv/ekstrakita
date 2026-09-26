'use client';

import * as React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  Receipt,
  FileImage,
  Calendar,
  Filter,
  Search,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Trash2,
  DollarSign,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CashLedgerWithUser, CashType } from '@/types';
import { MOCK_CASH_LEDGER } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import ReceiptLightbox from '@/components/finance/ReceiptLightbox';

export default function FinancePage() {
  const [transactions, setTransactions] = React.useState<CashLedgerWithUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState<'all' | 'income' | 'expense'>('all');

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formType, setFormType] = React.useState<CashType>('income');
  const [amount, setAmount] = React.useState<string>('');
  const [description, setDescription] = React.useState<string>('');
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Lightbox state
  const [lightboxData, setLightboxData] = React.useState<{
    isOpen: boolean;
    imageUrl: string | null;
    title?: string;
    amount?: number;
    date?: string;
  }>({
    isOpen: false,
    imageUrl: null,
  });

  // 1. Load Cash Ledger Transactions
  const loadTransactions = React.useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('cash_ledger')
        .select('*, creator:users(*)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setTransactions(data as CashLedgerWithUser[]);
      } else {
        setTransactions(MOCK_CASH_LEDGER);
      }
    } catch (err) {
      console.error('Error fetching cash ledger:', err);
      setTransactions(MOCK_CASH_LEDGER);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // 2. Compute 3 Top Stat Cards (Total Kas, Pemasukan, Pengeluaran)
  const stats = React.useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((tx) => {
      const val = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        totalIncome += val;
      } else {
        totalExpense += val;
      }
    });

    return {
      totalBalance: totalIncome - totalExpense,
      monthlyIncome: totalIncome,
      monthlyExpense: totalExpense,
    };
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      (tx.description && tx.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.creator?.name && tx.creator.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'all' || tx.type === filterType;

    return matchesSearch && matchesType;
  });

  // Handle receipt image selection
  const handleReceiptChange = (file: File) => {
    setReceiptFile(file);
    const objectUrl = URL.createObjectURL(file);
    setReceiptPreview(objectUrl);
  };

  // 3. Handle Form Submit (Insert Cash Record + Upload Receipt to 'receipts')
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numericAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      setFormError('Nominal transaksi harus lebih besar dari Rp 0.');
      return;
    }

    if (!description.trim()) {
      setFormError('Keterangan transaksi wajib diisi.');
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      let proofImageUrl = receiptPreview || null;

      // Upload receipt image to Supabase Storage bucket 'receipts'
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop() || 'jpg';
        const fileName = `receipt_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `images/${fileName}`;

        try {
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('receipts')
            .upload(filePath, receiptFile, {
              cacheControl: '3600',
              upsert: true,
              contentType: receiptFile.type,
            });

          if (!uploadErr && uploadData) {
            const { data: urlData } = supabase.storage
              .from('receipts')
              .getPublicUrl(filePath);
            proofImageUrl = urlData.publicUrl;
          }
        } catch (storageErr) {
          console.warn('Storage upload fallback:', storageErr);
        }
      }

      // Insert record to cash_ledger table
      const newEntry = {
        type: formType,
        amount: numericAmount,
        description: description.trim(),
        proof_image_url: proofImageUrl,
        created_by: authUser?.id || null,
        created_at: new Date().toISOString(),
      };

      const { data: inserted, error: insertError } = await supabase
        .from('cash_ledger')
        .insert(newEntry)
        .select('*, creator:users(*)')
        .single();

      if (insertError) {
        // Fallback local append for dev
        const localRecord: CashLedgerWithUser = {
          id: 'cash-' + Date.now(),
          ...newEntry,
          creator: {
            id: authUser?.id || 'demo-user',
            name: authUser?.user_metadata?.name || 'Pengurus Ekskul',
            email: authUser?.email || '',
            role: 'bendahara',
            created_at: new Date().toISOString(),
          },
        };
        setTransactions((prev) => [localRecord, ...prev]);
      } else if (inserted) {
        setTransactions((prev) => [inserted as CashLedgerWithUser, ...prev]);
      }

      // Reset form & close modal
      setIsFormOpen(false);
      setAmount('');
      setDescription('');
      setReceiptFile(null);
      setReceiptPreview(null);
    } catch (err: any) {
      console.error('Error adding transaction:', err);
      setFormError(err?.message || 'Gagal menyimpan transaksi kas.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6 text-blue-600" />
            Buku Kas Digital Ekstrakurikuler
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan iuran anggota, dana bantuan sekolah, dan pembelanjaan alat operasional dengan lampiran nota transparan.
          </p>
        </div>

        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white min-h-[44px] shadow-sm font-semibold self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4 mr-2 text-blue-400" />
          Catat Transaksi Baru
        </Button>
      </div>

      {/* ======================================================== */}
      {/* 1. TOP 3 STAT CARDS (Total Kas, Pemasukan, Pengeluaran)   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Saldo Kas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Kas Saat Ini
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
            {formatCurrency(stats.totalBalance)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Badge className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0">Saldo Aktif</Badge>
            <span>Seluruh transaksi tercatat</span>
          </div>
        </div>

        {/* Card 2: Pemasukan Bulan Ini */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pemasukan Bulan Ini
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-3 tracking-tight">
            {formatCurrency(stats.monthlyIncome)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0">Iuran & Dana</Badge>
            <span>Total dana masuk</span>
          </div>
        </div>

        {/* Card 3: Pengeluaran Bulan Ini */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pengeluaran Bulan Ini
            </span>
            <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-3 tracking-tight">
            {formatCurrency(stats.monthlyExpense)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Badge className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0">Operasional</Badge>
            <span>Total dana keluar</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TRANSACTION HISTORY TABLE & FILTERS                   */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-600" />
            Riwayat Arus Kas Ekstrakurikuler
          </h2>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'all', label: 'Semua Transaksi' },
              { key: 'income', label: 'Pemasukan (+)' },
              { key: 'expense', label: 'Pengeluaran (-)' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterType(tab.key as any)}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors min-h-[34px] whitespace-nowrap ${
                  filterType === tab.key
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari keterangan pengeluaran, iuran anggota, atau nama pencatat..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white min-h-[44px]"
          />
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Keterangan Transaksi</th>
                <th className="py-3 px-3">Pencatat</th>
                <th className="py-3 px-3 text-center">Bukti Nota</th>
                <th className="py-3 px-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'income';

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Date */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 font-medium">
                      {formatDate(tx.created_at)}
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-slate-900 leading-snug">
                        {tx.description}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        ID: {tx.id.slice(0, 8)}...
                      </span>
                    </td>

                    {/* Creator */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-600">
                      {tx.creator?.name || 'Bendahara'}
                    </td>

                    {/* Receipt Lightbox Trigger */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {tx.proof_image_url ? (
                        <button
                          type="button"
                          onClick={() =>
                            setLightboxData({
                              isOpen: true,
                              imageUrl: tx.proof_image_url,
                              title: tx.description || 'Bukti Transaksi',
                              amount: Number(tx.amount),
                              date: tx.created_at,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold text-[11px] min-h-[34px] transition-colors"
                        >
                          <FileImage className="h-3.5 w-3.5 text-blue-600" />
                          <span>Lihat Nota</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Tanpa Lampiran</span>
                      )}
                    </td>

                    {/* Amount & Pill Badge */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center font-bold text-sm px-2.5 py-0.5 rounded-full',
                          isIncome
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        )}
                      >
                        {isIncome ? '+' : '-'} {formatCurrency(Number(tx.amount))}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs">
            Tidak ada transaksi kas yang sesuai dengan filter pencarian.
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. MODAL FORM INPUT TRANSAKSI BARU (CRUD)                */}
      {/* ======================================================== */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsFormOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Catat Transaksi Buku Kas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Masukkan rincian arus kas beserta foto nota fisik
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
                  <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Transaction Type Radio Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Jenis Transaksi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormType('income')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold text-xs transition-all min-h-[44px] ${
                      formType === 'income'
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownRight className="h-4 w-4 text-emerald-600" />
                    Pemasukan (Income)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('expense')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold text-xs transition-all min-h-[44px] ${
                      formType === 'expense'
                        ? 'border-rose-500 bg-rose-50/70 text-rose-800 ring-2 ring-rose-500/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4 text-rose-600" />
                    Pengeluaran (Expense)
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nominal (Rupiah)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Contoh: 150000"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white min-h-[44px]"
                  />
                </div>
              </div>

              {/* Description Input & Quick Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Keterangan Transaksi
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Iuran anggota bulan September, beli kabel HDMI..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white min-h-[44px]"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 py-0.5">Preset:</span>
                  {[
                    'Iuran Kas Anggota',
                    'Subsidi Operasional Sekolah',
                    'Beli Alat & Sarpras',
                    'Konsumsi Latihan',
                    'Biaya Perawatan Inventaris',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDescription(preset)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Receipt File Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Foto Bukti Nota / Kuitansi (Bucket `receipts`)
                </label>

                {!receiptPreview ? (
                  <div
                    onClick={() => document.getElementById('receipt-upload-input')?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 rounded-xl p-4 text-center cursor-pointer transition-colors"
                  >
                    <input
                      id="receipt-upload-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleReceiptChange(e.target.files[0]);
                        }
                      }}
                    />
                    <UploadCloud className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-slate-700">
                      Klik untuk mengunggah foto nota/struk
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      JPG, PNG, atau WEBP (Maksimal 5MB)
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={receiptPreview}
                        alt="Preview"
                        className="h-12 w-12 object-cover rounded-lg border border-slate-200"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 truncate max-w-xs">
                          {receiptFile?.name || 'Foto Nota'}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Siap diunggah
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReceiptFile(null);
                        setReceiptPreview(null);
                      }}
                      className="text-slate-400 hover:text-rose-600 h-8 px-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  disabled={submitting}
                  className="min-h-[44px]"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-slate-900 hover:bg-slate-800 text-white min-h-[44px] px-6 font-semibold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Transaksi'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. RECEIPT LIGHTBOX MODAL                                */}
      {/* ======================================================== */}
      <ReceiptLightbox
        isOpen={lightboxData.isOpen}
        onClose={() => setLightboxData((prev) => ({ ...prev, isOpen: false }))}
        imageUrl={lightboxData.imageUrl}
        title={lightboxData.title}
        amount={lightboxData.amount}
        date={lightboxData.date}
      />
    </div>
  );
}
