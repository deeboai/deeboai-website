import type { Metadata } from "next";

import "@/index.css";

import { AppProviders } from "@/components/providers/app-providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://deeboai.com"),
  title: {
    default: "DeeboAI",
    template: "%s | DeeboAI",
  },
  description:
    "DeeboAI builds AI systems, software products, and durable internal tools for complex workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
