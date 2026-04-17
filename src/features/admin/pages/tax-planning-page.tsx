"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AdminLink } from "@/features/admin/components/admin-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { EmptyState } from "@/features/admin/components/empty-state";
import { MetricCard } from "@/features/admin/components/metric-card";
import { SectionCard } from "@/features/admin/components/section-card";
import { listRows, upsertRow } from "@/features/admin/lib/data-client";
import { formatCurrency, formatDate } from "@/features/admin/lib/format";
import {
  calculateHousingDeductionSummary,
  calculateQuarterlyRisk,
  getNextQuarterlyDueDate,
} from "@/features/admin/lib/tax-planning";
import { useAdminReferenceData } from "@/features/admin/hooks/use-admin-reference-data";
import type { FilingStatus } from "@/types/admin";
import type { Database } from "@/types/supabase";

type TaxPlanningPageProps = {
  userId: string;
  userEmail: string;
};

type TaxPlanningRow = Database["public"]["Tables"]["tax_planning_profiles"]["Row"];
type HousingMonthlyEntryRow = Database["public"]["Tables"]["housing_monthly_entries"]["Row"];

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

const FILING_STATUS_OPTIONS: Array<{ label: string; value: FilingStatus }> = [
  { label: "Single", value: "single" },
  { label: "Married filing jointly", value: "married_filing_jointly" },
  { label: "Married filing separately", value: "married_filing_separately" },
  { label: "Head of household", value: "head_of_household" },
];

