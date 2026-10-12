// Shape of the database tables, so TypeScript knows what queries return.
// Keep in sync with supabase/migrations. (Can later be generated with
// `supabase gen types typescript`.)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: never;
        Update: {
          display_name?: string;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          name: string;
          destination: string | null;
          start_date: string | null;
          end_date: string | null;
          invite_code: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          name: string;
          destination?: string | null;
          start_date?: string | null;
          end_date?: string | null;
        };
        Update: {
          name?: string;
          destination?: string | null;
          start_date?: string | null;
          end_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "trips_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_members: {
        Row: {
          trip_id: string;
          user_id: string;
          role: "owner" | "member";
          joined_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      places: {
        Row: {
          id: string;
          trip_id: string;
          name: string;
          category: "eat" | "stay" | "see" | "do";
          status: "idea" | "going" | "skipped";
          notes: string | null;
          location: string | null;
          latitude: number | null;
          longitude: number | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          trip_id: string;
          name: string;
          category: "eat" | "stay" | "see" | "do";
          status?: "idea" | "going" | "skipped";
          notes?: string | null;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
        Update: {
          name?: string;
          category?: "eat" | "stay" | "see" | "do";
          status?: "idea" | "going" | "skipped";
          notes?: string | null;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "places_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "places_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      itinerary_items: {
        Row: {
          id: string;
          trip_id: string;
          place_id: string | null;
          day: string;
          starts_at: string | null;
          title: string;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          trip_id: string;
          place_id?: string | null;
          day: string;
          starts_at?: string | null;
          title: string;
          notes?: string | null;
        };
        Update: {
          place_id?: string | null;
          day?: string;
          starts_at?: string | null;
          title?: string;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "itinerary_items_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "itinerary_items_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          id: string;
          trip_id: string;
          title: string;
          amount: number;
          currency: string;
          payer_id: string | null;
          spent_on: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          trip_id: string;
          title: string;
          amount: number;
          currency: string;
          spent_on?: string | null;
        };
        Update: {
          title?: string;
          amount?: number;
          currency?: string;
          spent_on?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_payer_id_fkey";
            columns: ["payer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      expense_payments: {
        Row: {
          expense_id: string;
          user_id: string;
          amount: number;
        };
        Insert: {
          expense_id: string;
          user_id: string;
          amount: number;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "expense_payments_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_payments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      expense_splits: {
        Row: {
          expense_id: string;
          user_id: string;
          amount: number;
        };
        Insert: {
          expense_id: string;
          user_id: string;
          amount: number;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "expense_splits_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_splits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      place_photos: {
        Row: {
          id: string;
          place_id: string;
          path: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          place_id: string;
          path: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "place_photos_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "place_photos_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      trip_by_invite: {
        Args: { p_code: string };
        Returns: {
          id: string;
          name: string;
          destination: string | null;
          start_date: string | null;
          end_date: string | null;
          owner_name: string;
        }[];
      };
      join_trip: {
        Args: { p_code: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
