"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { toast } from "@/components/ui/sonner";
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
import { EmptyState } from "@/features/admin/components/empty-state";
import { MetricCard } from "@/features/admin/components/metric-card";
import { SectionCard } from "@/features/admin/components/section-card";
import { DEFAULT_HOUSING_CATEGORIES } from "@/features/admin/config/defaults";
import { useAdminPreference, usePreferredOptions } from "@/features/admin/hooks/use-admin-preferences";
import { getEntryMonth, sumBy } from "@/features/admin/lib/calculations";
import { getLocalDateInputValue } from "@/features/admin/lib/date";
import { deleteRow, upsertRow } from "@/features/admin/lib/data-client";
import { formatCurrency, formatDate } from "@/features/admin/lib/format";
import type { Database } from "@/types/supabase";

type PersonalCashflowRow = Database["public"]["Tables"]["personal_cashflow_entries"]["Row"];

type HousingExpensesSectionProps = {
  entries: PersonalCashflowRow[];
  selectedTaxYear: number;
  userId: string;
};

type HousingExpenseDraft = {
  entry_date: string;
  category: string;
  subcategory: string;
  amount: string;
  notes: string;
};

const HOUSING_CATEGORY_LABELS: Record<string, string> = {
  rent: "Rent",
  electricity: "Electricity",
  utilities: "Utilities",
  internet: "Internet",
  insurance: "Insurance",
  "home maintenance": "Home maintenance",
};

function isHousingCategory(category: string) {
  return DEFAULT_HOUSING_CATEGORIES.includes(category as (typeof DEFAULT_HOUSING_CATEGORIES)[number]);
}

function getDefaultEntryDate(selectedTaxYear: number) {
  const today = new Date();

  if (selectedTaxYear === today.getFullYear()) {
    return getLocalDateInputValue(today);
  }

  return `${selectedTaxYear}-01-01`;
}

function buildEmptyDraft(selectedTaxYear: number): HousingExpenseDraft {
  return {
    entry_date: getDefaultEntryDate(selectedTaxYear),
    category: "rent",
    subcategory: "",
    amount: "",
    notes: "",
  };
}

function createDraftFromRow(row: PersonalCashflowRow): HousingExpenseDraft {
  return {
    entry_date: row.entry_date,
    category: row.category,
    subcategory: row.subcategory ?? "",
    amount: String(row.amount),
    notes: row.notes ?? "",
  };
}