const HOUSING_CATEGORY_LABELS: Record<string, string> = {
  rent: "Rent",
  utilities: "Utilities",
  insurance: "Insurance",
  maintenance: "Maintenance",
  parking: "Parking",
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

export function TaxPlanningPage({ userId, userEmail }: TaxPlanningPageProps) {
  const queryClient = useQueryClient();
  const referenceQuery = useAdminReferenceData();
  const currentYear = new Date().getFullYear();
  const [selectedTaxYear, setSelectedTaxYear] = useState(currentYear);
  const [planningDraft, setPlanningDraft] = useState<TaxPlanningDraft>(
    buildTaxPlanningDraft(null, currentYear, referenceQuery.data),
  );

  const planningQuery = useQuery({
    queryKey: ["tax-planning-page-data"],
    queryFn: async () => {
      const [planningProfiles, taxReserves, w2Paychecks, housingEntries] = await Promise.all([
        listRows("tax_planning_profiles", { orderBy: "tax_year", ascending: false }),
        listRows("tax_reserves", { orderBy: "reserve_date", ascending: false }),
        listRows("w2_paychecks", { orderBy: "pay_date", ascending: false }),
        listRows("housing_monthly_entries", { orderBy: "entry_date", ascending: false }),
      ]);

      return {
        planningProfiles,
        taxReserves,
        w2Paychecks,
        housingEntries,
      };
    },
  });

  const selectedPlanningRow =
    planningQuery.data?.planningProfiles.find((row) => row.tax_year === selectedTaxYear) ?? null;

  useEffect(() => {
    setPlanningDraft(buildTaxPlanningDraft(selectedPlanningRow, selectedTaxYear, referenceQuery.data));
  }, [selectedPlanningRow, selectedTaxYear, referenceQuery.data]);

  const taxYears = useMemo(() => {
    const years = new Set<number>([currentYear - 1, currentYear, currentYear + 1]);
    planningQuery.data?.planningProfiles.forEach((row) => years.add(row.tax_year));
    planningQuery.data?.housingEntries.forEach((row) => years.add(row.entry_year));
    return Array.from(years).sort((left, right) => right - left);
  }, [currentYear, planningQuery.data]);

  const planningPreview = buildPlanningPreviewRow(planningDraft, userId, selectedPlanningRow?.id);
  const quarterlyRisk = calculateQuarterlyRisk(
    planningPreview,
    planningQuery.data?.taxReserves ?? [],
    planningQuery.data?.w2Paychecks ?? [],
  );
  const readyQuarterlyRisk =
    quarterlyRisk &&
    planningPreview.prior_year_agi !== null &&
    planningPreview.prior_year_federal_total_tax !== null
      ? quarterlyRisk
      : null;
  const planningStateCode = planningDraft.home_state.trim().toUpperCase();
  const nextQuarterlyDueDate = getNextQuarterlyDueDate(new Date(), selectedTaxYear);
  const nextQuarterlyDueDateLabel = nextQuarterlyDueDate
    ? formatDate(nextQuarterlyDueDate.toISOString().slice(0, 10))
    : selectedTaxYear < currentYear
      ? "Tax year complete"
      : "All due dates passed";

  const housingEntriesForYear = (planningQuery.data?.housingEntries ?? []).filter(
    (entry: HousingMonthlyEntryRow) => entry.entry_year === selectedTaxYear,
  );
  const housingSummary = calculateHousingDeductionSummary(housingEntriesForYear);
  const federalEstimateStatusLabel = readyQuarterlyRisk
    ? readyQuarterlyRisk.federalGap > 0
      ? "Likely yes"
      : "Probably not"
    : "Needs setup";
  const stateEstimateStatusLabel =
    planningStateCode === "MN"
      ? readyQuarterlyRisk && planningPreview.prior_year_state_total_tax !== null
        ? readyQuarterlyRisk.stateGap > 0
          ? "Review now"
          : "On track"
        : "Needs state input"
      : "Not tracked here";

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
      toast.success("Estimated-tax inputs updated.");
      queryClient.invalidateQueries({ queryKey: ["tax-planning-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save estimated-tax inputs.");
    },
  });

  return (
    <AdminShell
      title="Estimated Taxes"
      subtitle="This page is for one decision: are you likely under-covered for quarterly estimated taxes? Housing now lives in its own tab and feeds the deduction totals shown here."
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <SectionCard
          title="Planning year"
          description="Each tax year stores the filed-return numbers and withholding assumptions used to decide whether quarterly estimated payments are becoming necessary."
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
              After you file your {selectedTaxYear - 1} return, refresh this page so the estimate check uses current safe-harbor numbers.
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Estimated-tax check"
          description="If the federal gap is above zero, you are not yet covered by withholding and recorded estimated payments relative to the saved safe-harbor target."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <p className="text-sm font-medium">Federal estimated payment needed?</p>
              <p className="mt-2 text-3xl font-semibold">{federalEstimateStatusLabel}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {readyQuarterlyRisk
                  ? readyQuarterlyRisk.federalGap > 0
                    ? `${formatCurrency(readyQuarterlyRisk.federalGap)} still uncovered right now`
                    : `${formatCurrency(readyQuarterlyRisk.federalCoveredByNow)} already covering the safe-harbor pace`
                  : "Enter the filed-return numbers and current-year withholding inputs below first."}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <p className="text-sm font-medium">Next due date</p>
              <p className="mt-2 text-3xl font-semibold">{nextQuarterlyDueDateLabel}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {readyQuarterlyRisk
                  ? `${readyQuarterlyRisk.installmentsDue} installment${readyQuarterlyRisk.installmentsDue === 1 ? "" : "s"} have already come due for ${selectedTaxYear}.`
                  : "The estimate check becomes useful after the tax-year inputs are saved."}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <p className="text-sm font-medium">State estimate status</p>
              <p className="mt-2 text-3xl font-semibold">{stateEstimateStatusLabel}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {planningStateCode === "MN"
                  ? readyQuarterlyRisk && readyQuarterlyRisk.annualStateSafeHarbor > 0
                    ? readyQuarterlyRisk.stateGap > 0
                      ? `${formatCurrency(readyQuarterlyRisk.stateGap)} still uncovered for Minnesota`
                      : "Minnesota safe-harbor coverage is currently on pace."
                    : "Enter prior-year state tax if you want Minnesota tracking here."
                  : "This page only calculates state-level estimated-tax coverage for Minnesota right now."}
              </p>
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Federal safe-harbor target"
            value={quarterlyRisk ? formatCurrency(quarterlyRisk.annualFederalSafeHarbor) : "Add inputs"}
            helper={
              quarterlyRisk
                ? "This is the annual federal amount the safe-harbor pace is based on"
                : "Add prior-year federal tax and AGI"
            }
          />
          <MetricCard
            label="Federal required by now"
            value={quarterlyRisk ? formatCurrency(quarterlyRisk.federalRequiredByNow) : "Add inputs"}
            helper={
              quarterlyRisk
                ? "How much coverage should exist by this point in the year"
                : "The app paces the annual target across the four estimated-tax deadlines"
            }
          />
          <MetricCard
            label="Covered by now"
            value={quarterlyRisk ? formatCurrency(quarterlyRisk.federalCoveredByNow) : "Add inputs"}
            helper="This includes withholding and any recorded estimated-tax payments"
            tone={quarterlyRisk?.federalGap ? "warning" : "positive"}
          />
          <MetricCard
            label="Federal gap right now"
            value={
              quarterlyRisk
                ? quarterlyRisk.federalGap > 0
                  ? formatCurrency(quarterlyRisk.federalGap)
                  : "On track"
                : "Add inputs"
            }
            helper="If this is above zero, the page is flagging a federal estimated-tax exposure"
            tone={quarterlyRisk?.federalGap ? "warning" : "positive"}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <SectionCard
            title="What drives the estimate flag"
            description="Enter these after filing the prior year's return. The check uses prior-year tax, prior-year AGI, real W-2 withholding, and any extra withholding or estimated payments you record elsewhere in admin."
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
                  Only needed when you want Minnesota estimated-tax tracking here.
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
                  Leave this at 0 if you are entering W-2 paychecks as they happen. Use it only when the paycheck ledger is incomplete.
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
                  placeholder="Anything special about withholding, the filed return numbers, or how you plan to handle estimated payments"
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={planningMutation.isPending}>
                  {planningMutation.isPending ? "Saving..." : "Save estimated-tax inputs"}
                </Button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            title="Why the page is flagging you"
            description="Federal status combines W-2 withholding, any extra withholding entered here, and any recorded estimated-tax payments. State status currently supports Minnesota only."
          >
            {readyQuarterlyRisk ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Federal</p>
                      <p className="text-xs text-muted-foreground">
                        {readyQuarterlyRisk.federalStatus} against the prior-year safe harbor
                      </p>
                    </div>
                    <p className="text-lg font-semibold">
                      {readyQuarterlyRisk.federalGap > 0 ? formatCurrency(readyQuarterlyRisk.federalGap) : "On track"}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Required by now</span>
                      <span>{formatCurrency(readyQuarterlyRisk.federalRequiredByNow)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Payroll and other withholding counted</span>
                      <span>{formatCurrency(readyQuarterlyRisk.pacedWithholdingByNow)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Actual IRS payments recorded</span>
                      <span>{formatCurrency(readyQuarterlyRisk.federalPaymentsByNow)}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">State</p>
                      <p className="text-xs text-muted-foreground">
                        {planningStateCode === "MN"
                          ? `${readyQuarterlyRisk.stateStatus} against Minnesota's prior-year liability`
                          : "No state estimated-tax calculation is active for this state"}
                      </p>
                    </div>
                    <p className="text-lg font-semibold">
                      {readyQuarterlyRisk.annualStateSafeHarbor > 0
                        ? readyQuarterlyRisk.stateGap > 0
                          ? formatCurrency(readyQuarterlyRisk.stateGap)
                          : "On track"
                        : "N/A"}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Required by now</span>
                      <span>{formatCurrency(readyQuarterlyRisk.stateRequiredByNow)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Actual state payments recorded</span>
                      <span>{formatCurrency(readyQuarterlyRisk.statePaymentsByNow)}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                  {readyQuarterlyRisk.reminderNeeded
                    ? `Reminder: refresh ${selectedTaxYear} after filing your ${selectedTaxYear - 1} return so the estimate check stays current.`
                    : `The filed-return reminder is already cleared for ${selectedTaxYear}.`}
                </div>
              </div>
            ) : (
              <EmptyState
                title="Estimated-tax check needs filed-return inputs"
                description="Add prior-year AGI, prior-year federal total tax, and current-year withholding so the page can decide whether estimated payments are becoming necessary."
              />
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Housing deduction support"
          description="Housing is now tracked one row per month in its own tab. Rent, utilities, insurance, and maintenance feed the home-office deduction, while parking is tracked separately and excluded from the deduction by default."
          action={
            <Button asChild>
              <AdminLink href="/admin/housing">Open housing tab</AdminLink>
            </Button>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Housing costs logged"
              value={formatCurrency(housingSummary.totalEntered)}
              helper={`Monthly housing totals entered for ${selectedTaxYear}`}
            />
            <MetricCard
              label="Deductible-eligible costs"
              value={formatCurrency(housingSummary.totalEligible)}
              helper="Rent, utilities, insurance, and maintenance tracked for home-office support"
            />
            <MetricCard
              label="Deductible share tracked"
              value={formatCurrency(housingSummary.totalDeductible)}
              helper="Calculated month by month from the saved office share"
            />
            <MetricCard
              label="Months logged"
              value={`${housingSummary.monthsLogged}/12`}
              helper="Unique months with a housing row recorded"
            />
            <MetricCard
              label="Months missing context"
              value={String(housingSummary.entriesMissingContext)}
              helper="Rows without usable square-footage data do not contribute to the deduction"
              tone={housingSummary.entriesMissingContext ? "warning" : "positive"}
            />
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                title="No housing rows logged yet"
                description="Use the Housing tab for monthly rent, parking, utilities, insurance, and maintenance totals."
              />
            )}
          </div>
        </SectionCard>
      </div>
    </AdminShell>
  );
}
