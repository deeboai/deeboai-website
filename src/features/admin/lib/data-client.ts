"use client";

import type { PostgrestError } from "@supabase/supabase-js";

import { sanitizePersistedValue } from "@/lib/input-security";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/supabase";

export type AppTableName =
  | "businesses"
  | "income_entries"
  | "expense_entries"
  | "mileage_entries"
  | "personal_cashflow_entries"
  | "housing_deduction_entries"
  | "housing_monthly_entries"
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

type OrderedTableQueryResult<T extends AppTableName> = Promise<{
  data: TableRow<T>[] | null;
  error: PostgrestError | null;
}>;

type SingleTableQueryResult<T extends AppTableName> = Promise<{
  data: TableRow<T> | null;
  error: PostgrestError | null;
}>;

type TableSelectClient<T extends AppTableName> = {
  select: (columns: string) => {
    order: (column: string, options: { ascending: boolean }) => OrderedTableQueryResult<T>;
  };
};

type TableUpsertClient<T extends AppTableName> = {
  upsert: (values: TableInsert<T>) => {
    select: () => {
      single: () => SingleTableQueryResult<T>;
    };
  };
};

type TableDeleteClient = {
  delete: () => {
    eq: (column: string, value: string) => Promise<{ error: PostgrestError | null }>;
  };
};

function getTableSelectClient<T extends AppTableName>(table: T) {
  const supabase = getSupabaseBrowserClient();

  // Supabase loses table-specific inference when the table name is a generic union, so this helper narrows the
  // query surface to the methods this admin layer actually uses.
  return supabase.from(table as never) as unknown as TableSelectClient<T>;
}

function getTableUpsertClient<T extends AppTableName>(table: T) {
  const supabase = getSupabaseBrowserClient();

  // This cast keeps the shared admin data client strongly typed at the call site even though Supabase cannot infer
  // the exact table shape from a union-backed generic parameter.
  return supabase.from(table as never) as unknown as TableUpsertClient<T>;
}

function getTableDeleteClient<T extends AppTableName>(table: T) {
  const supabase = getSupabaseBrowserClient();

  // Delete queries only need the row identifier in this layer, so the helper exposes the minimal filter contract.
  return supabase.from(table as never) as unknown as TableDeleteClient;
}

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
  const orderBy = options?.orderBy ?? "created_at";
  const ascending = options?.ascending ?? false;
  const tableClient = getTableSelectClient(table);

  const { data, error } = await tableClient.select("*").order(orderBy, { ascending });
  throwIfError(error);

  return (data ?? []) as unknown as TableRow<T>[];
}

export async function upsertRow<T extends AppTableName>(table: T, values: TableInsert<T>) {
  const sanitizedValues = sanitizePersistedValue(values) as TableInsert<T>;
  const tableClient = getTableUpsertClient(table);
  const { data, error } = await tableClient.upsert(sanitizedValues).select().single();
  throwIfError(error);

  return data as unknown as TableRow<T>;
}

export async function deleteRow<T extends AppTableName>(table: T, id: string) {
  const tableClient = getTableDeleteClient(table);
  const { error } = await tableClient.delete().eq("id", id);
  throwIfError(error);
}

export async function getSignedReceiptUrl(path: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.storage
    .from("expense-receipts")
    .createSignedUrl(path, 60 * 5);

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}
