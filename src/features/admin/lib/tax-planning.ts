import type { FilingStatus, HomeOfficeMethodPreference } from "@/types/admin";
import type { Database } from "@/types/supabase";

import { roundCurrency } from "@/features/admin/lib/calculations";

type TaxPlanningProfileRow = Database["public"]["Tables"]["tax_planning_profiles"]["Row"];
type HomeOfficeProfileRow = Database["public"]["Tables"]["home_office_profiles"]["Row"];
type HomeOfficeSpacePeriodRow = Database["public"]["Tables"]["home_office_space_periods"]["Row"];
type TaxReserveRow = Database["public"]["Tables"]["tax_reserves"]["Row"];
type W2PaycheckRow = Database["public"]["Tables"]["w2_paychecks"]["Row"];
type PersonalCashflowRow = Database["public"]["Tables"]["personal_cashflow_entries"]["Row"];
type HousingMonthlyEntryRow = Database["public"]["Tables"]["housing_monthly_entries"]["Row"];

const FEDERAL_BUSINESS_MILEAGE_RATE_BY_YEAR: Record<number, number> = {
  2024: 0.67,
  2025: 0.7,
  2026: 0.725,
};

const MINNESOTA_STATE_TAX_DEFAULT_PERCENT = 7.5;

export function getFederalBusinessMileageRate(taxYear: number) {
  return FEDERAL_BUSINESS_MILEAGE_RATE_BY_YEAR[taxYear] ?? 0;
}

function getHighIncomeSafeHarborThreshold(filingStatus: FilingStatus) {
  return filingStatus === "married_filing_separately" ? 75_000 : 150_000;
}

function getFederalSafeHarborMultiplier(filingStatus: FilingStatus, priorYearAgi: number) {
  return priorYearAgi > getHighIncomeSafeHarborThreshold(filingStatus) ? 1.1 : 1;
}

export function getQuarterlyInstallmentsDue(date = new Date(), taxYear = date.getFullYear()) {
  const dueDates = [
    new Date(Date.UTC(taxYear, 3, 15)),
    new Date(Date.UTC(taxYear, 5, 15)),
    new Date(Date.UTC(taxYear, 8, 15)),
    new Date(Date.UTC(taxYear + 1, 0, 15)),
  ];

  return dueDates.reduce((count, dueDate) => (date >= dueDate ? count + 1 : count), 0);
}

export function getNextQuarterlyDueDate(date = new Date(), taxYear = date.getFullYear()) {
  const dueDates = [
    new Date(Date.UTC(taxYear, 3, 15)),
    new Date(Date.UTC(taxYear, 5, 15)),
    new Date(Date.UTC(taxYear, 8, 15)),
    new Date(Date.UTC(taxYear + 1, 0, 15)),
  ];

  return dueDates.find((dueDate) => date < dueDate) ?? null;
}

function getQuarterFraction(installmentsDue: number) {
  return Math.min(Math.max(installmentsDue, 0), 4) / 4;
}

function normalizeStateCode(stateValue?: string | null) {
  return stateValue?.trim().toUpperCase() || null;
}

export function getStateReserveSuggestionPercent(stateValue?: string | null) {
  const state = normalizeStateCode(stateValue);

  if (state === "TX") {
    return 30;
  }

  if (state === "MN") {
    return 30 + MINNESOTA_STATE_TAX_DEFAULT_PERCENT;
  }

  return 30;
}

export function getQuarterlyRiskStatusLabel(gap: number) {
  return gap > 0 ? "At risk" : "On track";
}

const HOUSING_MONTHLY_CATEGORY_CONFIG = [
  {
    amountKey: "base_rent",
    category: "rent",
  },
  {
    amountKey: "parking",
    category: "parking",
  },
  {
    amountKey: "utilities",
    category: "utilities",
  },
  {
    amountKey: "insurance",
    category: "insurance",
  },
  {
    amountKey: "maintenance",
    category: "maintenance",
  },
] as const;

