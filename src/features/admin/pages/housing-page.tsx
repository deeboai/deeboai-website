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
import { HousingExpensesSection } from "@/features/admin/components/housing-expenses-section";
import { MetricCard } from "@/features/admin/components/metric-card";
import { SectionCard } from "@/features/admin/components/section-card";
import { useAdminPreference } from "@/features/admin/hooks/use-admin-preferences";
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

type HousingMonthlyEntryRow = Database["public"]["Tables"]["housing_monthly_entries"]["Row"];
type PersonalCashflowRow = Database["public"]["Tables"]["personal_cashflow_entries"]["Row"];

type HousingMonthlyDraft = {
  entry_date: string;
  base_rent: string;
  parking: string;
  utilities: string;
  insurance: string;
  maintenance: string;
  home_state: string;
  home_square_feet: string;
  office_square_feet: string;
  notes: string;
};

const HOUSING_CATEGORY_LABELS: Record<string, string> = {
  rent: "Base rent",
  parking: "Parking",
  utilities: "Utilities",
  insurance: "Insurance",
  maintenance: "Maintenance",
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
    homeState?: string;
    homeSquareFeet?: string;
    officeSquareFeet?: string;
  },
): HousingMonthlyDraft {
  return {
    entry_date: getDefaultEntryDate(selectedTaxYear),
    base_rent: "",
    parking: "",
    utilities: "",
    insurance: "",
    maintenance: "",
    home_state: defaults?.homeState || getDefaultState(referenceData),
    home_square_feet: defaults?.homeSquareFeet || "",
    office_square_feet: defaults?.officeSquareFeet || "",
    notes: "",
  };
}

function createDraftFromRow(row: HousingMonthlyEntryRow): HousingMonthlyDraft {
  return {
    entry_date: row.entry_date,
    base_rent: row.base_rent ? String(row.base_rent) : "",
    parking: row.parking ? String(row.parking) : "",
    utilities: row.utilities ? String(row.utilities) : "",
    insurance: row.insurance ? String(row.insurance) : "",
    maintenance: row.maintenance ? String(row.maintenance) : "",
    home_state: row.home_state ?? "",
    home_square_feet: row.home_square_feet !== null ? String(row.home_square_feet) : "",
    office_square_feet: row.office_square_feet !== null ? String(row.office_square_feet) : "",
    notes: row.notes ?? "",
  };
}

function toAmount(value: string) {
  return Number(value || 0);
}

