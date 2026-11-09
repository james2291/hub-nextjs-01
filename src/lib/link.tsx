"use client";

/**
 * Router compatibility layer for the TanStack Start → Next.js port.
 *
 * The prototype's components use TanStack's typed `<Link to="/teams/$teamId/$tab" params={…}>`
 * and `useNavigate()`. This module keeps that call shape but renders `next/link` and uses
 * `next/navigation`, so the 47 existing links work unchanged. New code can call `buildHref()`
 * directly with plain `next/link`.
 */
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Params = Record<string, string | number>;
type Search = Record<string, string | number | boolean | null | undefined>;

export type LinkTarget = { to: string; params?: Params; search?: Search; hash?: string };

export function buildHref({ to, params, search, hash }: LinkTarget) {
  const path = to.replace(/\$([A-Za-z0-9_]+)/g, (_, key: string) => {
    const value = params?.[key];
    if (value === undefined) throw new Error(`Missing route param "${key}" for ${to}`);
    return encodeURIComponent(String(value));
  });
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(search ?? {})) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  }
  const qs = query.toString();
  return `${path}${qs ? `?${qs}` : ""}${hash ? `#${hash}` : ""}`;
}

function isActive(pathname: string, href: string, exact: boolean) {
  const target = href.split(/[?#]/)[0] ?? href;
  if (exact) return pathname === target;
  return pathname === target || pathname.startsWith(`${target.replace(/\/$/, "")}/`);
}

type LinkProps = LinkTarget &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    children?: ReactNode;
    replace?: boolean;
    activeProps?: { className?: string };
    activeOptions?: { exact?: boolean };
  };

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, params, search, hash, replace, activeProps, activeOptions, className, children, ...rest },
  ref,
) {
  const pathname = usePathname() ?? "/";
  const href = buildHref({ to, params, search, hash } as LinkTarget);
  const active = isActive(pathname, href, activeOptions?.exact ?? false);
  return (
    <NextLink
      ref={ref}
      href={href}
      replace={replace ?? false}
      className={cn(className, active && activeProps?.className)}
      data-status={active ? "active" : undefined}
      aria-current={active ? "page" : undefined}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </NextLink>
  );
});

export function useNavigate() {
  const router = useRouter();
  return (target: LinkTarget & { replace?: boolean }) => {
    const href = buildHref(target);
    if (target.replace) router.replace(href);
    else router.push(href);
    return Promise.resolve();
  };
}
