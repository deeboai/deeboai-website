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
import { toast } from "@/components/ui/sonner";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { EmptyState } from "@/features/admin/components/empty-state";
import { MetricCard } from "@/features/admin/components/metric-card";
import { SectionCard } from "@/features/admin/components/section-card";
import { DEFAULT_PERSONAL_CATEGORIES } from "@/features/admin/config/defaults";
import { getEntryMonth, sumBy } from "@/features/admin/lib/calculations";
import { deleteRow, listRows, upsertRow } from "@/features/admin/lib/data-client";
import { formatCurrency, formatDate } from "@/features/admin/lib/format";
import type { Database } from "@/types/supabase";

type PersonalCashFlowPageProps = {
  userId: string;
  userEmail: string;
};

type PersonalRow = Database["public"]["Tables"]["personal_cashflow_entries"]["Row"];

type PersonalDraft = {
  entry_date: string;
  category: string;
  subcategory: string;
  amount: string;
  notes: string;
};

const emptyDraft: PersonalDraft = {
  entry_date: new Date().toISOString().slice(0, 10),
  category: "rent",
  subcategory: "",
  amount: "",
  notes: "",
};

function createDraftFromRow(row: PersonalRow): PersonalDraft {
  return {
    entry_date: row.entry_date,
    category: row.category,
    subcategory: row.subcategory ?? "",
    amount: String(row.amount),
    notes: row.notes ?? "",
  };
}

export function PersonalCashFlowPage({ userId, userEmail }: PersonalCashFlowPageProps) {
  const queryClient = useQueryClient();
  const personalQuery = useQuery({
    queryKey: ["personal-cashflow-entries"],
    queryFn: () => listRows("personal_cashflow_entries", { orderBy: "entry_date", ascending: false }),
  });

  const [draft, setDraft] = useState<PersonalDraft>(emptyDraft);
  const [editingRow, setEditingRow] = useState<PersonalRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");

  const entries = personalQuery.data ?? [];
  const amount = Number(draft.amount || 0);

  const filteredEntries = entries.filter((entry) => {
    const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter;
    const matchesMonth = monthFilter === "all" || String(entry.entry_month) === monthFilter;

    return matchesCategory && matchesMonth;
  });

  const totalOutflow = sumBy(filteredEntries, (entry) => entry.amount);
  const monthlyTotals = Array.from({ length: 12 }, (_, index) => {
    const monthNumber = index + 1;
    const monthEntries = filteredEntries.filter((entry) => entry.entry_month === monthNumber);

    return {
      month: new Date(Date.UTC(2025, index, 1)).toLocaleString("en-US", { month: "short" }),
      total: sumBy(monthEntries, (entry) => entry.amount),
    };
  }).filter((item) => item.total > 0);
  const categoryTotals = DEFAULT_PERSONAL_CATEGORIES.map((category) => ({
    category,
    total: sumBy(filteredEntries.filter((entry) => entry.category === category), (entry) => entry.amount),
  })).filter((item) => item.total > 0);
  const largestCategory = [...categoryTotals].sort((left, right) => right.total - left.total)[0];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const monthParts = getEntryMonth(draft.entry_date);

      return upsertRow("personal_cashflow_entries", {
        id: editingRow?.id,
        user_id: userId,
        entry_date: draft.entry_date,
        category: draft.category,
        subcategory: draft.subcategory.trim() || null,
        amount,
        notes: draft.notes.trim() || null,
        entry_month: monthParts.entryMonth,
        entry_year: monthParts.entryYear,
      });
    },
    onSuccess: () => {
      toast.success(editingRow ? "Personal cash-flow entry updated." : "Personal cash-flow entry created.");
      setDialogOpen(false);
      setEditingRow(null);
      setDraft(emptyDraft);
      queryClient.invalidateQueries({ queryKey: ["personal-cashflow-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["tax-planning-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save personal cash-flow entry.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRow("personal_cashflow_entries", id),
    onSuccess: () => {
      toast.success("Personal cash-flow entry deleted.");
      queryClient.invalidateQueries({ queryKey: ["personal-cashflow-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["tax-planning-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete personal cash-flow entry.");
    },
  });

  function openCreateDialog() {
    setEditingRow(null);
    setDraft(emptyDraft);
    setDialogOpen(true);
  }

  function openEditDialog(row: PersonalRow) {
    setEditingRow(row);
    setDraft(createDraftFromRow(row));
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.entry_date || amount <= 0) {
      toast.error("Complete the required personal cash-flow fields before saving.");
      return;
    }

    await saveMutation.mutateAsync();
  }

  return (
    <AdminShell
      title="Personal Cash Flow"
      subtitle="Track real living costs month by month without mixing them into the business deduction ledger."
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Total outflow" value={formatCurrency(totalOutflow)} />
          <MetricCard label="Largest category" value={largestCategory ? largestCategory.category : "None"} />
          <MetricCard label="Recent entries" value={String(filteredEntries.length)} />
        </div>

        <SectionCard
          title="Personal cash-flow ledger"
          description="Use this section for variable living costs like rent, utilities, groceries, parking, and subscriptions."
          action={
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add expense
            </Button>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {DEFAULT_PERSONAL_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {Array.from({ length: 12 }, (_, index) => (
                  <SelectItem key={index + 1} value={String(index + 1)}>
                    {new Date(Date.UTC(2025, index, 1)).toLocaleString("en-US", { month: "long" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-6">
            {filteredEntries.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subcategory</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.entry_date)}</TableCell>
                      <TableCell className="capitalize">{entry.category}</TableCell>
                      <TableCell>{entry.subcategory ?? "—"}</TableCell>
                      <TableCell>{entry.notes ?? "—"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.amount, true)}</TableCell>
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
                title="No personal cash-flow entries yet"
                description="Add rent, utilities, groceries, or other living costs to build your trend view."
              />
            )}
          </div>
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard title="Monthly totals">
            <div className="space-y-3">
              {monthlyTotals.length ? (
                monthlyTotals.map((item) => (
                  <div key={item.month} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <span>{item.month}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                ))
              ) : (
                <EmptyState title="No monthly totals yet" description="Monthly totals will appear once personal entries are added." />
              )}
            </div>
          </SectionCard>

          <SectionCard title="Category totals">
            <div className="space-y-3">
              {categoryTotals.length ? (
                categoryTotals.map((item) => (
                  <div key={item.category} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <span className="capitalize">{item.category}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                ))
              ) : (
                <EmptyState title="No category totals yet" description="Category totals will appear once personal entries are added." />
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-border/70 bg-card">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit personal cash-flow entry" : "Create personal cash-flow entry"}</DialogTitle>
            <DialogDescription>
              This section is intentionally separate from deductible business spending so monthly life costs remain visible.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="entry_date">Date</Label>
                <Input
                  id="entry_date"
                  type="date"
                  value={draft.entry_date}
                  onChange={(event) => setDraft((current) => ({ ...current, entry_date: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={draft.category}
                  onValueChange={(value) => setDraft((current) => ({ ...current, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_PERSONAL_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory</Label>
                <Input
                  id="subcategory"
                  value={draft.subcategory}
                  onChange={(event) => setDraft((current) => ({ ...current, subcategory: event.target.value }))}
                  placeholder="Optional finer-grained bucket"
                />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Optional context like lease month, utility cycle, or one-off reason"
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
