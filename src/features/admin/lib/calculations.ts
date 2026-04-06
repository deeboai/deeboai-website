export function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function getTaxPeriod(dateValue: string) {
  const date = new Date(dateValue);
  const taxYear = date.getUTCFullYear();
  const taxQuarter = Math.floor(date.getUTCMonth() / 3) + 1;

  return {
    taxYear,
    taxQuarter,
  };
}

export function getEntryMonth(dateValue: string) {
  const date = new Date(dateValue);

  return {
    entryMonth: date.getUTCMonth() + 1,
    entryYear: date.getUTCFullYear(),
  };
}

// These helpers keep every derived amount consistent between the form layer and the saved record.
export function calculateNetReceived(grossAmount: number, feesWithheld: number) {
  return roundCurrency(Math.max(grossAmount - feesWithheld, 0));
}

export function calculateDeductibleAmount(amount: number, businessUsePercent: number) {
  return roundCurrency(amount * (businessUsePercent / 100));
}

export function calculateMileageValue(miles: number, mileageRate: number) {
  return roundCurrency(miles * mileageRate);
}

export function calculateReserveAmount(sourceIncomeAmount: number, reservePercent: number) {
  return roundCurrency(sourceIncomeAmount * (reservePercent / 100));
}

export function calculateBusinessUseAmount(cost: number, businessUsePercent: number) {
  return roundCurrency(cost * (businessUsePercent / 100));
}

export function sumBy<T>(items: T[], selector: (item: T) => number) {
  return items.reduce((total, item) => total + selector(item), 0);
}
