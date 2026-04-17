import type { LucideIcon } from "lucide-react";

export type BusinessKind = "tutoring" | "consulting" | "other";

export type FilingStatus =
  | "single"
  | "married_filing_jointly"
  | "married_filing_separately"
  | "head_of_household";

export type HomeOfficeMethodPreference = "auto" | "simplified" | "regular";

export type AdminNavigationItem = {
  section: string;
  href: string;
  label: string;
  icon: LucideIcon;
};

export type DateRangeFilter = {
  from?: string;
  to?: string;
};

export type SelectOption = {
  label: string;
  value: string;
};
