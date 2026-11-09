import type { Metadata } from "next";

import { HomeView } from "@/views/home";

export const metadata: Metadata = {
  title: "Semi-final week | Oval Hub",
  description: "Harlequins weekly preparation, next-match comparison, results and reports.",
  openGraph: { title: "Semi-final week | Oval Hub", description: "Harlequins weekly preparation, next-match comparison, results and reports.", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function Page() {
  return <HomeView />;
}