function getHousingEligibleAmount(entry: HousingMonthlyEntryRow) {
  return entry.base_rent + entry.utilities + entry.insurance + entry.maintenance;
}

export function calculateHousingDeductionEntry(entry: HousingMonthlyEntryRow) {
  const homeSquareFeet = entry.home_square_feet ?? 0;
  const officeSquareFeet = entry.office_square_feet ?? 0;
  const hasContext = homeSquareFeet > 0 && officeSquareFeet > 0 && officeSquareFeet <= homeSquareFeet;
  const businessUsePercent = hasContext ? (officeSquareFeet / homeSquareFeet) * 100 : 0;
  const totalEntered = roundCurrency(
    entry.base_rent + entry.parking + entry.utilities + entry.insurance + entry.maintenance,
  );
  const eligibleAmount = roundCurrency(getHousingEligibleAmount(entry));
  const deductibleAmount = hasContext ? roundCurrency(eligibleAmount * (businessUsePercent / 100)) : 0;

  return {
    hasContext,
    businessUsePercent,
    totalEntered,
    eligibleAmount,
    deductibleAmount,
  };
}

export function calculateHousingDeductionSummary(entries: HousingMonthlyEntryRow[]) {
  const entriesWithComputedValues = entries.map((entry) => {
    const computed = calculateHousingDeductionEntry(entry);

    return {
      ...entry,
      ...computed,
    };
  });

  const monthsLogged = new Set(entries.map((entry) => entry.entry_month)).size;
  const entriesMissingContext = entriesWithComputedValues.filter((entry) => !entry.hasContext).length;
  const totalEntered = roundCurrency(
    entriesWithComputedValues.reduce((total, entry) => total + entry.totalEntered, 0),
  );
  const totalEligible = roundCurrency(
    entriesWithComputedValues.reduce((total, entry) => total + entry.eligibleAmount, 0),
  );
  const totalDeductible = roundCurrency(
    entriesWithComputedValues.reduce((total, entry) => total + entry.deductibleAmount, 0),
  );

  const categoryTotals = Array.from(
    entriesWithComputedValues.reduce((map, entry) => {
      const businessUseFactor = entry.businessUsePercent / 100;

      HOUSING_MONTHLY_CATEGORY_CONFIG.forEach(({ amountKey, category }) => {
        const current = map.get(category) ?? {
          category,
          totalEntered: 0,
          totalDeductible: 0,
        };
        const amount = entry[amountKey];
        const isDeductibleCategory = category !== "parking";

        current.totalEntered += amount;
        current.totalDeductible += isDeductibleCategory && entry.hasContext ? amount * businessUseFactor : 0;
        map.set(category, current);
      });

      return map;
    }, new Map<string, { category: string; totalEntered: number; totalDeductible: number }>()),
  ).map(([, value]) => ({
    ...value,
    totalEntered: roundCurrency(value.totalEntered),
    totalDeductible: roundCurrency(value.totalDeductible),
  }));

  return {
    entries: entriesWithComputedValues,
    monthsLogged,
    entriesMissingContext,
    totalEntered,
    totalEligible,
    totalDeductible,
    categoryTotals,
  };
}

