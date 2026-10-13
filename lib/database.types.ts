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
        Row: { product_id: string; current_qty: number; location: string; updated_at: string | null };
        Insert: { product_id: string; current_qty?: number; location?: string; updated_at?: string | null };
        Update: { product_id?: string; current_qty?: number; location?: string; updated_at?: string | null };
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "master_products";
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
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          movement_type?: string | null;
          qty_change: number;
          reason?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          movement_type?: string | null;
          qty_change?: number;
          reason?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "master_products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      adjust_stock: {
        Args: { p_id: string; delta: number; mtype: string; reason: string; p_loc?: string };
        Returns: undefined;
      };
      transfer_stock: {
        Args: { p_id: string; from_loc: string; to_loc: string; qty: number; reason: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
