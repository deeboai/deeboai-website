"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { EmptyState } from "@/features/admin/components/empty-state";
import { MetricCard } from "@/features/admin/components/metric-card";
import { SectionCard } from "@/features/admin/components/section-card";
import { listRows } from "@/features/admin/lib/data-client";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/features/admin/lib/format";
import { sumBy } from "@/features/admin/lib/calculations";
import { calculateQuarterlyRisk } from "@/features/admin/lib/tax-planning";
import type { Database } from "@/types/supabase";

type DashboardPageProps = {
  userEmail: string;
};

type BusinessRow = Database["public"]["Tables"]["businesses"]["Row"];
type IncomeRow = Database["public"]["Tables"]["income_entries"]["Row"];
type ExpenseRow = Database["public"]["Tables"]["expense_entries"]["Row"];
type MileageRow = Database["public"]["Tables"]["mileage_entries"]["Row"];
type PersonalCashflowRow = Database["public"]["Tables"]["personal_cashflow_entries"]["Row"];
type TaxReserveRow = Database["public"]["Tables"]["tax_reserves"]["Row"];
type SettingsRow = Database["public"]["Tables"]["user_settings"]["Row"];
type W2PaycheckRow = Database["public"]["Tables"]["w2_paychecks"]["Row"];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getCurrentQuarter(date = new Date()) {
  return Math.floor(date.getMonth() / 3) + 1;
}

