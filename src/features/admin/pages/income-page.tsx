"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Trash2 } from "lucide-react";
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
import { AdminShell } from "@/features/admin/components/admin-shell";
import { EmptyState } from "@/features/admin/components/empty-state";
import { MetricCard } from "@/features/admin/components/metric-card";
import { SectionCard } from "@/features/admin/components/section-card";
import { DEFAULT_INCOME_CATEGORIES } from "@/features/admin/config/defaults";
import { useAdminPreference, usePreferredOptions } from "@/features/admin/hooks/use-admin-preferences";
import { useAdminReferenceData } from "@/features/admin/hooks/use-admin-reference-data";
import { calculateNetReceived, getTaxPeriod, sumBy } from "@/features/admin/lib/calculations";
import { getLocalDateInputValue } from "@/features/admin/lib/date";
import { deleteRow, listRows, upsertRow } from "@/features/admin/lib/data-client";
import { formatCurrency, formatDate } from "@/features/admin/lib/format";
import { toast } from "@/components/ui/sonner";
import type { Database } from "@/types/supabase";

type IncomePageProps = {
  userId: string;
  userEmail: string;
};

type IncomeRow = Database["public"]["Tables"]["income_entries"]["Row"];

type IncomeDraft = {
  received_on: string;
  payer_client: string;
  business_id: string;
  income_category: string;
  gross_amount: string;
  fees_withheld: string;
  notes: string;
};

const emptyDraft: IncomeDraft = {
  received_on: getLocalDateInputValue(),
  payer_client: "",
  business_id: "",
  income_category: "other",
  gross_amount: "",
  fees_withheld: "0",
  notes: "",
};

function createDraftFromRow(row: IncomeRow): IncomeDraft {
  return {
    received_on: row.received_on,
    payer_client: row.payer_client,
    business_id: row.business_id,
    income_category: row.income_category,
    gross_amount: String(row.gross_amount),
    fees_withheld: String(row.fees_withheld),
    notes: row.notes ?? "",
  };
}