export function HousingExpensesSection({
  entries,
  selectedTaxYear,
  userId,
}: HousingExpensesSectionProps) {
  const queryClient = useQueryClient();
  const { storedValue: preferredHousingCategory, rememberValue: rememberHousingCategory } = useAdminPreference("housing.category");
  const [draft, setDraft] = useState<HousingExpenseDraft>(() => buildEmptyDraft(selectedTaxYear));
  const [editingRow, setEditingRow] = useState<PersonalCashflowRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const orderedHousingCategories = usePreferredOptions(
    [...DEFAULT_HOUSING_CATEGORIES],
    (category) => category,
    preferredHousingCategory,
  );

  const housingEntries = useMemo(
    () =>
      entries.filter(
        (entry) => entry.entry_year === selectedTaxYear && isHousingCategory(entry.category),
      ),
    [entries, selectedTaxYear],
  );
  const amount = Number(draft.amount || 0);
  const totalHousingSpend = sumBy(housingEntries, (entry) => entry.amount);
  const monthsLogged = new Set(housingEntries.map((entry) => entry.entry_month)).size;
  const categoryTotals = DEFAULT_HOUSING_CATEGORIES.map((category) => ({
    category,
    label: HOUSING_CATEGORY_LABELS[category],
    total: sumBy(housingEntries.filter((entry) => entry.category === category), (entry) => entry.amount),
  })).filter((item) => item.total > 0);

  useEffect(() => {
    if (dialogOpen && !editingRow) {
      setDraft({
        ...buildEmptyDraft(selectedTaxYear),
        category: preferredHousingCategory || "rent",
      });
    }
  }, [dialogOpen, editingRow, preferredHousingCategory, selectedTaxYear]);

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
      rememberHousingCategory(draft.category);
      toast.success(editingRow ? "Housing expense updated." : "Housing expense created.");
      setDialogOpen(false);
      setEditingRow(null);
      setDraft(buildEmptyDraft(selectedTaxYear));
      // The legacy housing editor can now render inside /admin/housing, so refresh both the shared
      // personal-cash-flow query and the Housing page container after every mutation.
      queryClient.invalidateQueries({ queryKey: ["personal-cashflow-entries"] });
      queryClient.invalidateQueries({ queryKey: ["housing-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["tax-planning-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save housing expense.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRow("personal_cashflow_entries", id),
    onSuccess: () => {
      toast.success("Housing expense deleted.");
      queryClient.invalidateQueries({ queryKey: ["personal-cashflow-entries"] });
      queryClient.invalidateQueries({ queryKey: ["housing-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["tax-planning-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete housing expense.");
    },
  });

  function openCreateDialog() {
    setEditingRow(null);
    setDraft({
      ...buildEmptyDraft(selectedTaxYear),
      category: preferredHousingCategory || "rent",
    });
    setDialogOpen(true);
  }

  function openEditDialog(row: PersonalCashflowRow) {
    setEditingRow(row);
    setDraft(createDraftFromRow(row));
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.entry_date || !isHousingCategory(draft.category) || amount <= 0) {
      toast.error("Complete the required housing fields before saving.");
      return;
    }

    await saveMutation.mutateAsync();
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Housing spend logged"
          value={formatCurrency(totalHousingSpend)}
          helper={`Shared home costs recorded for ${selectedTaxYear}`}
        />
        <MetricCard
          label="Months with entries"
          value={`${monthsLogged}/12`}
          helper="The home-office calculation uses these entries before any manual fallback amounts"
        />
        <MetricCard
          label="Tracked categories"
          value={String(categoryTotals.length)}
          helper="Rent, utilities, internet, insurance, and home maintenance stay separated"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <SectionCard
          title="Monthly housing expenses"
          description="This replaces the old personal-cash-flow workflow for home-office support. Existing housing entries already saved there are preserved and shown here."
          action={
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add housing expense
            </Button>
          }
        >
          {housingEntries.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {housingEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.entry_date)}</TableCell>
                    <TableCell>{HOUSING_CATEGORY_LABELS[entry.category] ?? entry.category}</TableCell>
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
              title="No housing costs logged yet"
              description="Add monthly rent, utilities, internet, insurance, or home-maintenance entries here so the home-office calculation can use real amounts."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Category totals"
          description="These totals feed the home-office allocation summary for the selected tax year."
        >
          <div className="space-y-3">
            {categoryTotals.length ? (
              categoryTotals.map((item) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3"
                >
                  <span>{item.label}</span>
                  <span className="font-medium">{formatCurrency(item.total)}</span>
                </div>
              ))
            ) : (
              <EmptyState
                title="No housing totals yet"
                description="Totals appear here after you add housing entries for the selected year."
              />
            )}
          </div>
        </SectionCard>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-border/70 bg-card">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit housing expense" : "Create housing expense"}</DialogTitle>
            <DialogDescription>
              Use one row per actual housing charge. The home-office deduction will allocate the shared amount automatically.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="housing_entry_date">Date</Label>
                <Input
                  id="housing_entry_date"
                  type="date"
                  value={draft.entry_date}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, entry_date: event.target.value }))
                  }
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
                    {orderedHousingCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {HOUSING_CATEGORY_LABELS[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="housing_subcategory">Detail</Label>
                <Input
                  id="housing_subcategory"
                  value={draft.subcategory}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, subcategory: event.target.value }))
                  }
                  placeholder="April bill, Xcel, renters insurance"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="housing_amount">Amount</Label>
                <Input
                  id="housing_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.amount}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, amount: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="housing_notes">Notes</Label>
                <Textarea
                  id="housing_notes"
                  value={draft.notes}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Optional note about the bill, move, or one-time maintenance item"
                />
              </div>
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
    </>
  );
}