export function calculateQuarterlyRisk(
  profile: TaxPlanningProfileRow | null,
  taxReserves: TaxReserveRow[],
  w2Paychecks: W2PaycheckRow[] = [],
  today = new Date(),
) {
  if (!profile) {
    return null;
  }

  const installmentsDue = getQuarterlyInstallmentsDue(today, profile.tax_year);
  const fractionDue = getQuarterFraction(installmentsDue);
  const filingStatus = profile.filing_status as FilingStatus;
  const priorYearAgi = profile.prior_year_agi ?? 0;
  const annualFederalSafeHarbor =
    profile.prior_year_federal_total_tax !== null
      ? roundCurrency(profile.prior_year_federal_total_tax * getFederalSafeHarborMultiplier(filingStatus, priorYearAgi))
      : 0;

  const stateCode = normalizeStateCode(profile.home_state);
  const annualStateSafeHarbor =
    stateCode === "MN" && profile.prior_year_state_total_tax !== null
      ? roundCurrency(profile.prior_year_state_total_tax)
      : 0;

  const actualW2WithholdingYtd = roundCurrency(
    w2Paychecks
      .filter((entry) => entry.tax_year === profile.tax_year)
      .reduce((total, entry) => total + entry.federal_tax_withheld, 0),
  );
  const actualStateWithholdingYtd = roundCurrency(
    w2Paychecks
      .filter(
        (entry) =>
          entry.tax_year === profile.tax_year &&
          normalizeStateCode(entry.state_code) === stateCode,
      )
      .reduce((total, entry) => total + entry.state_tax_withheld, 0),
  );
  const withholdingCountedByNow =
    Math.max(actualW2WithholdingYtd, profile.annual_w2_withholding_expected ?? 0) +
    (profile.annual_other_withholding_expected ?? 0);

  // Reserve entries only count toward quarterly-risk coverage when the user marks them as actual tax payments.
  const paymentsThisYear = taxReserves.filter((entry) => entry.tax_year === profile.tax_year && entry.was_transferred);
  const federalPaymentsByNow = roundCurrency(
    paymentsThisYear
      .filter((entry) => entry.counts_as_federal_estimated_payment)
      .reduce((total, entry) => total + entry.reserve_amount, 0),
  );
  const statePaymentsByNow = roundCurrency(
    paymentsThisYear
      .filter((entry) => entry.counts_as_state_estimated_payment)
      .reduce((total, entry) => total + entry.reserve_amount, 0),
  );

  const federalRequiredByNow = roundCurrency(annualFederalSafeHarbor * fractionDue);
  const stateRequiredByNow = roundCurrency(annualStateSafeHarbor * fractionDue);
  const federalCoveredByNow = roundCurrency(withholdingCountedByNow + federalPaymentsByNow);
  const stateCoveredByNow = roundCurrency(actualStateWithholdingYtd + statePaymentsByNow);
  const federalGap = roundCurrency(Math.max(federalRequiredByNow - federalCoveredByNow, 0));
  const stateGap = roundCurrency(Math.max(stateRequiredByNow - stateCoveredByNow, 0));

  return {
    installmentsDue,
    pacedWithholdingByNow: roundCurrency(withholdingCountedByNow),
    annualFederalSafeHarbor,
    annualStateSafeHarbor,
    federalRequiredByNow,
    stateRequiredByNow,
    federalPaymentsByNow,
    statePaymentsByNow,
    actualStateWithholdingYtd,
    federalCoveredByNow,
    stateCoveredByNow,
    federalGap,
    stateGap,
    federalStatus: getQuarterlyRiskStatusLabel(federalGap),
    stateStatus: stateCode === "MN" ? getQuarterlyRiskStatusLabel(stateGap) : "Not required",
    reminderNeeded:
      today.getUTCMonth() >= 1 &&
      (!profile.tax_season_reviewed_at ||
        profile.prior_year_federal_total_tax === null ||
        profile.prior_year_agi === null ||
        (stateCode === "MN" && profile.prior_year_state_total_tax === null)),
  };
}