export function HousingPage({ userId, userEmail }: HousingPageProps) {
  const queryClient = useQueryClient();
  const referenceQuery = useAdminReferenceData();
  const currentYear = new Date().getFullYear();
  const [selectedTaxYear, setSelectedTaxYear] = useState(currentYear);
  const { storedValue: preferredHomeState, rememberValue: rememberHomeState } = useAdminPreference("housing-monthly.home-state");
  const { storedValue: preferredHomeSquareFeet, rememberValue: rememberHomeSquareFeet } = useAdminPreference("housing-monthly.home-square-feet");
  const { storedValue: preferredOfficeSquareFeet, rememberValue: rememberOfficeSquareFeet } = useAdminPreference("housing-monthly.office-square-feet");
  const [draft, setDraft] = useState<HousingMonthlyDraft>(() =>
    buildEmptyDraft(currentYear, referenceQuery.data, {
      homeState: preferredHomeState ?? undefined,
      homeSquareFeet: preferredHomeSquareFeet ?? undefined,
      officeSquareFeet: preferredOfficeSquareFeet ?? undefined,
    }),
  );
  const [editingRow, setEditingRow] = useState<HousingMonthlyEntryRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const housingQuery = useQuery({
    queryKey: ["housing-page-data"],
    queryFn: async () => listRows("housing_monthly_entries", { orderBy: "entry_date", ascending: false }),
  });
  const legacyHousingQuery = useQuery({
    queryKey: ["personal-cashflow-entries"],
    // Legacy housing expenses still live in personal_cashflow_entries, so the Housing page needs to
    // load them here now that the old personal cash-flow route redirects into this screen.
    queryFn: async () => listRows("personal_cashflow_entries", { orderBy: "entry_date", ascending: false }),
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

  const baseRent = toAmount(draft.base_rent);
  const parking = toAmount(draft.parking);
  const utilities = toAmount(draft.utilities);
  const insurance = toAmount(draft.insurance);
  const maintenance = toAmount(draft.maintenance);
  const homeSquareFeet = toAmount(draft.home_square_feet);
  const officeSquareFeet = toAmount(draft.office_square_feet);
  const totalHousingCost = baseRent + parking + utilities + insurance + maintenance;
  const deductibleEligibleCost = baseRent + utilities + insurance + maintenance;
  const draftOfficeSharePercent = homeSquareFeet > 0 && officeSquareFeet > 0 ? (officeSquareFeet / homeSquareFeet) * 100 : 0;
  const draftDeductibleAmount =
    homeSquareFeet > 0 && officeSquareFeet > 0 && officeSquareFeet <= homeSquareFeet
      ? deductibleEligibleCost * (officeSquareFeet / homeSquareFeet)
      : 0;

  useEffect(() => {
    if (dialogOpen && !editingRow) {
      setDraft(
        buildEmptyDraft(selectedTaxYear, referenceQuery.data, {
          homeState: preferredHomeState ?? undefined,
          homeSquareFeet: preferredHomeSquareFeet ?? undefined,
          officeSquareFeet: preferredOfficeSquareFeet ?? undefined,
        }),
      );
    }
  }, [
    dialogOpen,
    editingRow,
    preferredHomeSquareFeet,
    preferredHomeState,
    preferredOfficeSquareFeet,
    referenceQuery.data,
    selectedTaxYear,
  ]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const monthParts = getEntryMonth(draft.entry_date);

      return upsertRow("housing_monthly_entries", {
        id: editingRow?.id,
        user_id: userId,
        entry_date: draft.entry_date,
        base_rent: baseRent,
        parking,
        utilities,
        insurance,
        maintenance,
        home_state: draft.home_state.trim() || null,
        home_square_feet: homeSquareFeet || null,
        office_square_feet: officeSquareFeet || null,
        notes: draft.notes.trim() || null,
        entry_month: monthParts.entryMonth,
        entry_year: monthParts.entryYear,
      });
    },
    onSuccess: () => {
      rememberHomeState(draft.home_state.trim());
      rememberHomeSquareFeet(draft.home_square_feet);
      rememberOfficeSquareFeet(draft.office_square_feet);
      toast.success(editingRow ? "Monthly housing row updated." : "Monthly housing row created.");
      setDialogOpen(false);
      setEditingRow(null);
      setDraft(
        buildEmptyDraft(selectedTaxYear, referenceQuery.data, {
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
      toast.error(error instanceof Error ? error.message : "Unable to save the housing row.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRow("housing_monthly_entries", id),
    onSuccess: () => {
      toast.success("Monthly housing row deleted.");
      queryClient.invalidateQueries({ queryKey: ["housing-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["tax-planning-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete the housing row.");
    },
  });

  function openCreateDialog() {
    setEditingRow(null);
    setDraft(
      buildEmptyDraft(selectedTaxYear, referenceQuery.data, {
        homeState: preferredHomeState ?? undefined,
        homeSquareFeet: preferredHomeSquareFeet ?? undefined,
        officeSquareFeet: preferredOfficeSquareFeet ?? undefined,
      }),
    );
    setDialogOpen(true);
  }

  function openEditDialog(row: HousingMonthlyEntryRow) {
    setEditingRow(row);
    setDraft(createDraftFromRow(row));
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.entry_date) {
      toast.error("Pick the month for this housing row before saving.");
      return;
    }

    if (totalHousingCost <= 0) {
      toast.error("Enter at least one monthly housing amount before saving.");
      return;
    }

    if (homeSquareFeet <= 0 || officeSquareFeet <= 0) {
      toast.error("Enter both the apartment and office square footage for this month.");
      return;
    }

    if (officeSquareFeet > homeSquareFeet) {
      toast.error("Office square footage cannot be greater than the apartment square footage.");
      return;
    }

    const monthParts = getEntryMonth(draft.entry_date);
    const existingRowForMonth = housingQuery.data?.find(
      (row) =>
        row.entry_year === monthParts.entryYear &&
        row.entry_month === monthParts.entryMonth &&
        row.id !== editingRow?.id,
    );

    if (existingRowForMonth) {
      toast.error("That month already has a housing row. Edit the existing month instead of creating a duplicate.");
      return;
    }

    await saveMutation.mutateAsync();
  }

  return (
    <AdminShell
      title="Housing Deduction"
      subtitle="Keep one monthly row for shared housing costs. Rent, utilities, insurance, and maintenance feed the home-office deduction; parking is tracked separately and excluded from the deduction by default."
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <SectionCard
          title="Tax year"
          description="The housing tab is now a monthly worksheet instead of a category-by-category ledger. Each month keeps the state and square-footage context that was true when the bill was paid."
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
              The next month starts with your most recent state and square-footage values.
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Housing costs logged"
            value={formatCurrency(housingSummary.totalEntered)}
            helper={`All monthly housing totals entered for ${selectedTaxYear}`}
          />
          <MetricCard
            label="Deductible-eligible costs"
            value={formatCurrency(housingSummary.totalEligible)}
            helper="Rent, utilities, insurance, and maintenance tracked for the actual-expense method"
          />
          <MetricCard
            label="Deductible share tracked"
            value={formatCurrency(housingSummary.totalDeductible)}
            helper="Calculated month by month from the office share saved on each row"
          />
          <MetricCard
            label="Months logged"
            value={`${housingSummary.monthsLogged}/12`}
            helper="Unique months with a housing row recorded"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <SectionCard
            title="Monthly housing rows"
            description="IRS actual-expense home-office support generally centers on rent, utilities/services, insurance, and repairs or maintenance. Parking is kept here for your records but is excluded from the deduction by default."
            action={
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add bill
              </Button>
            }
          >
            {housingSummary.entries.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Rent</TableHead>
                      <TableHead className="text-right">Parking</TableHead>
                      <TableHead className="text-right">Utilities</TableHead>
                      <TableHead className="text-right">Insurance</TableHead>
                      <TableHead className="text-right">Maintenance</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Office share</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Deductible</TableHead>
                      <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {housingSummary.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDate(entry.entry_date)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(entry.base_rent, true)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(entry.parking, true)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(entry.utilities, true)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(entry.insurance, true)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(entry.maintenance, true)}</TableCell>
                        <TableCell>{entry.home_state ?? "—"}</TableCell>
                        <TableCell>{entry.hasContext ? formatPercent(entry.businessUsePercent) : "Missing"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(entry.totalEntered, true)}</TableCell>
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
              </div>
            ) : (
              <EmptyState
                title="No housing rows yet"
                description="Add one row per month with rent, parking, utilities, insurance, and maintenance totals."
              />
            )}
          </SectionCard>

          <SectionCard
            title="Category totals"
            description="This keeps tax-season review simple without forcing you to enter each category as a separate row."
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
                  description="Totals appear here once monthly housing rows are entered for the selected year."
                />
              )}
            </div>
          </SectionCard>
        </div>

        <HousingExpensesSection
          entries={(legacyHousingQuery.data ?? []) as PersonalCashflowRow[]}
          selectedTaxYear={selectedTaxYear}
          userId={userId}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl rounded-3xl border-border/70 bg-card">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit monthly housing row" : "Create monthly housing row"}</DialogTitle>
            <DialogDescription>
              Enter one row per month. The home-office deduction uses rent, utilities, insurance, and maintenance. Parking is tracked here but excluded from the deduction by default.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="housing_entry_date">Month</Label>
                <Input
                  id="housing_entry_date"
                  type="date"
                  value={draft.entry_date}
                  onChange={(event) => setDraft((current) => ({ ...current, entry_date: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="housing_base_rent">Base rent</Label>
                <Input
                  id="housing_base_rent"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.base_rent}
                  onChange={(event) => setDraft((current) => ({ ...current, base_rent: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="housing_parking">Parking</Label>
                <Input
                  id="housing_parking"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.parking}
                  onChange={(event) => setDraft((current) => ({ ...current, parking: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="housing_utilities">Utilities</Label>
                <Input
                  id="housing_utilities"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.utilities}
                  onChange={(event) => setDraft((current) => ({ ...current, utilities: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="housing_insurance">Insurance</Label>
                <Input
                  id="housing_insurance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.insurance}
                  onChange={(event) => setDraft((current) => ({ ...current, insurance: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="housing_maintenance">Maintenance</Label>
                <Input
                  id="housing_maintenance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.maintenance}
                  onChange={(event) => setDraft((current) => ({ ...current, maintenance: event.target.value }))}
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
              <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm md:col-span-2 xl:col-span-3">
                <p className="font-medium">Deduction preview</p>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <p className="text-muted-foreground">
                    Total housing tracked: {formatCurrency(totalHousingCost, true)}
                  </p>
                  <p className="text-muted-foreground">
                    Deductible-eligible total: {formatCurrency(deductibleEligibleCost, true)}
                  </p>
                  <p className="text-muted-foreground">
                    Office share: {homeSquareFeet > 0 && officeSquareFeet > 0 ? formatPercent(draftOfficeSharePercent) : "Add square footage"}
                  </p>
                </div>
                <p className="mt-2 text-muted-foreground">
                  Estimated deductible amount: {formatCurrency(draftDeductibleAmount, true)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Parking is excluded from the home-office deduction by default because it is not a standard Form 8829 home-office category.
                </p>
              </div>
              <div className="space-y-2 md:col-span-2 xl:col-span-3">
                <Label htmlFor="housing_notes">Notes</Label>
                <Textarea
                  id="housing_notes"
                  value={draft.notes}
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Optional note about the month, invoice, or any unusual housing charge"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingRow ? "Save changes" : "Create month"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
