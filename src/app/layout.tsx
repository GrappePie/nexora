import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/theme/providers";
import { I18nProvider } from "@/lib/i18n";
import { ServiceWorker } from "./service-worker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Nexora • POS para talleres automotrices",
  description:
    "POS para talleres con despliegue on‑prem (Docker), PWA, aprobaciones públicas y modo offline. Stack: Next.js + FastAPI + PostgreSQL.",
  openGraph: {
    title: "Nexora • POS para talleres automotrices",
    description:
      "POS para talleres con despliegue on‑prem (Docker), PWA, aprobaciones públicas y modo offline.",
    type: "website",
    images: [
      {
        url: "/window.svg",
        width: 1200,
        height: 630,
        alt: "Nexora Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexora • POS para talleres automotrices",
    description:
      "POS para talleres con despliegue on‑prem (Docker), PWA, aprobaciones públicas y modo offline.",
    images: ["/window.svg"],
  },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <I18nProvider>
          <Providers>{children}</Providers>
        </I18nProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
