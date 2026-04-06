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
import { useAdminReferenceData } from "@/features/admin/hooks/use-admin-reference-data";
import { deleteRow, listRows, upsertRow } from "@/features/admin/lib/data-client";
import { formatCurrency, formatPercent } from "@/features/admin/lib/format";
import {
  calculateHomeOfficeSummaryFromEntries,
  calculateQuarterlyRisk,
  getStateReserveSuggestionPercent,
} from "@/features/admin/lib/tax-planning";
import type { FilingStatus, HomeOfficeMethodPreference } from "@/types/admin";
import type { Database } from "@/types/supabase";

type TaxPlanningPageProps = {
  userId: string;
  userEmail: string;
};

type TaxPlanningRow = Database["public"]["Tables"]["tax_planning_profiles"]["Row"];
type HomeOfficeRow = Database["public"]["Tables"]["home_office_profiles"]["Row"];
type HomeOfficeSpacePeriodRow = Database["public"]["Tables"]["home_office_space_periods"]["Row"];

type TaxPlanningDraft = {
  tax_year: string;
  filing_status: FilingStatus;
  home_state: string;
  prior_year_agi: string;
  prior_year_federal_total_tax: string;
  prior_year_state_total_tax: string;
  annual_w2_withholding_expected: string;
  annual_other_withholding_expected: string;
  tax_season_reviewed_at: string;
  notes: string;
};

type HomeOfficeDraft = {
  tax_year: string;
  home_state: string;
  method_preference: HomeOfficeMethodPreference;
  exclusive_use_confirmed: boolean;
  principal_place_confirmed: boolean;
  home_square_feet: string;
  office_square_feet: string;
  qualifying_months: string;
  monthly_rent: string;
  monthly_utilities: string;
  monthly_internet: string;
  monthly_renters_insurance: string;
  monthly_home_maintenance: string;
  direct_office_expenses: string;
  notes: string;
};

type SpacePeriodDraft = {
  effective_from: string;
  effective_to: string;
  home_square_feet: string;
  office_square_feet: string;
  notes: string;
};

const FILING_STATUS_OPTIONS: Array<{ label: string; value: FilingStatus }> = [
  { label: "Single", value: "single" },
  { label: "Married filing jointly", value: "married_filing_jointly" },
  { label: "Married filing separately", value: "married_filing_separately" },
  { label: "Head of household", value: "head_of_household" },
];

const METHOD_OPTIONS: Array<{ label: string; value: HomeOfficeMethodPreference }> = [
  { label: "Auto compare both methods", value: "auto" },
  { label: "Simplified method", value: "simplified" },
  { label: "Regular method", value: "regular" },
];

