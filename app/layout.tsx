import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { Providers } from "@/app-providers";
import { AppShell } from "@/components/oval/app-shell";
import { getShellData } from "@/server/shell";
import { readPins } from "@/server/user-pins";
import "@/styles.css";

// IBM Plex from the design handoff (OFL, app/fonts/OFL.txt), self-hosted.
const plexSans = localFont({
  src: [
    { path: "./fonts/ibm-plex-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ibm-plex-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Oval Hub",
  description: "Rugby video and performance analysis for teams and coaches.",
  authors: [{ name: "Oval Insights" }],
  icons: { icon: "/favicon.png" },
  openGraph: {
    title: "Oval Hub",
    description: "Rugby video and performance analysis for teams and coaches.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

// The shell reads the hub clock (next opponent, latest match), so render per request.
export const dynamic = "force-dynamic";

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <Providers>
          <AppShell data={{ ...getShellData(), ...(await readPins()) }}>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