export function IncomePage({ userId, userEmail }: IncomePageProps) {
  const queryClient = useQueryClient();
  const referenceQuery = useAdminReferenceData();
  const incomeQuery = useQuery({
    queryKey: ["income-entries"],
    queryFn: () => listRows("income_entries", { orderBy: "received_on", ascending: false }),
  });

  const [draft, setDraft] = useState<IncomeDraft>(emptyDraft);
  const [editingRow, setEditingRow] = useState<IncomeRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [businessFilter, setBusinessFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const entries = incomeQuery.data ?? [];
  const businesses = referenceQuery.data?.businesses ?? [];
  const { storedValue: preferredBusinessId, rememberValue: rememberBusinessId } = useAdminPreference("income.business_id");
  const { storedValue: preferredIncomeCategory, rememberValue: rememberIncomeCategory } = useAdminPreference("income.category");
  const orderedBusinesses = usePreferredOptions(businesses, (business) => business.id, preferredBusinessId);
  const orderedIncomeCategories = usePreferredOptions(
    [...DEFAULT_INCOME_CATEGORIES],
    (category) => category,
    preferredIncomeCategory,
  );
  const grossAmount = Number(draft.gross_amount || 0);
  const feesWithheld = Number(draft.fees_withheld || 0);
  const netReceived = calculateNetReceived(grossAmount, feesWithheld);

  const filteredEntries = entries.filter((entry) => {
    const matchesBusiness = businessFilter === "all" || entry.business_id === businessFilter;
    const matchesCategory = categoryFilter === "all" || entry.income_category === categoryFilter;
    const matchesSearch =
      !searchValue ||
      entry.payer_client.toLowerCase().includes(searchValue.toLowerCase()) ||
      entry.notes?.toLowerCase().includes(searchValue.toLowerCase());
    const matchesFromDate = !fromDate || entry.received_on >= fromDate;
    const matchesToDate = !toDate || entry.received_on <= toDate;

    return matchesBusiness && matchesCategory && matchesSearch && matchesFromDate && matchesToDate;
  });

  const summaryGross = sumBy(filteredEntries, (entry) => entry.gross_amount);
  const summaryFees = sumBy(filteredEntries, (entry) => entry.fees_withheld);
  const summaryNet = sumBy(filteredEntries, (entry) => entry.net_received);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const taxPeriod = getTaxPeriod(draft.received_on);

      return upsertRow("income_entries", {
        id: editingRow?.id,
        user_id: userId,
        business_id: draft.business_id,
        received_on: draft.received_on,
        payer_client: draft.payer_client.trim(),
        income_category: draft.income_category,
        gross_amount: grossAmount,
        fees_withheld: feesWithheld,
        net_received: netReceived,
        notes: draft.notes.trim() || null,
        tax_year: taxPeriod.taxYear,
        tax_quarter: taxPeriod.taxQuarter,
      });
    },
    onSuccess: () => {
      rememberBusinessId(draft.business_id);
      rememberIncomeCategory(draft.income_category);
      toast.success(editingRow ? "Income entry updated." : "Income entry created.");
      setDialogOpen(false);
      setEditingRow(null);
      setDraft(emptyDraft);
      queryClient.invalidateQueries({ queryKey: ["income-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save income entry.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRow("income_entries", id),
    onSuccess: () => {
      toast.success("Income entry deleted.");
      queryClient.invalidateQueries({ queryKey: ["income-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete income entry.");
    },
  });

  function openCreateDialog() {
    const preferredBusiness = businesses.find((business) => business.id === preferredBusinessId);

    setEditingRow(null);
    setDraft({
      ...emptyDraft,
      business_id: preferredBusiness?.id ?? businesses[0]?.id ?? "",
      income_category: preferredIncomeCategory || emptyDraft.income_category,
    });
    setDialogOpen(true);
  }

  function openEditDialog(row: IncomeRow) {
    setEditingRow(row);
    setDraft(createDraftFromRow(row));
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.business_id || !draft.payer_client.trim() || !draft.received_on || grossAmount <= 0) {
      toast.error("Complete the required income fields before saving.");
      return;
    }

    await saveMutation.mutateAsync();
  }

  return (
    <AdminShell
      title="Income"
      subtitle="Track every tutoring payout, consulting invoice, deposit, and final payment as a separate event."
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Gross income" value={formatCurrency(summaryGross)} />
          <MetricCard label="Fees withheld" value={formatCurrency(summaryFees)} />
          <MetricCard label="Net received" value={formatCurrency(summaryNet)} tone="positive" />
        </div>

        <SectionCard
          title="Income entries"
          description="Filters update the table and summary totals together so the section can act as both a ledger and a reporting view."
          action={
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add income
            </Button>
          }
        >
          <div className="grid gap-4 lg:grid-cols-5">
            <Input
              placeholder="Search payer or notes"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
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
                {orderedIncomeCategories.map((category) => (
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
                    <TableHead>Payer / Client</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Fees</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.received_on)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.payer_client}</p>
                          <p className="text-xs text-muted-foreground">
                            Q{entry.tax_quarter} {entry.tax_year}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {businesses.find((business) => business.id === entry.business_id)?.name ?? "Unknown"}
                      </TableCell>
                      <TableCell>{entry.income_category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.gross_amount, true)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.fees_withheld, true)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(entry.net_received, true)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(entry)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(entry.id)}
                            disabled={deleteMutation.isPending}
                          >
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
                title="No income entries match the current filters"
                description="Add your first payment or broaden the filters to see more results."
              />
            )}
          </div>
        </SectionCard>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-border/70 bg-card">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit income entry" : "Create income entry"}</DialogTitle>
            <DialogDescription>
              Gross, fees, and net are stored separately so you can reconcile deposits and reporting totals.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="received_on">Date received</Label>
                <Input
                  id="received_on"
                  type="date"
                  value={draft.received_on}
                  onChange={(event) => setDraft((current) => ({ ...current, received_on: event.target.value }))}
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
                <Label htmlFor="payer_client">Payer / client</Label>
                <Input
                  id="payer_client"
                  value={draft.payer_client}
                  onChange={(event) => setDraft((current) => ({ ...current, payer_client: event.target.value }))}
                  placeholder="HLC or project client"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Income category</Label>
                <Select
                  value={draft.income_category}
                  onValueChange={(value) => setDraft((current) => ({ ...current, income_category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderedIncomeCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gross_amount">Gross amount</Label>
                <Input
                  id="gross_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.gross_amount}
                  onChange={(event) => setDraft((current) => ({ ...current, gross_amount: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fees_withheld">Fees withheld</Label>
                <Input
                  id="fees_withheld"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.fees_withheld}
                  onChange={(event) => setDraft((current) => ({ ...current, fees_withheld: event.target.value }))}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
              <p className="text-sm text-muted-foreground">Net received</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(netReceived, true)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Optional context, invoice references, or payout notes"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingRow ? "Save changes" : "Create entry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
