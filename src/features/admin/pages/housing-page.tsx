"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
import { DEFAULT_HOUSING_CATEGORIES } from "@/features/admin/config/defaults";
import { useAdminPreference, usePreferredOptions } from "@/features/admin/hooks/use-admin-preferences";
import { useAdminReferenceData } from "@/features/admin/hooks/use-admin-reference-data";
import { getEntryMonth } from "@/features/admin/lib/calculations";
import { deleteRow, listRows, upsertRow } from "@/features/admin/lib/data-client";
import { getLocalDateInputValue } from "@/features/admin/lib/date";
import { formatCurrency, formatDate, formatPercent } from "@/features/admin/lib/format";
import { calculateHousingDeductionSummary } from "@/features/admin/lib/tax-planning";
import type { Database } from "@/types/supabase";

type HousingPageProps = {
  userId: string;
  userEmail: string;
};

type HousingEntryRow = Database["public"]["Tables"]["housing_deduction_entries"]["Row"];

type HousingEntryDraft = {
  entry_date: string;
  category: string;
  detail: string;
  amount: string;
  home_state: string;
  home_square_feet: string;
  office_square_feet: string;
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

function getDefaultState(referenceData: ReturnType<typeof useAdminReferenceData>["data"]) {
  return (
    referenceData?.profile?.current_state ??
    referenceData?.profile?.home_state ??
    referenceData?.settings?.current_state ??
    referenceData?.settings?.home_state ??
    ""
  );
}

function getDefaultEntryDate(selectedTaxYear: number) {
  const today = new Date();

  if (selectedTaxYear === today.getFullYear()) {
    return getLocalDateInputValue(today);
  }

  return `${selectedTaxYear}-01-01`;
}

function buildEmptyDraft(
  selectedTaxYear: number,
  referenceData: ReturnType<typeof useAdminReferenceData>["data"],
  defaults?: {
    category?: string;
    homeState?: string;
    homeSquareFeet?: string;
    officeSquareFeet?: string;
  },
): HousingEntryDraft {
  return {
    entry_date: getDefaultEntryDate(selectedTaxYear),
    category: defaults?.category || "rent",
    detail: "",
    amount: "",
    home_state: defaults?.homeState || getDefaultState(referenceData),
    home_square_feet: defaults?.homeSquareFeet || "",
    office_square_feet: defaults?.officeSquareFeet || "",
    notes: "",
  };
}

function createDraftFromRow(row: HousingEntryRow): HousingEntryDraft {
  return {
    entry_date: row.entry_date,
    category: row.category,
    detail: row.detail ?? "",
    amount: String(row.amount),
    home_state: row.home_state ?? "",
    home_square_feet: row.home_square_feet !== null ? String(row.home_square_feet) : "",
    office_square_feet: row.office_square_feet !== null ? String(row.office_square_feet) : "",
    notes: row.notes ?? "",
  };
}

export function HousingPage({ userId, userEmail }: HousingPageProps) {
  const queryClient = useQueryClient();
  const referenceQuery = useAdminReferenceData();
  const currentYear = new Date().getFullYear();
  const [selectedTaxYear, setSelectedTaxYear] = useState(currentYear);
  const { storedValue: preferredCategory, rememberValue: rememberCategory } = useAdminPreference("housing-entry.category");
  const { storedValue: preferredHomeState, rememberValue: rememberHomeState } = useAdminPreference("housing-entry.home-state");
  const { storedValue: preferredHomeSquareFeet, rememberValue: rememberHomeSquareFeet } = useAdminPreference("housing-entry.home-square-feet");
  const { storedValue: preferredOfficeSquareFeet, rememberValue: rememberOfficeSquareFeet } = useAdminPreference("housing-entry.office-square-feet");
  const [draft, setDraft] = useState<HousingEntryDraft>(() =>
    buildEmptyDraft(currentYear, referenceQuery.data, {
      category: preferredCategory ?? undefined,
      homeState: preferredHomeState ?? undefined,
      homeSquareFeet: preferredHomeSquareFeet ?? undefined,
      officeSquareFeet: preferredOfficeSquareFeet ?? undefined,
    }),
  );
  const [editingRow, setEditingRow] = useState<HousingEntryRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const orderedHousingCategories = usePreferredOptions(
    [...DEFAULT_HOUSING_CATEGORIES],
    (category) => category,
    preferredCategory,
  );

  const housingQuery = useQuery({
    queryKey: ["housing-page-data"],
    queryFn: async () => listRows("housing_deduction_entries", { orderBy: "entry_date", ascending: false }),
  });

  const taxYears = useMemo(() => {
    const years = new Set<number>([currentYear - 1, currentYear, currentYear + 1]);
    housingQuery.data?.forEach((row) => years.add(row.entry_year));
    return Array.from(years).sort((left, right) => right - left);
  }, [currentYear, housingQuery.data]);

  const entriesForYear = useMemo(
    () => (housingQuery.data ?? []).filter((entry) => entry.entry_year === selectedTaxYear),
    [housingQuery.data, selectedTaxYear],
  );
  const housingSummary = calculateHousingDeductionSummary(entriesForYear);
  const amount = Number(draft.amount || 0);
  const homeSquareFeet = Number(draft.home_square_feet || 0);
  const officeSquareFeet = Number(draft.office_square_feet || 0);
  const draftOfficeSharePercent = homeSquareFeet > 0 && officeSquareFeet > 0 ? (officeSquareFeet / homeSquareFeet) * 100 : 0;
  const draftDeductibleAmount =
    homeSquareFeet > 0 && officeSquareFeet > 0 && officeSquareFeet <= homeSquareFeet
      ? amount * (officeSquareFeet / homeSquareFeet)
      : 0;

  useEffect(() => {
    if (dialogOpen && !editingRow) {
      setDraft(
        buildEmptyDraft(selectedTaxYear, referenceQuery.data, {
          category: preferredCategory ?? undefined,
          homeState: preferredHomeState ?? undefined,
          homeSquareFeet: preferredHomeSquareFeet ?? undefined,
          officeSquareFeet: preferredOfficeSquareFeet ?? undefined,
        }),
      );
    }
  }, [
    dialogOpen,
    editingRow,
    preferredCategory,
    preferredHomeSquareFeet,
    preferredHomeState,
    preferredOfficeSquareFeet,
    referenceQuery.data,
    selectedTaxYear,
  ]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const monthParts = getEntryMonth(draft.entry_date);

      return upsertRow("housing_deduction_entries", {
        id: editingRow?.id,
        user_id: userId,
        entry_date: draft.entry_date,
        category: draft.category,
        detail: draft.detail.trim() || null,
        amount,
        home_state: draft.home_state.trim() || null,
        home_square_feet: homeSquareFeet || null,
        office_square_feet: officeSquareFeet || null,
        notes: draft.notes.trim() || null,
        entry_month: monthParts.entryMonth,
        entry_year: monthParts.entryYear,
      });
    },
    onSuccess: () => {
      rememberCategory(draft.category);
      rememberHomeState(draft.home_state.trim());
      rememberHomeSquareFeet(draft.home_square_feet);
      rememberOfficeSquareFeet(draft.office_square_feet);
      toast.success(editingRow ? "Housing bill updated." : "Housing bill created.");
      setDialogOpen(false);
      setEditingRow(null);
      setDraft(
        buildEmptyDraft(selectedTaxYear, referenceQuery.data, {
          category: preferredCategory ?? undefined,
          homeState: preferredHomeState ?? undefined,
          homeSquareFeet: preferredHomeSquareFeet ?? undefined,
          officeSquareFeet: preferredOfficeSquareFeet ?? undefined,
        }),
      );
      queryClient.invalidateQueries({ queryKey: ["housing-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["tax-planning-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save the housing bill.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRow("housing_deduction_entries", id),
    onSuccess: () => {
      toast.success("Housing bill deleted.");
      queryClient.invalidateQueries({ queryKey: ["housing-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["tax-planning-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete the housing bill.");
    },
  });

  function openCreateDialog() {
    setEditingRow(null);
    setDraft(
      buildEmptyDraft(selectedTaxYear, referenceQuery.data, {
        category: preferredCategory ?? undefined,
        homeState: preferredHomeState ?? undefined,
        homeSquareFeet: preferredHomeSquareFeet ?? undefined,
        officeSquareFeet: preferredOfficeSquareFeet ?? undefined,
      }),
    );
    setDialogOpen(true);
  }

  function openEditDialog(row: HousingEntryRow) {
    setEditingRow(row);
    setDraft(createDraftFromRow(row));
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.entry_date || !draft.category || amount <= 0) {
      toast.error("Complete the date, category, and amount before saving.");
      return;
    }

    if (homeSquareFeet <= 0 || officeSquareFeet <= 0) {
      toast.error("Enter both the apartment and office square footage for this bill.");
      return;
    }

    if (officeSquareFeet > homeSquareFeet) {
      toast.error("Office square footage cannot be greater than the apartment square footage.");
      return;
    }

    await saveMutation.mutateAsync();
  }

  return (
    <AdminShell
      title="Housing Deduction"
      subtitle="Log each monthly housing bill with the apartment context that was true for that bill. The form remembers your latest state and square-footage inputs so repeated entry stays fast."
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <SectionCard
          title="Tax year"
          description="Housing is kept as a dedicated ledger so changes in apartment size, office size, or state can be captured bill by bill instead of through one fragile default setup."
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <Label htmlFor="selected_housing_tax_year">Tax year</Label>
              <Select value={String(selectedTaxYear)} onValueChange={(value) => setSelectedTaxYear(Number(value))}>
                <SelectTrigger id="selected_housing_tax_year" className="w-full md:w-[220px]">
                  <SelectValue placeholder="Select tax year" />
                </SelectTrigger>
                <SelectContent>
                  {taxYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
              The next entry starts with your most recent category, state, and square-footage values.
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Housing bills logged"
            value={formatCurrency(housingSummary.totalEntered)}
            helper={`Total shared housing costs entered for ${selectedTaxYear}`}
          />
          <MetricCard
            label="Deductible share tracked"
            value={formatCurrency(housingSummary.totalDeductible)}
            helper="Calculated bill by bill from the saved office share for each entry"
          />
          <MetricCard
            label="Months logged"
            value={`${housingSummary.monthsLogged}/12`}
            helper="Unique months with at least one housing bill recorded"
          />
          <MetricCard
            label="Bills missing context"
            value={String(housingSummary.entriesMissingContext)}
            helper="Rows without usable square-footage data will not contribute to the deduction"
            tone={housingSummary.entriesMissingContext ? "warning" : "positive"}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <SectionCard
            title="Monthly housing bills"
            description="Each bill stores its own apartment state and square-footage context. That keeps the deduction history usable even if your housing situation changes later."
            action={
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add housing bill
              </Button>
            }
          >
            {housingSummary.entries.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Detail</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Office share</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Deductible</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {housingSummary.entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.entry_date)}</TableCell>
                      <TableCell>{HOUSING_CATEGORY_LABELS[entry.category] ?? entry.category}</TableCell>
                      <TableCell>{entry.detail ?? "—"}</TableCell>
                      <TableCell>{entry.home_state ?? "—"}</TableCell>
                      <TableCell>{entry.hasContext ? formatPercent(entry.businessUsePercent) : "Missing"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.amount, true)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.deductibleAmount, true)}</TableCell>
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
                title="No housing bills yet"
                description="Add each rent, utility, internet, insurance, or home-maintenance bill here as it happens."
              />
            )}
          </SectionCard>

          <SectionCard
            title="Category totals"
            description="These totals make tax-season review faster without forcing one global apartment setup."
          >
            <div className="space-y-3">
              {housingSummary.categoryTotals.length ? (
                housingSummary.categoryTotals.map((item) => (
                  <div
                    key={item.category}
                    className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <span>{HOUSING_CATEGORY_LABELS[item.category] ?? item.category}</span>
                      <span className="font-medium">{formatCurrency(item.totalEntered)}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Deductible share: {formatCurrency(item.totalDeductible)}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No category totals yet"
                  description="Totals appear here once housing bills are entered for the selected year."
                />
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl rounded-3xl border-border/70 bg-card">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit housing bill" : "Create housing bill"}</DialogTitle>
            <DialogDescription>
              Save the apartment context that was true for this specific bill. The form will remember your latest values for the next entry.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="housing_entry_date">Bill date</Label>
                <Input
                  id="housing_entry_date"
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
                    {orderedHousingCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {HOUSING_CATEGORY_LABELS[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="housing_detail">Detail</Label>
                <Input
                  id="housing_detail"
                  value={draft.detail}
                  onChange={(event) => setDraft((current) => ({ ...current, detail: event.target.value }))}
                  placeholder="April invoice, Xcel bill, renters insurance"
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
                  onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="housing_home_state">Home state</Label>
                <Input
                  id="housing_home_state"
                  value={draft.home_state}
                  onChange={(event) => setDraft((current) => ({ ...current, home_state: event.target.value }))}
                  placeholder="MN or TX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="housing_home_square_feet">Apartment square footage</Label>
                <Input
                  id="housing_home_square_feet"
                  type="number"
                  min="0"
                  step="0.1"
                  value={draft.home_square_feet}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, home_square_feet: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="housing_office_square_feet">Office square footage</Label>
                <Input
                  id="housing_office_square_feet"
                  type="number"
                  min="0"
                  step="0.1"
                  value={draft.office_square_feet}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, office_square_feet: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm">
                <p className="font-medium">Deduction preview</p>
                <p className="mt-2 text-muted-foreground">
                  Office share: {homeSquareFeet > 0 && officeSquareFeet > 0 ? formatPercent(draftOfficeSharePercent) : "Add square footage"}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Deductible amount: {formatCurrency(draftDeductibleAmount, true)}
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="housing_notes">Notes</Label>
                <Textarea
                  id="housing_notes"
                  value={draft.notes}
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Optional note about the bill, apartment context, or a one-off housing charge"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingRow ? "Save changes" : "Create bill"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