export function calculateHomeOfficeSummary(profile: HomeOfficeProfileRow | null) {
  if (!profile) {
    return null;
  }

  const homeSquareFeet = profile.home_square_feet ?? 0;
  const officeSquareFeet = profile.office_square_feet ?? 0;
  const businessUsePercent = homeSquareFeet > 0 ? (officeSquareFeet / homeSquareFeet) * 100 : 0;
  const annualRent = profile.monthly_rent * profile.qualifying_months;
  const annualUtilities = profile.monthly_utilities * profile.qualifying_months;
  const annualInternet = profile.monthly_internet * profile.qualifying_months;
  const annualInsurance = profile.monthly_renters_insurance * profile.qualifying_months;
  const annualMaintenance = profile.monthly_home_maintenance * profile.qualifying_months;
  // The regular method allocates shared housing costs by office square footage and then adds direct office-only costs.
  const annualIndirectExpenses = annualRent + annualUtilities + annualInternet + annualInsurance + annualMaintenance;
  const indirectDeduction = roundCurrency(annualIndirectExpenses * (businessUsePercent / 100));
  const regularMethodDeduction = roundCurrency(indirectDeduction + profile.direct_office_expenses);
  const simplifiedMethodDeduction = roundCurrency(
    Math.min(officeSquareFeet, 300) * 5 * (profile.qualifying_months / 12),
  );
  const recommendedMethod: HomeOfficeMethodPreference =
    regularMethodDeduction > simplifiedMethodDeduction ? "regular" : "simplified";

  const eligible = profile.exclusive_use_confirmed && profile.principal_place_confirmed;

  return {
    eligible,
    businessUsePercent,
    allowableArea: Math.min(officeSquareFeet, 300),
    actualOfficeSquareFeet: officeSquareFeet,
    actualHomeSquareFeet: homeSquareFeet,
    annualRent,
    annualUtilities,
    annualInternet,
    annualInsurance,
    annualMaintenance,
    annualIndirectExpenses,
    rentAllocation: roundCurrency(annualRent * (businessUsePercent / 100)),
    utilitiesAllocation: roundCurrency(annualUtilities * (businessUsePercent / 100)),
    internetAllocation: roundCurrency(annualInternet * (businessUsePercent / 100)),
    insuranceAllocation: roundCurrency(annualInsurance * (businessUsePercent / 100)),
    maintenanceAllocation: roundCurrency(annualMaintenance * (businessUsePercent / 100)),
    directOfficeExpenses: roundCurrency(profile.direct_office_expenses),
    simplifiedMethodDeduction,
    regularMethodDeduction,
    recommendedMethod:
      profile.method_preference === "auto" ? recommendedMethod : profile.method_preference,
  };
}

function startOfYearUtc(taxYear: number) {
  return new Date(Date.UTC(taxYear, 0, 1));
}

function endOfYearUtcExclusive(taxYear: number) {
  return new Date(Date.UTC(taxYear + 1, 0, 1));
}

function toUtcDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function getOverlapDays(start: Date, endExclusive: Date, rangeStart: Date, rangeEndExclusive: Date) {
  const overlapStart = Math.max(start.getTime(), rangeStart.getTime());
  const overlapEnd = Math.min(endExclusive.getTime(), rangeEndExclusive.getTime());

  if (overlapEnd <= overlapStart) {
    return 0;
  }

  return (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24);
}

function buildWeightedSpaceSnapshot(
  profile: HomeOfficeProfileRow,
  spacePeriods: HomeOfficeSpacePeriodRow[],
) {
  const yearStart = startOfYearUtc(profile.tax_year);
  const yearEndExclusive = endOfYearUtcExclusive(profile.tax_year);
  const overlappingPeriods = spacePeriods.filter((period) => {
    const periodStart = toUtcDate(period.effective_from);
    const periodEndExclusive = period.effective_to
      ? new Date(toUtcDate(period.effective_to).getTime() + 24 * 60 * 60 * 1000)
      : yearEndExclusive;

    return getOverlapDays(periodStart, periodEndExclusive, yearStart, yearEndExclusive) > 0;
  });

  if (!overlappingPeriods.length) {
    const homeSquareFeet = profile.home_square_feet ?? 0;
    const officeSquareFeet = profile.office_square_feet ?? 0;

    return {
      homeSquareFeet,
      officeSquareFeet,
      allowableArea: Math.min(officeSquareFeet, 300),
    };
  }

  let weightedHomeSquareFeet = 0;
  let weightedOfficeSquareFeet = 0;
  let weightedAllowableArea = 0;
  let totalDays = 0;

  for (const period of overlappingPeriods) {
    const periodStart = toUtcDate(period.effective_from);
    const periodEndExclusive = period.effective_to
      ? new Date(toUtcDate(period.effective_to).getTime() + 24 * 60 * 60 * 1000)
      : yearEndExclusive;
    const overlapDays = getOverlapDays(periodStart, periodEndExclusive, yearStart, yearEndExclusive);

    if (!overlapDays) {
      continue;
    }

    totalDays += overlapDays;
    weightedHomeSquareFeet += period.home_square_feet * overlapDays;
    weightedOfficeSquareFeet += period.office_square_feet * overlapDays;
    // The simplified method cannot use more than the actual office area and cannot exceed the IRS 300 sq ft cap.
    weightedAllowableArea += Math.min(period.office_square_feet, 300) * overlapDays;
  }

  if (!totalDays) {
    const homeSquareFeet = profile.home_square_feet ?? 0;
    const officeSquareFeet = profile.office_square_feet ?? 0;

    return {
      homeSquareFeet,
      officeSquareFeet,
      allowableArea: Math.min(officeSquareFeet, 300),
    };
  }

  return {
    homeSquareFeet: weightedHomeSquareFeet / totalDays,
    officeSquareFeet: weightedOfficeSquareFeet / totalDays,
    allowableArea: weightedAllowableArea / totalDays,
  };
}

