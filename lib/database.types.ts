export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      master_products: {
        Row: {
          id: string;
          plu_code: string;
          name: string;
          category: string | null;
          price: number;
          min_stock: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          plu_code: string;
          name: string;
          category?: string | null;
          price?: number;
          min_stock?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          plu_code?: string;
          name?: string;
          category?: string | null;
          price?: number;
          min_stock?: number;
          created_at?: string | null;
        };
        Relationships: [];
      };
      inventory: {
        Row: {
          product_id: string;
          current_qty: number;
          updated_at: string | null;
          store_id: string | null;
        };
        Insert: {
          product_id: string;
          current_qty?: number;
          updated_at?: string | null;
          store_id?: string | null;
        };
        Update: {
          product_id?: string;
          current_qty?: number;
          updated_at?: string | null;
          store_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "master_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_store_id_fkey";
            columns: ["store_id"];
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_movements: {
        Row: {
          id: string;
          product_id: string | null;
          movement_type: string | null;
          qty_change: number;
          reason: string | null;
          created_at: string | null;
          store_id: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          movement_type?: string | null;
          qty_change: number;
          reason?: string | null;
          created_at?: string | null;
          store_id?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          movement_type?: string | null;
          qty_change?: number;
          reason?: string | null;
          created_at?: string | null;
          store_id?: string | null;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "master_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_store_id_fkey";
            columns: ["store_id"];
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      stores: {
        Row: {
          id: string;
          name: string;
          code: string;
          address: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          user_id: string;
          username: string;
          full_name: string | null;
          role: string;
          store_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          username: string;
          full_name?: string | null;
          role: string;
          store_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          username?: string;
          full_name?: string | null;
          role?: string;
          store_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_store_id_fkey";
            columns: ["store_id"];
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_requests: {
        Row: {
          id: string;
          product_id: string;
          store_id: string;
          request_type: string;
          requested_delta: number;
          reason: string | null;
          status: string;
          requested_by: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          store_id: string;
          request_type?: string;
          requested_delta: number;
          reason?: string | null;
          status?: string;
          requested_by: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          store_id?: string;
          request_type?: string;
          requested_delta?: number;
          reason?: string | null;
          status?: string;
          requested_by?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_requests_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "master_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_requests_store_id_fkey";
            columns: ["store_id"];
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      adjust_stock: {
        Args: { p_id: string; delta: number; mtype: string; reason: string | null; p_store: string };
        Returns: undefined;
      };
      transfer_stock: {
        Args: { p_id: string; from_loc: string; to_loc: string; qty: number; reason: string | null };
        Returns: undefined;
      };
      request_stock_change: {
        Args: { p_id: string; delta: number; p_type: string; reason: string | null; p_store: string };
        Returns: string;
      };
      review_stock_request: {
        Args: { req_id: string; approve: boolean; note?: string | null };
        Returns: undefined;
      };
      submit_opname_batch: {
        Args: { items: Json; p_store: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
