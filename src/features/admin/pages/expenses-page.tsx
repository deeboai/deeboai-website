"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { EmptyState } from "@/features/admin/components/empty-state";
import { MetricCard } from "@/features/admin/components/metric-card";
import { SectionCard } from "@/features/admin/components/section-card";
import { DEFAULT_EXPENSE_CATEGORIES, PAYMENT_METHOD_OPTIONS } from "@/features/admin/config/defaults";
import { useAdminPreference, usePreferredOptions } from "@/features/admin/hooks/use-admin-preferences";
import { useAdminReferenceData } from "@/features/admin/hooks/use-admin-reference-data";
import { calculateDeductibleAmount, getTaxPeriod, sumBy } from "@/features/admin/lib/calculations";
import { getLocalDateInputValue } from "@/features/admin/lib/date";
import { deleteRow, getSignedReceiptUrl, listRows, upsertRow } from "@/features/admin/lib/data-client";
import { formatCurrency, formatDate } from "@/features/admin/lib/format";
import { sanitizeFileName } from "@/lib/input-security";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/supabase";

type ExpensesPageProps = {
  userId: string;
  userEmail: string;
};

type ExpenseRow = Database["public"]["Tables"]["expense_entries"]["Row"];

type ExpenseDraft = {
  expense_date: string;
  vendor: string;
  business_id: string;
  expense_category: string;
  description: string;
  amount: string;
  business_use_percent: string;
  payment_method: string;
  is_recurring: boolean;
  notes: string;
};

const emptyDraft: ExpenseDraft = {
  expense_date: getLocalDateInputValue(),
  vendor: "",
  business_id: "",
  expense_category: "software",
  description: "",
  amount: "",
  business_use_percent: "100",
  payment_method: "business debit",
  is_recurring: false,
  notes: "",
};

function createDraftFromRow(row: ExpenseRow): ExpenseDraft {
  return {
    expense_date: row.expense_date,
    vendor: row.vendor,
    business_id: row.business_id,
    expense_category: row.expense_category,
    description: row.description,
    amount: String(row.amount),
    business_use_percent: String(row.business_use_percent),
    payment_method: row.payment_method,
    is_recurring: row.is_recurring,
    notes: row.notes ?? "",
  };
}

