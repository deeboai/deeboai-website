"use client";

import type { PostgrestError } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/supabase";

export type AppTableName =
  | "businesses"
  | "income_entries"
  | "expense_entries"
  | "mileage_entries"
  | "personal_cashflow_entries"
  | "tax_reserves"
  | "assets"
  | "profiles"
  | "user_settings"
  | "tax_planning_profiles"
  | "home_office_profiles"
  | "w2_paychecks"
  | "home_office_space_periods";

type TableRow<T extends AppTableName> = Database["public"]["Tables"][T]["Row"];
type TableInsert<T extends AppTableName> = Database["public"]["Tables"][T]["Insert"];
type TableUpdate<T extends AppTableName> = Database["public"]["Tables"][T]["Update"];

function throwIfError(error: PostgrestError | null) {
  if (error) {
    throw new Error(error.message);
  }
}

export async function listRows<T extends AppTableName>(
  table: T,
  options?: {
    orderBy?: keyof TableRow<T> & string;
    ascending?: boolean;
  },
) {
  const supabase = getSupabaseBrowserClient() as any;
  const orderBy = options?.orderBy ?? "created_at";
  const ascending = options?.ascending ?? false;

  const { data, error } = await supabase.from(table).select("*").order(orderBy, { ascending });
  throwIfError(error);

  return (data ?? []) as unknown as TableRow<T>[];
}

export async function upsertRow<T extends AppTableName>(table: T, values: TableInsert<T> | TableUpdate<T>) {
  const supabase = getSupabaseBrowserClient() as any;
  const { data, error } = await supabase.from(table).upsert(values).select().single();
  throwIfError(error);

  return data as unknown as TableRow<T>;
}

export async function deleteRow<T extends AppTableName>(table: T, id: string) {
  const supabase = getSupabaseBrowserClient() as any;
  const { error } = await supabase.from(table).delete().eq("id", id);
  throwIfError(error);
}

export async function getSignedReceiptUrl(path: string) {
  const supabase = getSupabaseBrowserClient() as any;
  const { data, error } = await supabase.storage
    .from("expense-receipts")
    .createSignedUrl(path, 60 * 5);

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}
