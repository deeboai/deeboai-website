import { format } from "date-fns";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const decimalCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number, precise = false) {
  return precise ? decimalCurrencyFormatter.format(value) : currencyFormatter.format(value);
}

export function formatCompactCurrency(value: number) {
  return compactCurrencyFormatter.format(value);
}

export function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

export function formatDate(value: string) {
  return format(new Date(value), "MMM d, yyyy");
}

export function formatMonthLabel(value: string) {
  return format(new Date(value), "MMM yyyy");
}
