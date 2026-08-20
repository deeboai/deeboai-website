/* eslint-disable react-refresh/only-export-components */

import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Deebo Admin",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="animate-fade-in-up">{children}</div>;
}