const emptySpacePeriodDraft: SpacePeriodDraft = {
  effective_from: new Date().toISOString().slice(0, 10),
  effective_to: "",
  home_square_feet: "",
  office_square_feet: "",
  notes: "",
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

function buildTaxPlanningDraft(
  row: TaxPlanningRow | null,
  selectedTaxYear: number,
  referenceData: ReturnType<typeof useAdminReferenceData>["data"],
): TaxPlanningDraft {
  return {
    tax_year: String(selectedTaxYear),
    filing_status: row?.filing_status ?? "single",
    home_state: row?.home_state ?? getDefaultState(referenceData),
    prior_year_agi: row?.prior_year_agi !== null && row?.prior_year_agi !== undefined ? String(row.prior_year_agi) : "",
    prior_year_federal_total_tax:
      row?.prior_year_federal_total_tax !== null && row?.prior_year_federal_total_tax !== undefined
        ? String(row.prior_year_federal_total_tax)
        : "",
    prior_year_state_total_tax:
      row?.prior_year_state_total_tax !== null && row?.prior_year_state_total_tax !== undefined
        ? String(row.prior_year_state_total_tax)
        : "",
    annual_w2_withholding_expected:
      row?.annual_w2_withholding_expected !== null && row?.annual_w2_withholding_expected !== undefined
        ? String(row.annual_w2_withholding_expected)
        : "0",
    annual_other_withholding_expected:
      row?.annual_other_withholding_expected !== null && row?.annual_other_withholding_expected !== undefined
        ? String(row.annual_other_withholding_expected)
        : "0",
    tax_season_reviewed_at: row?.tax_season_reviewed_at ?? "",
    notes: row?.notes ?? "",
  };
}

function buildHomeOfficeDraft(
  row: HomeOfficeRow | null,
  selectedTaxYear: number,
  referenceData: ReturnType<typeof useAdminReferenceData>["data"],
): HomeOfficeDraft {
  return {
    tax_year: String(selectedTaxYear),
    home_state: row?.home_state ?? getDefaultState(referenceData),
    method_preference: row?.method_preference ?? "auto",
    exclusive_use_confirmed: row?.exclusive_use_confirmed ?? false,
    principal_place_confirmed: row?.principal_place_confirmed ?? false,
    home_square_feet: row?.home_square_feet !== null && row?.home_square_feet !== undefined ? String(row.home_square_feet) : "",
    office_square_feet:
      row?.office_square_feet !== null && row?.office_square_feet !== undefined ? String(row.office_square_feet) : "",
    qualifying_months: String(row?.qualifying_months ?? 12),
    monthly_rent: String(row?.monthly_rent ?? 0),
    monthly_utilities: String(row?.monthly_utilities ?? 0),
    monthly_internet: String(row?.monthly_internet ?? 0),
    monthly_renters_insurance: String(row?.monthly_renters_insurance ?? 0),
    monthly_home_maintenance: String(row?.monthly_home_maintenance ?? 0),
    direct_office_expenses: String(row?.direct_office_expenses ?? 0),
    notes: row?.notes ?? "",
  };
}

function buildPlanningPreviewRow(draft: TaxPlanningDraft, userId: string, rowId?: string): TaxPlanningRow {
  return {
    id: rowId ?? "preview",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: userId,
    tax_year: Number(draft.tax_year),
    filing_status: draft.filing_status,
    home_state: draft.home_state.trim() || null,
    prior_year_agi: draft.prior_year_agi ? Number(draft.prior_year_agi) : null,
    prior_year_federal_total_tax: draft.prior_year_federal_total_tax ? Number(draft.prior_year_federal_total_tax) : null,
    prior_year_state_total_tax: draft.prior_year_state_total_tax ? Number(draft.prior_year_state_total_tax) : null,
    annual_w2_withholding_expected: Number(draft.annual_w2_withholding_expected || 0),
    annual_other_withholding_expected: Number(draft.annual_other_withholding_expected || 0),
    tax_season_reviewed_at: draft.tax_season_reviewed_at || null,
    notes: draft.notes.trim() || null,
  };
}

function buildHomeOfficePreviewRow(draft: HomeOfficeDraft, userId: string, rowId?: string): HomeOfficeRow {
  return {
    id: rowId ?? "preview",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: userId,
    tax_year: Number(draft.tax_year),
    home_state: draft.home_state.trim() || null,
    method_preference: draft.method_preference,
    exclusive_use_confirmed: draft.exclusive_use_confirmed,
    principal_place_confirmed: draft.principal_place_confirmed,
    home_square_feet: draft.home_square_feet ? Number(draft.home_square_feet) : null,
    office_square_feet: draft.office_square_feet ? Number(draft.office_square_feet) : null,
    qualifying_months: Number(draft.qualifying_months || 12),
    monthly_rent: Number(draft.monthly_rent || 0),
    monthly_utilities: Number(draft.monthly_utilities || 0),
    monthly_internet: Number(draft.monthly_internet || 0),
    monthly_renters_insurance: Number(draft.monthly_renters_insurance || 0),
    monthly_home_maintenance: Number(draft.monthly_home_maintenance || 0),
    direct_office_expenses: Number(draft.direct_office_expenses || 0),
    notes: draft.notes.trim() || null,
  };
}

function createSpacePeriodDraftFromRow(row: HomeOfficeSpacePeriodRow): SpacePeriodDraft {
  return {
    effective_from: row.effective_from,
    effective_to: row.effective_to ?? "",
    home_square_feet: String(row.home_square_feet),
    office_square_feet: String(row.office_square_feet),
    notes: row.notes ?? "",
  };
}

export function TaxPlanningPage({ userId, userEmail }: TaxPlanningPageProps) {
  const queryClient = useQueryClient();
  const referenceQuery = useAdminReferenceData();
  const currentYear = new Date().getFullYear();
  const [selectedTaxYear, setSelectedTaxYear] = useState(currentYear);
  const [planningDraft, setPlanningDraft] = useState<TaxPlanningDraft>(
    buildTaxPlanningDraft(null, currentYear, referenceQuery.data),
  );
  const [homeOfficeDraft, setHomeOfficeDraft] = useState<HomeOfficeDraft>(
    buildHomeOfficeDraft(null, currentYear, referenceQuery.data),
  );
  const [spacePeriodDraft, setSpacePeriodDraft] = useState<SpacePeriodDraft>(emptySpacePeriodDraft);
  const [editingSpacePeriod, setEditingSpacePeriod] = useState<HomeOfficeSpacePeriodRow | null>(null);
  const [spaceDialogOpen, setSpaceDialogOpen] = useState(false);

  const planningQuery = useQuery({
    queryKey: ["tax-planning-page-data"],
    queryFn: async () => {
      const [planningProfiles, homeOfficeProfiles, taxReserves, w2Paychecks, personalCashflowEntries, homeOfficeSpacePeriods] = await Promise.all([
        listRows("tax_planning_profiles", { orderBy: "tax_year", ascending: false }),
        listRows("home_office_profiles", { orderBy: "tax_year", ascending: false }),
        listRows("tax_reserves", { orderBy: "reserve_date", ascending: false }),
        listRows("w2_paychecks", { orderBy: "pay_date", ascending: false }),
        listRows("personal_cashflow_entries", { orderBy: "entry_date", ascending: false }),
        listRows("home_office_space_periods", { orderBy: "effective_from", ascending: false }),
      ]);

      return {
        planningProfiles,
        homeOfficeProfiles,
        taxReserves,
        w2Paychecks,
        personalCashflowEntries,
        homeOfficeSpacePeriods,
      };
    },
  });

  const selectedPlanningRow =
    planningQuery.data?.planningProfiles.find((row) => row.tax_year === selectedTaxYear) ?? null;
  const selectedHomeOfficeRow =
    planningQuery.data?.homeOfficeProfiles.find((row) => row.tax_year === selectedTaxYear) ?? null;
  const relevantSpacePeriods =
    (planningQuery.data?.homeOfficeSpacePeriods ?? []).filter((row) => {
      const rowStart = new Date(`${row.effective_from}T00:00:00.000Z`);
      const rowEnd = row.effective_to
        ? new Date(`${row.effective_to}T23:59:59.999Z`)
        : new Date(Date.UTC(selectedTaxYear, 11, 31, 23, 59, 59, 999));
      const yearStart = new Date(Date.UTC(selectedTaxYear, 0, 1));
      const yearEnd = new Date(Date.UTC(selectedTaxYear, 11, 31, 23, 59, 59, 999));

      return rowStart <= yearEnd && rowEnd >= yearStart;
    }) ?? [];

  useEffect(() => {
    setPlanningDraft(buildTaxPlanningDraft(selectedPlanningRow, selectedTaxYear, referenceQuery.data));
    setHomeOfficeDraft(buildHomeOfficeDraft(selectedHomeOfficeRow, selectedTaxYear, referenceQuery.data));
  }, [selectedPlanningRow, selectedHomeOfficeRow, selectedTaxYear, referenceQuery.data]);

  const taxYears = useMemo(() => {
    const years = new Set<number>([currentYear - 1, currentYear, currentYear + 1]);
    planningQuery.data?.planningProfiles.forEach((row) => years.add(row.tax_year));
    planningQuery.data?.homeOfficeProfiles.forEach((row) => years.add(row.tax_year));
    return Array.from(years).sort((left, right) => right - left);
  }, [currentYear, planningQuery.data]);

  const planningPreview = buildPlanningPreviewRow(planningDraft, userId, selectedPlanningRow?.id);
  const homeOfficePreview = buildHomeOfficePreviewRow(homeOfficeDraft, userId, selectedHomeOfficeRow?.id);
  // The preview objects let the page recalculate alerts live while the user edits inputs, before saving.
  const quarterlyRisk = calculateQuarterlyRisk(
    planningPreview,
    planningQuery.data?.taxReserves ?? [],
    planningQuery.data?.w2Paychecks ?? [],
  );
  const homeOfficeSummary = calculateHomeOfficeSummaryFromEntries(
    homeOfficePreview,
    planningQuery.data?.personalCashflowEntries ?? [],
    planningQuery.data?.homeOfficeSpacePeriods ?? [],
  );
  const stateReserveSuggestion = getStateReserveSuggestionPercent(planningDraft.home_state);

  const planningMutation = useMutation({
    mutationFn: async () =>
      upsertRow("tax_planning_profiles", {
        id: selectedPlanningRow?.id,
        user_id: userId,
        tax_year: Number(planningDraft.tax_year),
        filing_status: planningDraft.filing_status,
        home_state: planningDraft.home_state.trim() || null,
        prior_year_agi: planningDraft.prior_year_agi ? Number(planningDraft.prior_year_agi) : null,
        prior_year_federal_total_tax: planningDraft.prior_year_federal_total_tax
          ? Number(planningDraft.prior_year_federal_total_tax)
          : null,
        prior_year_state_total_tax: planningDraft.prior_year_state_total_tax
          ? Number(planningDraft.prior_year_state_total_tax)
          : null,
        annual_w2_withholding_expected: Number(planningDraft.annual_w2_withholding_expected || 0),
        annual_other_withholding_expected: Number(planningDraft.annual_other_withholding_expected || 0),
        tax_season_reviewed_at: planningDraft.tax_season_reviewed_at || null,
        notes: planningDraft.notes.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Tax planning inputs updated.");
      queryClient.invalidateQueries({ queryKey: ["tax-planning-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save tax planning inputs.");
    },
  });

  const homeOfficeMutation = useMutation({
    mutationFn: async () =>
      upsertRow("home_office_profiles", {
        id: selectedHomeOfficeRow?.id,
        user_id: userId,
        tax_year: Number(homeOfficeDraft.tax_year),
        home_state: homeOfficeDraft.home_state.trim() || null,
        method_preference: homeOfficeDraft.method_preference,
        exclusive_use_confirmed: homeOfficeDraft.exclusive_use_confirmed,
        principal_place_confirmed: homeOfficeDraft.principal_place_confirmed,
        home_square_feet: homeOfficeDraft.home_square_feet ? Number(homeOfficeDraft.home_square_feet) : null,
        office_square_feet: homeOfficeDraft.office_square_feet ? Number(homeOfficeDraft.office_square_feet) : null,
        qualifying_months: Number(homeOfficeDraft.qualifying_months || 12),
        monthly_rent: Number(homeOfficeDraft.monthly_rent || 0),
        monthly_utilities: Number(homeOfficeDraft.monthly_utilities || 0),
        monthly_internet: Number(homeOfficeDraft.monthly_internet || 0),
        monthly_renters_insurance: Number(homeOfficeDraft.monthly_renters_insurance || 0),
        monthly_home_maintenance: Number(homeOfficeDraft.monthly_home_maintenance || 0),
        direct_office_expenses: Number(homeOfficeDraft.direct_office_expenses || 0),
        notes: homeOfficeDraft.notes.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Home office inputs updated.");
      queryClient.invalidateQueries({ queryKey: ["tax-planning-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save home office inputs.");
    },
  });

  const spacePeriodMutation = useMutation({
    mutationFn: async () =>
      upsertRow("home_office_space_periods", {
        id: editingSpacePeriod?.id,
        user_id: userId,
        effective_from: spacePeriodDraft.effective_from,
        effective_to: spacePeriodDraft.effective_to || null,
        home_square_feet: Number(spacePeriodDraft.home_square_feet || 0),
        office_square_feet: Number(spacePeriodDraft.office_square_feet || 0),
        notes: spacePeriodDraft.notes.trim() || null,
      }),
    onSuccess: () => {
      toast.success(editingSpacePeriod ? "Space period updated." : "Space period created.");
      setEditingSpacePeriod(null);
      setSpacePeriodDraft(emptySpacePeriodDraft);
      setSpaceDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tax-planning-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save the space period.");
    },
  });

  const deleteSpacePeriodMutation = useMutation({
    mutationFn: (id: string) => deleteRow("home_office_space_periods", id),
    onSuccess: () => {
      toast.success("Space period deleted.");
      queryClient.invalidateQueries({ queryKey: ["tax-planning-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete the space period.");
    },
  });

  function openCreateSpaceDialog() {
    setEditingSpacePeriod(null);
    setSpacePeriodDraft(emptySpacePeriodDraft);
    setSpaceDialogOpen(true);
  }

  function openEditSpaceDialog(row: HomeOfficeSpacePeriodRow) {
    setEditingSpacePeriod(row);
    setSpacePeriodDraft(createSpacePeriodDraftFromRow(row));
    setSpaceDialogOpen(true);
  }

  async function handleSpacePeriodSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !spacePeriodDraft.effective_from ||
      Number(spacePeriodDraft.home_square_feet || 0) <= 0 ||
      Number(spacePeriodDraft.office_square_feet || 0) <= 0
    ) {
      toast.error("Complete the effective date and square-footage fields before saving the space period.");
      return;
    }

    if (
      spacePeriodDraft.effective_to &&
      new Date(`${spacePeriodDraft.effective_to}T00:00:00.000Z`) <
        new Date(`${spacePeriodDraft.effective_from}T00:00:00.000Z`)
    ) {
      toast.error("The end date must be on or after the effective date.");
      return;
    }

    if (Number(spacePeriodDraft.office_square_feet || 0) > Number(spacePeriodDraft.home_square_feet || 0)) {
      toast.error("Office square footage cannot be greater than total home square footage.");
      return;
    }

    await spacePeriodMutation.mutateAsync();
  }

  return (
    <AdminShell
      title="Tax Planning"
      subtitle="Track quarterly safe-harbor risk, annual withholding context, and a home-office deduction calculation from your actual housing costs."
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <SectionCard
          title="Planning year"
          description="Each planning year stores the numbers you enter after filing the prior year's return, plus your current-year withholding assumptions."
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <Label htmlFor="selected_tax_year">Planning year</Label>
              <Select value={String(selectedTaxYear)} onValueChange={(value) => setSelectedTaxYear(Number(value))}>
                <SelectTrigger id="selected_tax_year" className="w-full md:w-[220px]">
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
              After you file your {selectedTaxYear - 1} return, update this page so the quarterly-risk alerts use your latest filed numbers.
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Federal safe-harbor gap"
            value={
              quarterlyRisk
                ? quarterlyRisk.federalGap > 0
                  ? formatCurrency(quarterlyRisk.federalGap)
                  : "On track"
                : "Add inputs"
            }
            helper={
              quarterlyRisk
                ? `${quarterlyRisk.installmentsDue} installment${quarterlyRisk.installmentsDue === 1 ? "" : "s"} due so far`
                : "Add prior-year federal tax and current-year withholding"
            }
            tone={quarterlyRisk?.federalGap ? "warning" : "positive"}
          />
          <MetricCard
            label="State safe-harbor gap"
            value={
              quarterlyRisk
                ? quarterlyRisk.annualStateSafeHarbor > 0
                  ? quarterlyRisk.stateGap > 0
                    ? formatCurrency(quarterlyRisk.stateGap)
                    : "On track"
                  : "No state estimate"
                : "Add inputs"
            }
            helper={
              planningDraft.home_state.trim().toUpperCase() === "MN"
                ? "Minnesota uses the prior-year state liability as the planning baseline here"
                : "Texas and most non-Minnesota states are not calculated in this version"
            }
            tone={quarterlyRisk?.stateGap ? "warning" : "positive"}
          />
          <MetricCard
            label="Withholding counted by now"
            value={quarterlyRisk ? formatCurrency(quarterlyRisk.pacedWithholdingByNow) : "Add inputs"}
            helper="Expected annual withholding is paced evenly across the year for safe-harbor tracking"
          />
          <MetricCard
            label="State-aware reserve starting point"
            value={formatPercent(stateReserveSuggestion)}
            helper="This is a planning suggestion, not a filing rule"
            tone={stateReserveSuggestion > 30 ? "warning" : "default"}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <SectionCard
            title="Quarterly-risk inputs"
          description="Enter these after filing the prior year's return. Federal safe-harbor tracking relies on prior-year tax, prior-year AGI, your entered W-2 paychecks, and any extra withholding you expect outside that paycheck ledger."
          >
            <form
              className="grid gap-5 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                planningMutation.mutate();
              }}
            >
              <div className="space-y-2">
                <Label>Filing status</Label>
                <Select
                  value={planningDraft.filing_status}
                  onValueChange={(value: FilingStatus) =>
                    setPlanningDraft((current) => ({ ...current, filing_status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select filing status" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILING_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="planning_home_state">State for tax planning</Label>
                <Input
                  id="planning_home_state"
                  value={planningDraft.home_state}
                  onChange={(event) =>
                    setPlanningDraft((current) => ({ ...current, home_state: event.target.value }))
                  }
                  placeholder="MN or TX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prior_year_agi">Prior-year AGI</Label>
                <Input
                  id="prior_year_agi"
                  type="number"
                  min="0"
                  step="0.01"
                  value={planningDraft.prior_year_agi}
                  onChange={(event) =>
                    setPlanningDraft((current) => ({ ...current, prior_year_agi: event.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Use the AGI from the return you just filed for {selectedTaxYear - 1}.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prior_year_federal_total_tax">Prior-year federal total tax</Label>
                <Input
                  id="prior_year_federal_total_tax"
                  type="number"
                  min="0"
                  step="0.01"
                  value={planningDraft.prior_year_federal_total_tax}
                  onChange={(event) =>
                    setPlanningDraft((current) => ({
                      ...current,
                      prior_year_federal_total_tax: event.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Use the federal total tax from the filed return. The safe-harbor alert is based on this number.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prior_year_state_total_tax">Prior-year state tax liability</Label>
                <Input
                  id="prior_year_state_total_tax"
                  type="number"
                  min="0"
                  step="0.01"
                  value={planningDraft.prior_year_state_total_tax}
                  onChange={(event) =>
                    setPlanningDraft((current) => ({
                      ...current,
                      prior_year_state_total_tax: event.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Only needed when you want Minnesota quarterly-risk tracking.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="annual_w2_withholding_expected">Manual payroll withholding override</Label>
                <Input
                  id="annual_w2_withholding_expected"
                  type="number"
                  min="0"
                  step="0.01"
                  value={planningDraft.annual_w2_withholding_expected}
                  onChange={(event) =>
                    setPlanningDraft((current) => ({
                      ...current,
                      annual_w2_withholding_expected: event.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Leave this at 0 if you are entering W-2 paychecks as they happen. Only use it when you need a manual override.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="annual_other_withholding_expected">Extra non-payroll withholding expected</Label>
                <Input
                  id="annual_other_withholding_expected"
                  type="number"
                  min="0"
                  step="0.01"
                  value={planningDraft.annual_other_withholding_expected}
                  onChange={(event) =>
                    setPlanningDraft((current) => ({
                      ...current,
                      annual_other_withholding_expected: event.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Use this only for withholding that will not be captured in the W-2 paycheck ledger.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_season_reviewed_at">Last updated after filing</Label>
                <Input
                  id="tax_season_reviewed_at"
                  type="date"
                  value={planningDraft.tax_season_reviewed_at}
                  onChange={(event) =>
                    setPlanningDraft((current) => ({
                      ...current,
                      tax_season_reviewed_at: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="planning_notes">Notes</Label>
                <Textarea
                  id="planning_notes"
                  value={planningDraft.notes}
                  onChange={(event) =>
                    setPlanningDraft((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Anything special about withholding, prior-year taxes, or how you are handling quarterly payments"
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={planningMutation.isPending}>
                  {planningMutation.isPending ? "Saving..." : "Save quarterly-risk inputs"}
                </Button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            title="Quarterly-risk status"
              description="Federal status combines your entered W-2 withholding, any extra withholding you entered here, and reserve entries that you mark as actual IRS payments. State status currently supports Minnesota."
          >
            {quarterlyRisk &&
            planningPreview.prior_year_agi !== null &&
            planningPreview.prior_year_federal_total_tax !== null ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Federal</p>
                      <p className="text-xs text-muted-foreground">
                        {quarterlyRisk.federalStatus} against the prior-year safe harbor
                      </p>
                    </div>
                    <p className="text-lg font-semibold">
                      {quarterlyRisk.federalGap > 0 ? formatCurrency(quarterlyRisk.federalGap) : "On track"}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Required by now</span>
                      <span>{formatCurrency(quarterlyRisk.federalRequiredByNow)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Payroll and other withholding counted</span>
                        <span>{formatCurrency(quarterlyRisk.pacedWithholdingByNow)}</span>
                      </div>
                    <div className="flex items-center justify-between">
                      <span>Actual IRS payments recorded</span>
                      <span>{formatCurrency(quarterlyRisk.federalPaymentsByNow)}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">State</p>
                      <p className="text-xs text-muted-foreground">
                        {planningDraft.home_state.trim().toUpperCase() === "MN"
                          ? `${quarterlyRisk.stateStatus} against Minnesota's prior-year liability`
                          : "No state quarterly-risk calculation is active for this state"}
                      </p>
                    </div>
                    <p className="text-lg font-semibold">
                      {quarterlyRisk.annualStateSafeHarbor > 0
                        ? quarterlyRisk.stateGap > 0
                          ? formatCurrency(quarterlyRisk.stateGap)
                          : "On track"
                        : "N/A"}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Required by now</span>
                      <span>{formatCurrency(quarterlyRisk.stateRequiredByNow)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Actual state payments recorded</span>
                      <span>{formatCurrency(quarterlyRisk.statePaymentsByNow)}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                  {quarterlyRisk.reminderNeeded
                    ? `Reminder: update ${selectedTaxYear} planning inputs after filing your ${selectedTaxYear - 1} return.`
                    : `Tax-season reminder cleared for ${selectedTaxYear}.`}
                </div>
              </div>
            ) : (
              <EmptyState
                title="Quarterly-risk alert needs filed-return inputs"
                description="Add prior-year AGI, prior-year federal total tax, and current-year withholding so the app can calculate safe-harbor coverage."
              />
            )}
          </SectionCard>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Home office business use"
            value={homeOfficeSummary ? formatPercent(homeOfficeSummary.businessUsePercent) : "Add inputs"}
            helper="Calculated from office square footage divided by total home square footage"
          />
          <MetricCard
            label="Actual office area used"
            value={homeOfficeSummary ? `${homeOfficeSummary.actualOfficeSquareFeet.toFixed(1)} sq ft` : "Add inputs"}
            helper="This is the real business-use space before the simplified-method cap is applied"
          />
          <MetricCard
            label="Simplified method"
            value={homeOfficeSummary ? formatCurrency(homeOfficeSummary.simplifiedMethodDeduction) : "Add inputs"}
            helper="Uses the IRS $5 per square foot method with the 300 square foot cap"
          />
          <MetricCard
            label="Regular method"
            value={homeOfficeSummary ? formatCurrency(homeOfficeSummary.regularMethodDeduction) : "Add inputs"}
            helper="Allocates shared costs by business-use percentage and adds direct office expenses"
          />
          <MetricCard
            label="Recommended method"
            value={
              homeOfficeSummary
                ? homeOfficeSummary.recommendedMethod === "simplified"
                  ? "Simplified"
                  : "Regular"
                : "Add inputs"
            }
            helper={
              homeOfficeSummary?.eligible
                ? "Based on the larger deduction from the inputs you entered"
                : "Confirm exclusive use and principal place of business to qualify"
            }
            tone={homeOfficeSummary?.eligible ? "positive" : "warning"}
          />
        </div>

        <SectionCard
          title="Office Space History"
          description="Add a new period whenever your home size or office size changes. The app applies each period from its effective date forward so you do not need to edit older records after a move."
          action={
            <Button onClick={openCreateSpaceDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add space period
            </Button>
          }
        >
          {relevantSpacePeriods.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Effective from</TableHead>
                  <TableHead>Effective to</TableHead>
                  <TableHead className="text-right">Home sq ft</TableHead>
                  <TableHead className="text-right">Office sq ft</TableHead>
                  <TableHead className="text-right">IRS allowable area</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relevantSpacePeriods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell>{period.effective_from}</TableCell>
                    <TableCell>{period.effective_to ?? "Open"}</TableCell>
                    <TableCell className="text-right">{period.home_square_feet.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{period.office_square_feet.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{Math.min(period.office_square_feet, 300).toFixed(1)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditSpaceDialog(period)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteSpacePeriodMutation.mutate(period.id)}>
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
              title="No office space periods yet"
              description="Add your current home and office square footage here so future moves do not require editing old records."
            />
          )}
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <SectionCard
            title="Home office inputs"
            description="Use this to allocate rent, utilities, internet, insurance, and home maintenance based on your office share of the home. If you have entered those living costs in Personal Cash Flow for this tax year, the calculator uses those actual entries. The square-footage fields below are only a fallback if you do not use the dated office space history above."
          >
            <form
              className="grid gap-5 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                homeOfficeMutation.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="home_office_state">Home office state</Label>
                <Input
                  id="home_office_state"
                  value={homeOfficeDraft.home_state}
                  onChange={(event) =>
                    setHomeOfficeDraft((current) => ({ ...current, home_state: event.target.value }))
                  }
                  placeholder="MN or TX"
                />
              </div>
              <div className="space-y-2">
                <Label>Method preference</Label>
                <Select
                  value={homeOfficeDraft.method_preference}
                  onValueChange={(value: HomeOfficeMethodPreference) =>
                    setHomeOfficeDraft((current) => ({ ...current, method_preference: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method preference" />
                  </SelectTrigger>
                  <SelectContent>
                    {METHOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="home_square_feet">Total home square footage</Label>
                <Input
                  id="home_square_feet"
                  type="number"
                  min="0"
                  step="0.1"
                  value={homeOfficeDraft.home_square_feet}
                  onChange={(event) =>
                    setHomeOfficeDraft((current) => ({ ...current, home_square_feet: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="office_square_feet">Office square footage</Label>
                <Input
                  id="office_square_feet"
                  type="number"
                  min="0"
                  step="0.1"
                  value={homeOfficeDraft.office_square_feet}
                  onChange={(event) =>
                    setHomeOfficeDraft((current) => ({ ...current, office_square_feet: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualifying_months">Qualifying months this year</Label>
                <Input
                  id="qualifying_months"
                  type="number"
                  min="1"
                  max="12"
                  step="1"
                  value={homeOfficeDraft.qualifying_months}
                  onChange={(event) =>
                    setHomeOfficeDraft((current) => ({ ...current, qualifying_months: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_rent">Monthly rent</Label>
                <Input
                  id="monthly_rent"
                  type="number"
                  min="0"
                  step="0.01"
                  value={homeOfficeDraft.monthly_rent}
                  onChange={(event) =>
                    setHomeOfficeDraft((current) => ({ ...current, monthly_rent: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_utilities">Monthly utilities</Label>
                <Input
                  id="monthly_utilities"
                  type="number"
                  min="0"
                  step="0.01"
                  value={homeOfficeDraft.monthly_utilities}
                  onChange={(event) =>
                    setHomeOfficeDraft((current) => ({ ...current, monthly_utilities: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_internet">Monthly internet</Label>
                <Input
                  id="monthly_internet"
                  type="number"
                  min="0"
                  step="0.01"
                  value={homeOfficeDraft.monthly_internet}
                  onChange={(event) =>
                    setHomeOfficeDraft((current) => ({ ...current, monthly_internet: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_renters_insurance">Monthly renters or homeowners insurance</Label>
                <Input
                  id="monthly_renters_insurance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={homeOfficeDraft.monthly_renters_insurance}
                  onChange={(event) =>
                    setHomeOfficeDraft((current) => ({
                      ...current,
                      monthly_renters_insurance: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_home_maintenance">Monthly home maintenance and shared repairs</Label>
                <Input
                  id="monthly_home_maintenance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={homeOfficeDraft.monthly_home_maintenance}
                  onChange={(event) =>
                    setHomeOfficeDraft((current) => ({
                      ...current,
                      monthly_home_maintenance: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direct_office_expenses">Direct office-only expenses</Label>
                <Input
                  id="direct_office_expenses"
                  type="number"
                  min="0"
                  step="0.01"
                  value={homeOfficeDraft.direct_office_expenses}
                  onChange={(event) =>
                    setHomeOfficeDraft((current) => ({
                      ...current,
                      direct_office_expenses: event.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Use this for office-only paint, office-only repairs, or other direct space-specific costs.
                </p>
              </div>
              <div className="space-y-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-4">
                <div className="flex items-center gap-3">
                  <input
                    id="exclusive_use_confirmed"
                    type="checkbox"
                    checked={homeOfficeDraft.exclusive_use_confirmed}
                    onChange={(event) =>
                      setHomeOfficeDraft((current) => ({
                        ...current,
                        exclusive_use_confirmed: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-border"
                  />
                  <Label htmlFor="exclusive_use_confirmed" className="text-sm">
                    I use this office space exclusively for business
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="principal_place_confirmed"
                    type="checkbox"
                    checked={homeOfficeDraft.principal_place_confirmed}
                    onChange={(event) =>
                      setHomeOfficeDraft((current) => ({
                        ...current,
                        principal_place_confirmed: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-border"
                  />
                  <Label htmlFor="principal_place_confirmed" className="text-sm">
                    This is my principal place of business for the work being deducted
                  </Label>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="home_office_notes">Notes</Label>
                <Textarea
                  id="home_office_notes"
                  value={homeOfficeDraft.notes}
                  onChange={(event) =>
                    setHomeOfficeDraft((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Anything special about this year's space usage or shared household costs"
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={homeOfficeMutation.isPending}>
                  {homeOfficeMutation.isPending ? "Saving..." : "Save home office inputs"}
                </Button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            title="Calculated allocations"
            description="These are the actual numbers you can use when you decide how much rent, utilities, internet, and other shared home costs belong to the business."
          >
            {homeOfficeSummary ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <p className="text-sm font-medium">Eligibility check</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {homeOfficeSummary.eligible ? "Eligible inputs confirmed" : "Needs confirmation"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Both exclusive use and principal place of business should be true before relying on the deduction.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <span>Actual office space used</span>
                    <span>{homeOfficeSummary.actualOfficeSquareFeet.toFixed(1)} sq ft</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <span>IRS allowable area for simplified method</span>
                    <span>{homeOfficeSummary.allowableArea.toFixed(1)} sq ft</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <span>Rent allocation</span>
                    <span>{formatCurrency(homeOfficeSummary.rentAllocation)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <span>Utilities allocation</span>
                    <span>{formatCurrency(homeOfficeSummary.utilitiesAllocation)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <span>Internet allocation</span>
                    <span>{formatCurrency(homeOfficeSummary.internetAllocation)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <span>Insurance allocation</span>
                    <span>{formatCurrency(homeOfficeSummary.insuranceAllocation)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <span>Maintenance allocation</span>
                    <span>{formatCurrency(homeOfficeSummary.maintenanceAllocation)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <span>Direct office expenses</span>
                    <span>{formatCurrency(homeOfficeSummary.directOfficeExpenses)}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                  Anything else to consider: office-only repairs, office-only furniture or fixtures, shared insurance,
                  internet, and home maintenance that benefits the entire dwelling. Mortgage interest, property taxes,
                  and depreciation are not included in this renter-first version.
                </div>
              </div>
            ) : (
              <EmptyState
                title="Home office calculation needs inputs"
                description="Enter your square footage and shared housing costs to see rent and utility allocations."
              />
            )}
          </SectionCard>
        </div>
      </div>

      <Dialog open={spaceDialogOpen} onOpenChange={setSpaceDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-border/70 bg-card">
          <DialogHeader>
            <DialogTitle>{editingSpacePeriod ? "Edit office space period" : "Create office space period"}</DialogTitle>
            <DialogDescription>
              Enter the actual home square footage and the actual office square footage used for business during this period. The simplified method later caps the allowable area at the IRS limit of 300 square feet.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSpacePeriodSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="space_effective_from">Effective from</Label>
                <Input
                  id="space_effective_from"
                  type="date"
                  value={spacePeriodDraft.effective_from}
                  onChange={(event) =>
                    setSpacePeriodDraft((current) => ({ ...current, effective_from: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="space_effective_to">Effective to</Label>
                <Input
                  id="space_effective_to"
                  type="date"
                  value={spacePeriodDraft.effective_to}
                  onChange={(event) =>
                    setSpacePeriodDraft((current) => ({ ...current, effective_to: event.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">Leave blank if this period is still current.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="space_home_square_feet">Total home square footage</Label>
                <Input
                  id="space_home_square_feet"
                  type="number"
                  min="0"
                  step="0.1"
                  value={spacePeriodDraft.home_square_feet}
                  onChange={(event) =>
                    setSpacePeriodDraft((current) => ({ ...current, home_square_feet: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="space_office_square_feet">Actual office square footage</Label>
                <Input
                  id="space_office_square_feet"
                  type="number"
                  min="0"
                  step="0.1"
                  value={spacePeriodDraft.office_square_feet}
                  onChange={(event) =>
                    setSpacePeriodDraft((current) => ({ ...current, office_square_feet: event.target.value }))
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This should be the real office area you used. The app applies the IRS cap only when it calculates the simplified method.
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="space_notes">Notes</Label>
                <Textarea
                  id="space_notes"
                  value={spacePeriodDraft.notes}
                  onChange={(event) =>
                    setSpacePeriodDraft((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Optional note such as move date, new apartment, or office reconfiguration"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSpaceDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={spacePeriodMutation.isPending}>
                {spacePeriodMutation.isPending ? "Saving..." : editingSpacePeriod ? "Save changes" : "Create period"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
