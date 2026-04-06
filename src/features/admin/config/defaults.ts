import type { BusinessKind } from "@/types/admin";

export const DEFAULT_BUSINESSES: Array<{
  name: string;
  slug: string;
  business_kind: BusinessKind;
  default_tax_reserve_percent: number;
}> = [
  {
    name: "HLC Tutoring",
    slug: "hlc-tutoring",
    business_kind: "tutoring",
    default_tax_reserve_percent: 30,
  },
  {
    name: "Consulting / Websites",
    slug: "consulting-websites",
    business_kind: "consulting",
    default_tax_reserve_percent: 30,
  },
  {
    name: "Other Self-Employment",
    slug: "other-self-employment",
    business_kind: "other",
    default_tax_reserve_percent: 25,
  },
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  "software",
  "internet",
  "equipment",
  "office supplies",
  "phone",
  "education/training",
  "advertising/marketing",
  "travel",
  "bank/processing fees",
  "contractors",
  "home office related",
  "other",
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  "retainer",
  "deposit",
  "final payment",
  "hourly services",
  "tutoring payout",
  "consulting project",
  "website project",
  "other",
] as const;

export const DEFAULT_PERSONAL_CATEGORIES = [
  "rent",
  "electricity",
  "utilities",
  "internet",
  "parking",
  "groceries",
  "subscriptions",
  "car payment",
  "insurance",
  "home maintenance",
  "miscellaneous",
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  "business debit",
  "business credit",
  "cash",
  "ach",
  "wire",
  "other",
] as const;
