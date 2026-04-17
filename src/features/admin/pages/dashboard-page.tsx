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
import { sumBy } from "@/features/admin/lib/calculations";
import { compareDateOnlyDescending, getDateMonth } from "@/features/admin/lib/date";
import { listRows } from "@/features/admin/lib/data-client";
import { formatCurrency, formatDate } from "@/features/admin/lib/format";
import {
  calculateHousingDeductionSummary,
  calculateQuarterlyRisk,
  getNextQuarterlyDueDate,
} from "@/features/admin/lib/tax-planning";

type DashboardPageProps = {
  userEmail: string;
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function DashboardPage({ userEmail }: DashboardPageProps) {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard-page-data"],
    queryFn: async () => {
      const [
        businesses,
        incomeEntries,
        expenseEntries,
        mileageEntries,
        housingEntries,
        taxReserves,
        settingsRows,
        taxPlanningProfiles,
        w2Paychecks,
      ] =
        await Promise.all([
          listRows("businesses", { orderBy: "name", ascending: true }),
          listRows("income_entries", { orderBy: "received_on", ascending: false }),
          listRows("expense_entries", { orderBy: "expense_date", ascending: false }),
          listRows("mileage_entries", { orderBy: "trip_date", ascending: false }),
          listRows("housing_monthly_entries", { orderBy: "entry_date", ascending: false }),
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
        housingEntries,
        taxReserves,
        settings: settingsRows[0] ?? null,
        taxPlanningProfiles,
        w2Paychecks,
      };
    },
  });

  const today = new Date();
  const currentYear = today.getFullYear();

  const data = dashboardQuery.data;
  const settings = data?.settings ?? null;
  const currentPlanningProfile =
    (data?.taxPlanningProfiles ?? []).find((profile) => profile.tax_year === currentYear) ?? null;
  const w2PaychecksThisYear = (data?.w2Paychecks ?? []).filter((entry) => entry.tax_year === currentYear);
  const incomeThisYear = (data?.incomeEntries ?? []).filter((entry) => entry.tax_year === currentYear);
  const expensesThisYear = (data?.expenseEntries ?? []).filter((entry) => entry.tax_year === currentYear);
  const mileageThisYear = (data?.mileageEntries ?? []).filter((entry) => entry.tax_year === currentYear);
  const housingThisYear = (data?.housingEntries ?? []).filter((entry) => entry.entry_year === currentYear);

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
  const housingSummary = calculateHousingDeductionSummary(housingThisYear);
  const quarterlyRisk = calculateQuarterlyRisk(currentPlanningProfile, data?.taxReserves ?? []);
  const nextQuarterlyDueDate = getNextQuarterlyDueDate(today, currentYear);
  const planningSetupMissing = !currentPlanningProfile && today.getMonth() >= 1;
  const showTaxAlerts =
    planningSetupMissing ||
    (quarterlyRisk !== null &&
      (quarterlyRisk.reminderNeeded || quarterlyRisk.federalGap > 0 || quarterlyRisk.stateGap > 0));

  const chartData = MONTH_NAMES.map((label, index) => {
    const monthNumber = index + 1;
    const income = sumBy(
      incomeThisYear.filter((entry) => getDateMonth(entry.received_on) === monthNumber),
      (entry) => entry.gross_amount,
    );
    const expenses = sumBy(
      expensesThisYear.filter((entry) => getDateMonth(entry.expense_date) === monthNumber),
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
    ...housingThisYear.map((entry) => ({
      id: entry.id,
      date: entry.entry_date,
      type: "Housing",
      label: `Housing ${entry.entry_year}-${String(entry.entry_month).padStart(2, "0")}`,
      amount: -(entry.base_rent + entry.parking + entry.utilities + entry.insurance + entry.maintenance),
      helper: "Monthly housing row",
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
    .sort((left, right) => compareDateOnlyDescending(left.date, right.date))
    .slice(0, 8);

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Year-round visibility across W-2 income, self-employment activity, estimated-tax exposure, and housing deduction support."
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
              title="Estimated-Tax Alerts"
              description="This is the main readout for whether quarterly estimated payments may be needed based on the current-year planning inputs, withholding, and any recorded tax payments."
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <p className="text-sm font-medium">Federal estimate gap</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {planningSetupMissing
                      ? "Needs setup"
                      : quarterlyRisk && quarterlyRisk.federalGap > 0
                        ? formatCurrency(quarterlyRisk.federalGap)
                        : "On track"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {planningSetupMissing
                      ? "Create the current-year Estimated Taxes record so the app can evaluate federal estimated-tax exposure."
                      : quarterlyRisk
                      ? `${formatCurrency(quarterlyRisk.federalRequiredByNow)} required by now versus ${formatCurrency(quarterlyRisk.federalCoveredByNow)} covered`
                      : "Add estimated-tax inputs on the Estimated Taxes page"}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <p className="text-sm font-medium">Next due date</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {planningSetupMissing
                      ? "Needs setup"
                      : nextQuarterlyDueDate
                        ? formatDate(nextQuarterlyDueDate.toISOString().slice(0, 10))
                        : "Tax year complete"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {planningSetupMissing
                      ? "Finish the estimated-tax setup before relying on the dashboard alert."
                      : quarterlyRisk
                        ? `${quarterlyRisk.installmentsDue} installment${quarterlyRisk.installmentsDue === 1 ? "" : "s"} have already come due this year`
                        : "The due-date readout becomes useful once the estimate inputs are saved"}
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
                      ? `Create a ${currentYear} Estimated Taxes record after filing your ${currentYear - 1} return.`
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
              label="Housing costs logged"
              value={formatCurrency(housingSummary.totalEntered)}
              helper="Monthly rent, parking, utilities, insurance, and maintenance logged this year"
            />
            <MetricCard
              label="Housing deduction tracked"
              value={housingThisYear.length ? formatCurrency(housingSummary.totalDeductible) : "Add inputs"}
              helper={
                housingThisYear.length
                  ? "Current allocation based on the office share saved on each monthly housing row"
                  : "Add monthly housing rows and office square footage on Housing"
              }
              tone={housingThisYear.length ? "positive" : "warning"}
            />
            <MetricCard
              label="Housing months logged"
              value={`${housingSummary.monthsLogged}/12`}
              helper="Unique months with housing entries recorded this year"
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
              description="A merged timeline across income, expenses, housing, and W-2 activity."
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
                  description="Create income, expense, housing, or W-2 entries to populate the dashboard timeline."
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
                    <p className="text-sm text-muted-foreground">Federal estimate gap</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {planningSetupMissing
                        ? "Needs setup"
                        : quarterlyRisk
                          ? quarterlyRisk.federalGap > 0
                            ? formatCurrency(quarterlyRisk.federalGap)
                            : "On track"
                          : "Not set"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {planningSetupMissing
                        ? "Open Estimated Taxes and save the current-year setup after filing your last return."
                        : "This is the main dashboard signal for whether estimated payments may be needed."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <p className="text-sm text-muted-foreground">Next estimated-tax due date</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {nextQuarterlyDueDate
                        ? formatDate(nextQuarterlyDueDate.toISOString().slice(0, 10))
                        : "Tax year complete"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {quarterlyRisk
                        ? `${quarterlyRisk.installmentsDue} installment${quarterlyRisk.installmentsDue === 1 ? "" : "s"} have already come due this year.`
                        : "Save the Estimated Taxes inputs to turn this into a live planning signal."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <p className="text-sm text-muted-foreground">Housing deduction tracked</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {housingThisYear.length ? formatCurrency(housingSummary.totalDeductible) : "Not set"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {housingThisYear.length
                        ? "Built from the logged monthly housing rows and the office share saved on each row."
                        : "Add monthly housing rows and apartment square footage on Housing."}
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