export function calculateHomeOfficeSummaryFromEntries(
  profile: HomeOfficeProfileRow | null,
  personalEntries: PersonalCashflowRow[],
  spacePeriods: HomeOfficeSpacePeriodRow[] = [],
) {
  if (!profile) {
    return null;
  }

  const weightedSpaceSnapshot = buildWeightedSpaceSnapshot(profile, spacePeriods);
  const profileWithWeightedSpace = {
    ...profile,
    home_square_feet: weightedSpaceSnapshot.homeSquareFeet,
    office_square_feet: weightedSpaceSnapshot.officeSquareFeet,
  };

  const entriesForYear = personalEntries.filter((entry) => entry.entry_year === profile.tax_year);
  const rentTotal = entriesForYear
    .filter((entry) => entry.category === "rent")
    .reduce((total, entry) => total + entry.amount, 0);
  const utilitiesTotal = entriesForYear
    .filter((entry) => entry.category === "utilities" || entry.category === "electricity")
    .reduce((total, entry) => total + entry.amount, 0);
  const internetTotal = entriesForYear
    .filter((entry) => entry.category === "internet")
    .reduce((total, entry) => total + entry.amount, 0);
  const insuranceTotal = entriesForYear
    .filter((entry) => entry.category === "insurance")
    .reduce((total, entry) => total + entry.amount, 0);
  const maintenanceTotal = entriesForYear
    .filter((entry) => entry.category === "home maintenance")
    .reduce((total, entry) => total + entry.amount, 0);

  if (rentTotal || utilitiesTotal || internetTotal || insuranceTotal || maintenanceTotal) {
    const monthlyFactor = Math.max(profile.qualifying_months, 1);

    const summary = calculateHomeOfficeSummary({
      ...profileWithWeightedSpace,
      monthly_rent: rentTotal / monthlyFactor,
      monthly_utilities: utilitiesTotal / monthlyFactor,
      monthly_internet: internetTotal / monthlyFactor,
      monthly_renters_insurance: insuranceTotal / monthlyFactor,
      monthly_home_maintenance: maintenanceTotal / monthlyFactor,
    });

    return summary
      ? {
          ...summary,
          allowableArea: weightedSpaceSnapshot.allowableArea,
          simplifiedMethodDeduction: roundCurrency(
            weightedSpaceSnapshot.allowableArea * 5 * (profile.qualifying_months / 12),
          ),
        }
      : null;
  }

  const summary = calculateHomeOfficeSummary(profileWithWeightedSpace);

  return summary
    ? {
        ...summary,
        allowableArea: weightedSpaceSnapshot.allowableArea,
        simplifiedMethodDeduction: roundCurrency(
          weightedSpaceSnapshot.allowableArea * 5 * (profile.qualifying_months / 12),
        ),
      }
    : null;
}