export function ExpensesPage({ userId, userEmail }: ExpensesPageProps) {
  const queryClient = useQueryClient();
  const referenceQuery = useAdminReferenceData();
  const expensesQuery = useQuery({
    queryKey: ["expense-entries"],
    queryFn: () => listRows("expense_entries", { orderBy: "expense_date", ascending: false }),
  });

  const [draft, setDraft] = useState<ExpenseDraft>(emptyDraft);
  const [editingRow, setEditingRow] = useState<ExpenseRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [businessFilter, setBusinessFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const businesses = referenceQuery.data?.businesses ?? [];
  const { storedValue: preferredBusinessId, rememberValue: rememberBusinessId } = useAdminPreference("expenses.business_id");
  const { storedValue: preferredExpenseCategory, rememberValue: rememberExpenseCategory } = useAdminPreference("expenses.category");
  const { storedValue: preferredPaymentMethod, rememberValue: rememberPaymentMethod } = useAdminPreference("expenses.payment_method");
  const orderedBusinesses = usePreferredOptions(businesses, (business) => business.id, preferredBusinessId);
  const orderedExpenseCategories = usePreferredOptions(
    [...DEFAULT_EXPENSE_CATEGORIES],
    (category) => category,
    preferredExpenseCategory,
  );
  const orderedPaymentMethods = usePreferredOptions(
    [...PAYMENT_METHOD_OPTIONS],
    (method) => method,
    preferredPaymentMethod,
  );
  const entries = expensesQuery.data ?? [];
  const amount = Number(draft.amount || 0);
  const businessUsePercent = Number(draft.business_use_percent || 0);
  const deductibleAmount = calculateDeductibleAmount(amount, businessUsePercent);

  const filteredEntries = entries.filter((entry) => {
    const matchesBusiness = businessFilter === "all" || entry.business_id === businessFilter;
    const matchesCategory = categoryFilter === "all" || entry.expense_category === categoryFilter;
    const matchesFromDate = !fromDate || entry.expense_date >= fromDate;
    const matchesToDate = !toDate || entry.expense_date <= toDate;

    return matchesBusiness && matchesCategory && matchesFromDate && matchesToDate;
  });

  const totalSpent = sumBy(filteredEntries, (entry) => entry.amount);
  const totalDeductible = sumBy(filteredEntries, (entry) => entry.deductible_amount);
  const categoryTotals = DEFAULT_EXPENSE_CATEGORIES.map((category) => ({
    category,
    total: sumBy(filteredEntries.filter((entry) => entry.expense_category === category), (entry) => entry.deductible_amount),
  })).filter((item) => item.total > 0);
  const businessTotals = businesses
    .map((business) => ({
      business,
      total: sumBy(filteredEntries.filter((entry) => entry.business_id === business.id), (entry) => entry.deductible_amount),
    }))
    .filter((item) => item.total > 0);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let receiptPath = editingRow?.receipt_path ?? null;

      // Upload the receipt before saving the row so the saved path is immediately usable.
      if (receiptFile) {
        const supabase = getSupabaseBrowserClient();
        const filePath = `${userId}/${Date.now()}-${sanitizeFileName(receiptFile.name)}`;
        const { error } = await supabase.storage
          .from("expense-receipts")
          .upload(filePath, receiptFile, { upsert: false });

        if (error) {
          throw new Error(error.message);
        }

        receiptPath = filePath;
      }

      const taxPeriod = getTaxPeriod(draft.expense_date);

      return upsertRow("expense_entries", {
        id: editingRow?.id,
        user_id: userId,
        business_id: draft.business_id,
        expense_date: draft.expense_date,
        vendor: draft.vendor.trim(),
        expense_category: draft.expense_category,
        description: draft.description.trim(),
        amount,
        business_use_percent: businessUsePercent,
        deductible_amount: deductibleAmount,
        payment_method: draft.payment_method,
        is_recurring: draft.is_recurring,
        receipt_path: receiptPath,
        notes: draft.notes.trim() || null,
        tax_year: taxPeriod.taxYear,
        tax_quarter: taxPeriod.taxQuarter,
      });
    },
    onSuccess: () => {
      rememberBusinessId(draft.business_id);
      rememberExpenseCategory(draft.expense_category);
      rememberPaymentMethod(draft.payment_method);
      toast.success(editingRow ? "Expense updated." : "Expense created.");
      setDialogOpen(false);
      setEditingRow(null);
      setDraft(emptyDraft);
      setReceiptFile(null);
      queryClient.invalidateQueries({ queryKey: ["expense-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save expense entry.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRow("expense_entries", id),
    onSuccess: () => {
      toast.success("Expense deleted.");
      queryClient.invalidateQueries({ queryKey: ["expense-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete expense entry.");
    },
  });

  function openCreateDialog() {
    const preferredBusiness = businesses.find((business) => business.id === preferredBusinessId);

    setEditingRow(null);
    setDraft({
      ...emptyDraft,
      business_id: preferredBusiness?.id ?? businesses[0]?.id ?? "",
      expense_category: preferredExpenseCategory || emptyDraft.expense_category,
      payment_method: preferredPaymentMethod || emptyDraft.payment_method,
    });
    setReceiptFile(null);
    setDialogOpen(true);
  }

  function openEditDialog(row: ExpenseRow) {
    setEditingRow(row);
    setDraft(createDraftFromRow(row));
    setReceiptFile(null);
    setDialogOpen(true);
  }

  async function openReceipt(entry: ExpenseRow) {
    if (!entry.receipt_path) {
      return;
    }

    try {
      const signedUrl = await getSignedReceiptUrl(entry.receipt_path);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open receipt.");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.business_id || !draft.vendor.trim() || !draft.description.trim() || amount <= 0) {
      toast.error("Complete the required expense fields before saving.");
      return;
    }

    await saveMutation.mutateAsync();
  }

  return (
    <AdminShell
      title="Expenses"
      subtitle="Capture every deductible business expense with business-use allocation and optional receipt storage."
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Total spent" value={formatCurrency(totalSpent)} />
          <MetricCard label="Total deductible" value={formatCurrency(totalDeductible)} tone="positive" />
          <MetricCard
            label="Average business-use allocation"
            value={filteredEntries.length ? `${Math.round(sumBy(filteredEntries, (entry) => entry.business_use_percent) / filteredEntries.length)}%` : "0%"}
          />
        </div>

        <SectionCard
          title="Expense ledger"
          description="Receipt files are stored separately from the repository in Supabase Storage and linked back to each expense row."
          action={
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add expense
            </Button>
          }
        >
          <div className="grid gap-4 lg:grid-cols-4">
            <Select value={businessFilter} onValueChange={setBusinessFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Business" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All businesses</SelectItem>
                {orderedBusinesses.map((business) => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {orderedExpenseCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </div>

          <div className="mt-6">
            {filteredEntries.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Deductible</TableHead>
                    <TableHead className="text-right">Receipt</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.expense_date)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.vendor}</p>
                          <p className="text-xs text-muted-foreground">{entry.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {businesses.find((business) => business.id === entry.business_id)?.name ?? "Unknown"}
                      </TableCell>
                      <TableCell>{entry.expense_category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.amount, true)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.deductible_amount, true)}</TableCell>
                      <TableCell className="text-right">
                        {entry.receipt_path ? (
                          <Button variant="ghost" size="sm" onClick={() => openReceipt(entry)}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(entry)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(entry.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                title="No expenses match the current filters"
                description="Add a business expense or widen the filter range to populate this ledger."
              />
            )}
          </div>
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard title="Totals by category">
            <div className="space-y-3">
              {categoryTotals.length ? (
                categoryTotals.map((item) => (
                  <div key={item.category} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <span className="capitalize">{item.category}</span>
                    <span className="font-medium">{formatCurrency(item.total)}</span>
                  </div>
                ))
              ) : (
                <EmptyState title="No category totals yet" description="Add expense activity to see category rollups." />
              )}
            </div>
          </SectionCard>

          <SectionCard title="Totals by business">
            <div className="space-y-3">
              {businessTotals.length ? (
                businessTotals.map((item) => (
                  <div key={item.business.id} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <span>{item.business.name}</span>
                    <span className="font-medium">{formatCurrency(item.total)}</span>
                  </div>
                ))
              ) : (
                <EmptyState title="No business totals yet" description="Assign expenses to a business to populate this summary." />
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl rounded-3xl border-border/70 bg-card">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit expense" : "Create expense"}</DialogTitle>
            <DialogDescription>
              Deductible amount is calculated automatically from the amount and business-use percentage.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expense_date">Date</Label>
                <Input
                  id="expense_date"
                  type="date"
                  value={draft.expense_date}
                  onChange={(event) => setDraft((current) => ({ ...current, expense_date: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Business</Label>
                <Select
                  value={draft.business_id}
                  onValueChange={(value) => setDraft((current) => ({ ...current, business_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a business" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderedBusinesses.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  value={draft.vendor}
                  onChange={(event) => setDraft((current) => ({ ...current, vendor: event.target.value }))}
                  placeholder="Stripe, Notion, Best Buy"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={draft.expense_category}
                  onValueChange={(value) => setDraft((current) => ({ ...current, expense_category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderedExpenseCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.amount}
                  onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_use_percent">Business-use percent</Label>
                <Input
                  id="business_use_percent"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={draft.business_use_percent}
                  onChange={(event) => setDraft((current) => ({ ...current, business_use_percent: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment method</Label>
                <Select
                  value={draft.payment_method}
                  onValueChange={(value) => setDraft((current) => ({ ...current, payment_method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderedPaymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt">Receipt file</Label>
                <Input id="receipt" type="file" onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                placeholder="Short description for reporting"
                required
              />
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
              <input
                id="is_recurring"
                type="checkbox"
                checked={draft.is_recurring}
                onChange={(event) => setDraft((current) => ({ ...current, is_recurring: event.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="is_recurring" className="text-sm">
                This is a recurring expense
              </Label>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
              <p className="text-sm text-muted-foreground">Deductible amount</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(deductibleAmount, true)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Optional receipt details, renewal cadence, or tax notes"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingRow ? "Save changes" : "Create expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
