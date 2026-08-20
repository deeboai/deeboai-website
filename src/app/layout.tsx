import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";

import "@/index.css";

import { AppProviders } from "@/components/providers/app-providers";
import { ScrollToTop } from "@/components/scroll-to-top";

// Real webfonts, loaded and self-hosted by next/font. Previously --font-sans named
// "Avenir Next" with no @font-face, so every page silently rendered a system fallback.
const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-loaded",
});

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-mono-loaded",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://deeboai.com"),
  title: {
    default: "Deebo",
    template: "%s | Deebo",
  },
  description:
    "Deebo builds AI systems, software products, and durable internal tools for complex workflows.",
  openGraph: {
    title: "Deebo",
    description:
      "Deebo builds AI systems, software products, and durable internal tools for complex workflows.",
    url: "https://deeboai.com",
    siteName: "Deebo",
    images: [
      {
        url: "/assets/logos/white_on_black.PNG",
        width: 1200,
        height: 1200,
        alt: "Deebo logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deebo",
    description:
      "Deebo builds AI systems, software products, and durable internal tools for complex workflows.",
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
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${fontSans.variable} ${fontMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <AppProviders>
          <ScrollToTop />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
