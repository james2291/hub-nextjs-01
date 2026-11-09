"use client";

import { PageError } from "@/components/oval/page-states";

// Keeps the shell and header; replaces only the page body.
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return <PageError error={error} retry={retry} what="the next opponent" />;
}
