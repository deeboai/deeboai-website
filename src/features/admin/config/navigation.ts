import {
  BriefcaseBusiness,
  CarFront,
  ChartSpline,
  CircleHelp,
  CircleDollarSign,
  CreditCard,
  Landmark,
  ReceiptText,
  PiggyBank,
  Settings,
  ShieldAlert,
} from "lucide-react";

import type { AdminNavigationItem } from "@/types/admin";

export const ADMIN_NAVIGATION: AdminNavigationItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: ChartSpline,
  },
  {
    href: "/admin/income",
    label: "Income",
    icon: CircleDollarSign,
  },
  {
    href: "/admin/w2-paychecks",
    label: "W-2 Paychecks",
    icon: ReceiptText,
  },
  {
    href: "/admin/expenses",
    label: "Expenses",
    icon: CreditCard,
  },
  {
    href: "/admin/mileage",
    label: "Mileage",
    icon: CarFront,
  },
  {
    href: "/admin/personal-cash-flow",
    label: "Personal Cash Flow",
    icon: Landmark,
  },
  {
    href: "/admin/tax-reserves",
    label: "Tax Reserves",
    icon: PiggyBank,
  },
  {
    href: "/admin/tax-planning",
    label: "Tax Planning",
    icon: ShieldAlert,
  },
  {
    href: "/admin/assets",
    label: "Assets",
    icon: BriefcaseBusiness,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
  },
  {
    href: "/admin/help",
    label: "Help",
    icon: CircleHelp,
  },
];
