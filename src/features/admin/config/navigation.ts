import {
  CarFront,
  ChartSpline,
  CircleHelp,
  CircleDollarSign,
  CreditCard,
  House,
  ReceiptText,
  Settings,
  ShieldAlert,
} from "lucide-react";

import type { AdminNavigationItem } from "@/types/admin";

export const ADMIN_NAVIGATION: AdminNavigationItem[] = [
  {
    section: "Operations",
    href: "/admin",
    label: "Dashboard",
    icon: ChartSpline,
  },
  {
    section: "Operations",
    href: "/admin/income",
    label: "Income",
    icon: CircleDollarSign,
  },
  {
    section: "Operations",
    href: "/admin/w2-paychecks",
    label: "W-2 Paychecks",
    icon: ReceiptText,
  },
  {
    section: "Operations",
    href: "/admin/expenses",
    label: "Expenses",
    icon: CreditCard,
  },
  {
    section: "Operations",
    href: "/admin/mileage",
    label: "Mileage",
    icon: CarFront,
  },
  {
    section: "Taxes",
    href: "/admin/tax-planning",
    label: "Estimated Taxes",
    icon: ShieldAlert,
  },
  {
    section: "Taxes",
    href: "/admin/housing",
    label: "Housing",
    icon: House,
  },
  {
    section: "Admin",
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
  },
  {
    section: "Admin",
    href: "/admin/help",
    label: "Help",
    icon: CircleHelp,
  },
];