export function DashboardPage({ userEmail }: DashboardPageProps) {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard-page-data"],
    queryFn: async () => {
      const [businesses, incomeEntries, expenseEntries, mileageEntries, personalCashflowEntries, taxReserves, settingsRows, taxPlanningProfiles, w2Paychecks] =
        await Promise.all([
          listRows("businesses", { orderBy: "name", ascending: true }),
          listRows("income_entries", { orderBy: "received_on", ascending: false }),
          listRows("expense_entries", { orderBy: "expense_date", ascending: false }),
          listRows("mileage_entries", { orderBy: "trip_date", ascending: false }),
          listRows("personal_cashflow_entries", { orderBy: "entry_date", ascending: false }),
          listRows("tax_reserves", { orderBy: "reserve_date", ascending: false }),
          listRows("user_settings", { orderBy: "created_at", ascending: true }),
          listRows("tax_planning_profiles", { orderBy: "tax_year", ascending: false }),
          listRows("w2_paychecks", { orderBy: "pay_date", ascending: false }),
        ]);

      return {
        businesses,
        incomeEntries,
        expenseEntries,
        mileageEntries,
        personalCashflowEntries,
        taxReserves,
        settings: settingsRows[0] ?? null,
        taxPlanningProfiles,
        w2Paychecks,
      };
    },
  });

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentQuarter = getCurrentQuarter(today);

  const data = dashboardQuery.data;
  const settings = data?.settings ?? null;
  const currentPlanningProfile =
    (data?.taxPlanningProfiles ?? []).find((profile) => profile.tax_year === currentYear) ?? null;
  const w2PaychecksThisYear = (data?.w2Paychecks ?? []).filter((entry) => entry.tax_year === currentYear);
  const incomeThisYear = (data?.incomeEntries ?? []).filter((entry) => entry.tax_year === currentYear);
  const expensesThisYear = (data?.expenseEntries ?? []).filter((entry) => entry.tax_year === currentYear);
  const mileageThisYear = (data?.mileageEntries ?? []).filter((entry) => entry.tax_year === currentYear);
  const personalThisYear = (data?.personalCashflowEntries ?? []).filter((entry) => entry.entry_year === currentYear);
  const reservesThisYear = (data?.taxReserves ?? []).filter((entry) => entry.tax_year === currentYear);

  const startOfYear = new Date(Date.UTC(currentYear, 0, 1));
  const endOfYear = new Date(Date.UTC(currentYear + 1, 0, 1));
  const yearProgress =
    (today.getTime() - startOfYear.getTime()) / (endOfYear.getTime() - startOfYear.getTime());
  const w2EstimatedYtd = settings?.w2_annual_income
    ? settings.w2_annual_income * Math.min(Math.max(yearProgress, 0), 1)
    : 0;
  const w2GrossYtd = sumBy(w2PaychecksThisYear, (entry) => entry.gross_pay);
  const w2NetYtd = sumBy(w2PaychecksThisYear, (entry) => entry.net_pay);
  const w2FederalWithheldYtd = sumBy(w2PaychecksThisYear, (entry) => entry.federal_tax_withheld);
  const w2StateWithheldYtd = sumBy(w2PaychecksThisYear, (entry) => entry.state_tax_withheld);
  const w2DisplayedYtd = w2PaychecksThisYear.length ? w2GrossYtd : w2EstimatedYtd;

  const total1099IncomeYtd = sumBy(incomeThisYear, (entry) => entry.gross_amount);
  const totalBusinessExpensesYtd = sumBy(expensesThisYear, (entry) => entry.amount);
  const deductibleExpensesYtd = sumBy(expensesThisYear, (entry) => entry.deductible_amount);
  const totalMileageDeductionYtd = sumBy(mileageThisYear, (entry) => entry.deductible_value);
  const netBusinessProfitYtd = total1099IncomeYtd - deductibleExpensesYtd;
  const reserveTargetYtd = sumBy(reservesThisYear, (entry) => entry.reserve_amount);
  const reserveActualYtd = sumBy(
    reservesThisYear.filter((entry) => entry.was_transferred),
    (entry) => entry.reserve_amount,
  );

  const monthlyCashFlowIncome =
    sumBy(
      incomeThisYear.filter((entry) => new Date(entry.received_on).getUTCMonth() + 1 === currentMonth),
      (entry) => entry.net_received,
    ) +
    (w2PaychecksThisYear.length
      ? sumBy(
          w2PaychecksThisYear.filter((entry) => new Date(entry.pay_date).getUTCMonth() + 1 === currentMonth),
          (entry) => entry.net_pay,
        )
      : settings?.w2_annual_income
        ? settings.w2_annual_income / 12
        : 0);
  const monthlyCashFlowBusinessExpenses = sumBy(
    expensesThisYear.filter((entry) => new Date(entry.expense_date).getUTCMonth() + 1 === currentMonth),
    (entry) => entry.amount,
  );
  const monthlyCashFlowPersonal = sumBy(
    personalThisYear.filter((entry) => entry.entry_month === currentMonth),
    (entry) => entry.amount,
  );
  const monthlyCashFlowNet =
    monthlyCashFlowIncome - monthlyCashFlowBusinessExpenses - monthlyCashFlowPersonal;

  const quarterlyReserveTarget = sumBy(
    reservesThisYear.filter((entry) => entry.tax_quarter === currentQuarter),
    (entry) => entry.reserve_amount,
  );
  const quarterlyReserveActual = sumBy(
    reservesThisYear.filter((entry) => entry.tax_quarter === currentQuarter && entry.was_transferred),
    (entry) => entry.reserve_amount,
  );
  const quarterlyRisk = calculateQuarterlyRisk(currentPlanningProfile, data?.taxReserves ?? []);
  const planningSetupMissing = !currentPlanningProfile && today.getMonth() >= 1;
  const showTaxAlerts =
    planningSetupMissing ||
    (quarterlyRisk !== null &&
      (quarterlyRisk.reminderNeeded || quarterlyRisk.federalGap > 0 || quarterlyRisk.stateGap > 0));

  const chartData = MONTH_NAMES.map((label, index) => {
    const monthNumber = index + 1;
    const income = sumBy(
      incomeThisYear.filter((entry) => new Date(entry.received_on).getUTCMonth() + 1 === monthNumber),
      (entry) => entry.gross_amount,
    );
    const expenses = sumBy(
      expensesThisYear.filter((entry) => new Date(entry.expense_date).getUTCMonth() + 1 === monthNumber),
      (entry) => entry.deductible_amount,
    );

    return {
      month: label,
      income,
      expenses,
      net: income - expenses,
    };
  });

  const businessBreakdown = (data?.businesses ?? []).map((business) => {
    const businessIncome = incomeThisYear.filter((entry) => entry.business_id === business.id);
    const businessExpenses = expensesThisYear.filter((entry) => entry.business_id === business.id);

    return {
      id: business.id,
      name: business.name,
      kind: business.business_kind,
      income: sumBy(businessIncome, (entry) => entry.gross_amount),
      expenses: sumBy(businessExpenses, (entry) => entry.deductible_amount),
      net:
        sumBy(businessIncome, (entry) => entry.gross_amount) -
        sumBy(businessExpenses, (entry) => entry.deductible_amount),
    };
  });

  const recentTransactions = [
    ...(data?.incomeEntries ?? []).map((entry) => ({
      id: entry.id,
      date: entry.received_on,
      type: "Income",
      label: entry.payer_client,
      amount: entry.net_received,
      helper: entry.income_category,
    })),
    ...(data?.expenseEntries ?? []).map((entry) => ({
      id: entry.id,
      date: entry.expense_date,
      type: "Expense",
      label: entry.vendor,
      amount: -entry.amount,
      helper: entry.expense_category,
    })),
    ...(data?.personalCashflowEntries ?? []).map((entry) => ({
      id: entry.id,
      date: entry.entry_date,
      type: "Personal",
      label: entry.category,
      amount: -entry.amount,
      helper: entry.subcategory ?? "Personal cash flow",
    })),
    ...(data?.taxReserves ?? []).map((entry) => ({
      id: entry.id,
      date: entry.reserve_date,
      type: "Tax Reserve",
      label: entry.destination_account ?? "Tax reserve",
      amount: -entry.reserve_amount,
      helper: entry.was_transferred ? "Transferred" : "Target only",
    })),
    ...(data?.w2Paychecks ?? []).map((entry) => ({
      id: entry.id,
      date: entry.pay_date,
      type: "W-2",
      label: entry.employer,
      amount: entry.net_pay,
      helper: `${formatCurrency(entry.gross_pay, true)} gross`,
    })),
  ]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 8);

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Year-round visibility across W-2 baseline income, self-employment activity, reserves, and personal cash flow."
      userEmail={userEmail}
    >
      {dashboardQuery.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-48 animate-pulse rounded-3xl bg-card/70" />
          <div className="h-48 animate-pulse rounded-3xl bg-card/70" />
          <div className="h-80 animate-pulse rounded-3xl bg-card/70 lg:col-span-2" />
        </div>
      ) : (
        <div className="space-y-6">
          {showTaxAlerts ? (
            <SectionCard
              title="Tax Alerts"
              description="These alerts are based on the planning inputs saved for the current tax year and any reserve entries marked as actual IRS or state payments."
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <p className="text-sm font-medium">Federal quarterly risk</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {planningSetupMissing
                      ? "Needs setup"
                      : quarterlyRisk && quarterlyRisk.federalGap > 0
                        ? formatCurrency(quarterlyRisk.federalGap)
                        : "On track"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {planningSetupMissing
                      ? "Create the current-year Tax Planning record so the app can evaluate federal quarterly risk."
                      : quarterlyRisk
                      ? `${formatCurrency(quarterlyRisk.federalRequiredByNow)} required by now versus ${formatCurrency(quarterlyRisk.federalCoveredByNow)} covered`
                      : "Add quarterly-risk inputs on the Tax Planning page"}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <p className="text-sm font-medium">State quarterly risk</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {planningSetupMissing
                      ? "Needs setup"
                      : quarterlyRisk
                      ? quarterlyRisk.annualStateSafeHarbor > 0
                        ? quarterlyRisk.stateGap > 0
                          ? formatCurrency(quarterlyRisk.stateGap)
                          : "On track"
                        : "N/A"
                      : "Add inputs"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {planningSetupMissing
                      ? "Finish Tax Planning setup before relying on the state alert."
                      : quarterlyRisk?.annualStateSafeHarbor
                      ? `${formatCurrency(quarterlyRisk.stateRequiredByNow)} required by now versus ${formatCurrency(quarterlyRisk.stateCoveredByNow)} covered`
                      : "Minnesota is the only state-level quarterly-risk calculation in this version"}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <p className="text-sm font-medium">Post-filing reminder</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {planningSetupMissing
                      ? `Create ${currentYear}`
                      : quarterlyRisk?.reminderNeeded
                        ? `Update ${currentYear}`
                        : "Current"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {planningSetupMissing
                      ? `Create a ${currentYear} Tax Planning record after filing your ${currentYear - 1} return.`
                      : quarterlyRisk?.reminderNeeded
                      ? `Refresh ${currentYear} planning after filing your ${currentYear - 1} return.`
                      : `Current-year planning was already updated after filing your ${currentYear - 1} return.`}
                  </p>
                </div>
              </div>
            </SectionCard>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="W-2 pay YTD"
              value={formatCurrency(w2DisplayedYtd)}
              helper={
                w2PaychecksThisYear.length
                  ? `${formatCurrency(w2NetYtd)} take-home, ${formatCurrency(w2FederalWithheldYtd + w2StateWithheldYtd)} tax withheld`
                  : settings?.w2_annual_income
                    ? `Estimated from ${formatCurrency(settings.w2_annual_income)} yearly salary`
                    : "Add W-2 paycheck entries or a fallback salary in Settings"
              }
            />
            <MetricCard
              label="1099 income YTD"
              value={formatCurrency(total1099IncomeYtd)}
              helper="Gross self-employment income entered this year"
            />
            <MetricCard
              label="Business expenses YTD"
              value={formatCurrency(totalBusinessExpensesYtd)}
              helper={`${formatCurrency(deductibleExpensesYtd)} deductible after business-use allocation`}
            />
            <MetricCard
              label="Net business profit YTD"
              value={formatCurrency(netBusinessProfitYtd)}
              helper="Gross self-employment income less deductible expenses"
              tone={netBusinessProfitYtd >= 0 ? "positive" : "warning"}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Mileage deduction estimate"
              value={formatCurrency(totalMileageDeductionYtd)}
              helper={`${sumBy(mileageThisYear, (entry) => entry.miles).toFixed(1)} miles logged year to date`}
            />
            <MetricCard
              label="Tax reserve target vs actual"
              value={`${formatCompactCurrency(reserveActualYtd)} / ${formatCompactCurrency(reserveTargetYtd)}`}
              helper="Transferred reserve amount compared with planned reserve targets"
              tone={reserveActualYtd >= reserveTargetYtd && reserveTargetYtd > 0 ? "positive" : "warning"}
            />
            <MetricCard
              label="Monthly cash flow snapshot"
              value={formatCurrency(monthlyCashFlowNet)}
              helper={`${formatCurrency(monthlyCashFlowIncome)} in, ${formatCurrency(monthlyCashFlowBusinessExpenses + monthlyCashFlowPersonal)} out this month`}
              tone={monthlyCashFlowNet >= 0 ? "positive" : "warning"}
            />
            <MetricCard
              label="Quarterly reserve snapshot"
              value={`${formatCompactCurrency(quarterlyReserveActual)} / ${formatCompactCurrency(quarterlyReserveTarget)}`}
              helper={`Quarter ${currentQuarter} reserve progress`}
            />
          </div>

          <SectionCard
            title="Income, expenses, and net by month"
            description="Deductible expenses are used in the monthly net figure so the chart lines up with business-profit reporting."
          >
            <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <ChartContainer
                className="h-[320px]"
                config={{
                  income: {
                    label: "Income",
                    color: "hsl(198 93% 60%)",
                  },
                  expenses: {
                    label: "Expenses",
                    color: "hsl(26 96% 61%)",
                  },
                  net: {
                    label: "Net",
                    color: "hsl(153 67% 45%)",
                  },
                }}
              >
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                  <Bar dataKey="income" fill="var(--color-income)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>

              <ChartContainer
                className="h-[320px]"
                config={{
                  net: {
                    label: "Net",
                    color: "hsl(153 67% 45%)",
                  },
                }}
              >
                <LineChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <Line type="monotone" dataKey="net" stroke="var(--color-net)" strokeWidth={3} dot={false} />
                  <Area type="monotone" dataKey="net" fill="var(--color-net)" fillOpacity={0.14} stroke="none" />
                </LineChart>
              </ChartContainer>
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <SectionCard
              title="Recent transactions"
              description="A merged timeline across income, expenses, personal cash flow, and reserve activity."
            >
              {recentTransactions.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((transaction) => (
                      <TableRow key={`${transaction.type}-${transaction.id}`}>
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.label}</p>
                            <p className="text-xs text-muted-foreground">{transaction.helper}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(transaction.amount, true)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  title="No transactions yet"
                  description="Create income, expense, or cash-flow entries to populate the dashboard timeline."
                />
              )}
            </SectionCard>

            <div className="space-y-6">
              <SectionCard
                title="Business breakdown"
                description="Net reflects gross income less deductible expenses for each business line."
              >
                <div className="space-y-4">
                  {businessBreakdown.length ? (
                    businessBreakdown.map((business) => (
                      <div key={business.id} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium">{business.name}</p>
                            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                              {business.kind}
                            </p>
                          </div>
                          <p className="text-lg font-semibold">{formatCurrency(business.net)}</p>
                        </div>
                        <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span>Income</span>
                            <span>{formatCurrency(business.income)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Expenses</span>
                            <span>{formatCurrency(business.expenses)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="No business activity yet"
                      description="Add income and expense records to see tutoring and consulting performance broken out here."
                    />
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title="Operating view"
                description="Quick read on the current year without opening each section."
              >
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <p className="text-sm text-muted-foreground">Current reserve gap</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatCurrency(Math.max(reserveTargetYtd - reserveActualYtd, 0))}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      The amount still marked as a target rather than an actual transfer.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <p className="text-sm text-muted-foreground">Personal cash outflow YTD</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatCurrency(sumBy(personalThisYear, (entry) => entry.amount))}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <p className="text-sm text-muted-foreground">Taxes withheld from W-2 paychecks</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {w2PaychecksThisYear.length
                        ? formatCurrency(w2FederalWithheldYtd + w2StateWithheldYtd)
                        : settings?.w2_annual_tax_withheld
                          ? formatCurrency(settings.w2_annual_tax_withheld)
                          : "Not set"}
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
