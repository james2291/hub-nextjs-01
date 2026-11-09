import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Providers } from "@/app-providers";
import "@/styles.css";

export const metadata: Metadata = {
  title: "Oval Hub",
  description: "Rugby video and performance analysis for teams and coaches.",
  authors: [{ name: "Oval Insights" }],
  icons: { icon: "/favicon.png" },
  openGraph: { title: "Oval Hub", description: "Rugby video and performance analysis for teams and coaches.", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- same Plex stylesheet the prototype loaded */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
