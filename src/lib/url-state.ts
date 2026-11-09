"use client";

// A filter value kept in the URL query (e.g. ?result=W), so a filtered view can be shared,
// bookmarked and survives Back. Defaults are left out of the URL; updates replace the history
// entry rather than adding one per keystroke.
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useUrlState<T extends string>(
  key: string,
  fallback: T,
  allowed?: readonly T[],
): [T, (value: T) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params?.get(key);
  const value =
    raw !== null && raw !== undefined && (!allowed || allowed.includes(raw as T))
      ? (raw as T)
      : fallback;

  const setValue = useCallback(
    (next: T) => {
      const query = new URLSearchParams(window.location.search);
      if (next === fallback || next === "") query.delete(key);
      else query.set(key, next);
      const search = query.toString();
      router.replace(`${pathname}${search ? `?${search}` : ""}`, { scroll: false });
    },
    [key, fallback, pathname, router],
  );
  return [value, setValue];
}
