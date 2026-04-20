import type { Metadata } from "next";

import "@/index.css";

import { AppProviders } from "@/components/providers/app-providers";
import { ScrollToTop } from "@/components/scroll-to-top";

export const metadata: Metadata = {
  metadataBase: new URL("https://deeboai.com"),
  title: {
    default: "DeeboAI",
    template: "%s | DeeboAI",
  },
  description:
    "DeeboAI builds AI systems, software products, and durable internal tools for complex workflows.",
  openGraph: {
    title: "DeeboAI",
    description:
      "DeeboAI builds AI systems, software products, and durable internal tools for complex workflows.",
    url: "https://deeboai.com",
    siteName: "DeeboAI",
    images: [
      {
        url: "/assets/logos/white_on_black.PNG",
        width: 1200,
        height: 1200,
        alt: "DeeboAI logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DeeboAI",
    description:
      "DeeboAI builds AI systems, software products, and durable internal tools for complex workflows.",
    images: ["/assets/logos/white_on_black.PNG"],
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png" }],
    shortcut: [{ url: "/favicon/favicon.ico" }],
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <AppProviders>
          <ScrollToTop />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
