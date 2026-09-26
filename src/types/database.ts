export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'member' | 'admin_inventaris' | 'bendahara' | 'pembina';
export type ItemStatus = 'available' | 'borrowed' | 'maintenance';
export type BorrowingStatus = 'pending' | 'approved' | 'rejected' | 'picked_up' | 'returned';
export type AttendanceStatus = 'present' | 'permission' | 'sick' | 'absent';
export type CashType = 'income' | 'expense';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: UserRole;
          created_at?: string;
        };
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          status: ItemStatus;
          location: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          status?: ItemStatus;
          location: string;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string | null;
          status?: ItemStatus;
          location?: string;
          image_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      borrowing_requests: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          original_pdf_url: string;
          signed_pdf_url: string | null;
          signature_pos_x: number;
          signature_pos_y: number;
          signature_page: number;
          status: BorrowingStatus;
          borrow_date: string;
          return_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          original_pdf_url: string;
          signed_pdf_url?: string | null;
          signature_pos_x: number;
          signature_pos_y: number;
          signature_page?: number;
          status?: BorrowingStatus;
          borrow_date: string;
          return_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          original_pdf_url?: string;
          signed_pdf_url?: string | null;
          signature_pos_x?: number;
          signature_pos_y?: number;
          signature_page?: number;
          status?: BorrowingStatus;
          borrow_date?: string;
          return_date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "borrowing_requests_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "borrowing_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      attendance: {
        Row: {
          id: string;
          user_id: string;
          meeting_date: string;
          status: AttendanceStatus;
          checkin_time: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          meeting_date: string;
          status: AttendanceStatus;
          checkin_time?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          meeting_date?: string;
          status?: AttendanceStatus;
          checkin_time?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      cash_ledger: {
        Row: {
          id: string;
          type: CashType;
          amount: number;
          description: string | null;
          proof_image_url: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: CashType;
          amount: number;
          description?: string | null;
          proof_image_url?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: CashType;
          amount?: number;
          description?: string | null;
          proof_image_url?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cash_ledger_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      item_status: ItemStatus;
      borrowing_status: BorrowingStatus;
      attendance_status: AttendanceStatus;
      cash_type: CashType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
