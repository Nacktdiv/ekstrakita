import { Database, UserRole, ItemStatus, BorrowingStatus, AttendanceStatus, CashType } from './database';

export * from './database';

export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Item = Database['public']['Tables']['items']['Row'];
export type ItemInsert = Database['public']['Tables']['items']['Insert'];
export type ItemUpdate = Database['public']['Tables']['items']['Update'];

export type BorrowingRequest = Database['public']['Tables']['borrowing_requests']['Row'];
export type BorrowingRequestInsert = Database['public']['Tables']['borrowing_requests']['Insert'];
export type BorrowingRequestUpdate = Database['public']['Tables']['borrowing_requests']['Update'];

export type Attendance = Database['public']['Tables']['attendance']['Row'];
export type AttendanceInsert = Database['public']['Tables']['attendance']['Insert'];
export type AttendanceUpdate = Database['public']['Tables']['attendance']['Update'];

export type CashLedger = Database['public']['Tables']['cash_ledger']['Row'];
export type CashLedgerInsert = Database['public']['Tables']['cash_ledger']['Insert'];
export type CashLedgerUpdate = Database['public']['Tables']['cash_ledger']['Update'];

// Extended types with joins / relationships
export interface BorrowingRequestWithDetails extends BorrowingRequest {
  user?: User;
  item?: Item;
}

export interface AttendanceWithUser extends Attendance {
  user?: User;
}

export interface CashLedgerWithUser extends CashLedger {
  creator?: User | null;
}

// QR Code Session & Payload Type (Phase 4 requirement: { timestamp: number, sessionId: string })
export interface QrTokenPayload {
  timestamp: number;
  sessionId: string;
}

// Cash Ledger Summary Analytics
export interface CashLedgerStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}
