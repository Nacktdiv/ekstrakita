import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BorrowingStatus, ItemStatus, UserRole } from "@/types";

/**
 * Merges Tailwind class names safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number to Indonesian Rupiah currency format
 * e.g. 50000 -> "Rp 50.000"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats an ISO date string or Date object to Indonesian local date format
 * e.g. "2026-09-26" -> "26 Sep 2026"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Formats time to HH:MM format
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/**
 * Returns Tailwind soft-background pill badge classes for borrowing status
 */
export function getBorrowingStatusBadge(status: BorrowingStatus): { label: string; className: string } {
  switch (status) {
    case "pending":
      return {
        label: "Menunggu TTD",
        className: "bg-amber-100 text-amber-800 hover:bg-amber-100",
      };
    case "approved":
      return {
        label: "Siap Diambil",
        className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
      };
    case "picked_up":
      return {
        label: "Dipinjam",
        className: "bg-rose-100 text-rose-800 hover:bg-rose-100",
      };
    case "returned":
      return {
        label: "Dikembalikan",
        className: "bg-slate-100 text-slate-800 hover:bg-slate-100",
      };
    case "rejected":
      return {
        label: "Ditolak",
        className: "bg-rose-100 text-rose-800 hover:bg-rose-100",
      };
    default:
      return {
        label: status,
        className: "bg-slate-100 text-slate-800 hover:bg-slate-100",
      };
  }
}

/**
 * Returns Tailwind soft-background pill badge classes for item inventory status
 */
export function getItemStatusBadge(status: ItemStatus): { label: string; className: string } {
  switch (status) {
    case "available":
      return {
        label: "Tersedia",
        className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
      };
    case "borrowed":
      return {
        label: "Dipinjam",
        className: "bg-rose-100 text-rose-800 hover:bg-rose-100",
      };
    case "maintenance":
      return {
        label: "Perbaikan",
        className: "bg-amber-100 text-amber-800 hover:bg-amber-100",
      };
    default:
      return {
        label: status,
        className: "bg-slate-100 text-slate-800 hover:bg-slate-100",
      };
  }
}

/**
 * Formats user role into a readable Indonesian title
 */
export function formatRoleName(role: UserRole): string {
  switch (role) {
    case "admin_inventaris":
      return "Admin Inventaris";
    case "bendahara":
      return "Bendahara";
    case "pembina":
      return "Pembina";
    case "member":
    default:
      return "Anggota";
  }
}
