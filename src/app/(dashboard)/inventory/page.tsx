'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Boxes,
  Search,
  MapPin,
  Tag,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Item, ItemStatus } from '@/types';
import { INITIAL_ITEMS } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getItemStatusBadge } from '@/lib/utils';

export default function InventoryPage() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('Semua');

  React.useEffect(() => {
    async function loadItems() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          setItems(data);
          console.log('data tersedia')
        } else {
          // Use initial items if database table is empty
          setItems(INITIAL_ITEMS);
          console.log('data tidak tersedia')
        }
      } catch (err) {
        console.error('Error loading inventory items:', err);
        setItems(INITIAL_ITEMS);
      } finally {
        setLoading(false);
      }
    }

    loadItems();
  }, []);

  const categories = ['Semua', ...Array.from(new Set(items.map((i) => i.category || 'Lainnya')))];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'Semua' || (item.category || 'Lainnya') === selectedCategory;

    const matchesStatus =
      selectedStatus === 'Semua' ||
      (selectedStatus === 'available' && item.status === 'available') ||
      (selectedStatus === 'borrowed' && item.status === 'borrowed') ||
      (selectedStatus === 'maintenance' && item.status === 'maintenance');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="h-6 w-6 text-blue-600" />
            Katalog Inventaris Ekstrakurikuler
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pilih peralatan yang tersedia untuk mengajukan surat peminjaman (Surpin) berbasis digital signature.
          </p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama barang, kategori, atau lokasi penyimpanan..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all min-h-[44px]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Status:
          </span>
          {['Semua', 'available', 'borrowed', 'maintenance'].map((st) => {
            const isSelected = selectedStatus === st;
            let label = 'Semua Status';
            if (st === 'available') label = 'Tersedia';
            if (st === 'borrowed') label = 'Dipinjam';
            if (st === 'maintenance') label = 'Perbaikan';

            return (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors min-h-[32px] ${
                  isSelected
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Item Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          const statusBadge = getItemStatusBadge(item.status);
          const isAvailable = item.status === 'available';

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
            >
              {/* Item Image */}
              <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Boxes className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm ${statusBadge.className}`}>
                    {statusBadge.label}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Tag className="h-3 w-3" />
                    {item.category || 'Umum'}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {item.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>

                {/* Card Action */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  {isAvailable ? (
                    <Link href={`/inventory/${item.id}/request`} className="block">
                      <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white min-h-[44px]">
                        Ajukan Surpin
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled variant="outline" className="w-full opacity-60 min-h-[44px]">
                      Sedang {statusBadge.label}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Boxes className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak ada barang ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1">
            Coba sesuaikan kata kunci pencarian atau filter status yang dipilih.
          </p>
        </div>
      )}
    </div>
  );
}
