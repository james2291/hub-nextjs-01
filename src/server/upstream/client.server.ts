// Server-only. Calls the same Oval Hub v2 upstreams the Vite app called.
// The browser never receives these base URLs or the Xeatre credentials.
import type { UpstreamCall, UpstreamChannel } from "@/server/upstream/catalog";

const TIMEOUT_MS = 20_000;

export class UpstreamConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UpstreamConfigError";
  }
}

export type UpstreamCallResult = {
  channel: UpstreamChannel;
  source: string;
  path: string;
  status: number;
  contentType: string | null;
  data: unknown;
};

function trimSlash(value: string): string {
  return value.replace(/\/$/, "");
}

function gateway(): string {
  const value = process.env.OVAL_API_GATEWAY_URL;
  if (!value) throw new UpstreamConfigError("OVAL_API_GATEWAY_URL is not set.");
  return trimSlash(value);
}

function ovalProxy(): string {
  const override = process.env.OVAL_PROXY_URL;
  return override ? trimSlash(override) : `${gateway()}/oval-proxy`;
}

function rugbyvizDirect(): string {
  const value = process.env.RUGBYVIZ_API_URL;
  if (!value) throw new UpstreamConfigError("RUGBYVIZ_API_URL is not set. V2 event search uses the direct RugbyViz base, not oval-proxy.");
  return trimSlash(value);
}

function xeatreAuth(): { base: string; user: string; password: string; key: string } {
  const user = process.env.XEATRE_API_USER;
  const password = process.env.XEATRE_API_PASSWORD;
  const key = process.env.XEATRE_API_KEY;
  if (!user || !password || !key) {
    throw new UpstreamConfigError("XEATRE_API_USER, XEATRE_API_PASSWORD, and XEATRE_API_KEY are not set.");
  }
  const base = trimSlash(process.env.XEATRE_API_URL || "https://ovalinsights.media.xeatre.cloud/api/v1");
  return { base, user, password, key };
}

function idToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const bearer = /^Bearer\s+(.+)$/i.exec(authorization);
  return bearer?.[1] ?? authorization;
}

function joinUrl(base: string, path: string): string {
  return `${trimSlash(base)}/${path.replace(/^\//, "")}`;
}

async function readBody(response: Response): Promise<unknown> {
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("json")) return response.json();
  return response.text();
}

async function request(url: string, headers: HeadersInit): Promise<{ status: number; contentType: string | null; data: unknown }> {
  try {
    const response = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
    return { status: response.status, contentType: response.headers.get("content-type"), data: await readBody(response) };
  } catch (error) {
    return { status: 0, contentType: null, data: error instanceof Error ? error.message : "Upstream request failed" };
  }
}

async function callXeatre(item: UpstreamCall): Promise<{ urlPath: string; result: { status: number; contentType: string | null; data: unknown } }> {
  const auth = xeatreAuth();
  const basic = `Basic ${Buffer.from(`${auth.user}:${auth.password}`).toString("base64")}`;
  const tokenResponse = await request(joinUrl(auth.base, "token/token.php"), { ApiKey: auth.key, Authorization: basic });
  const tokenValue = typeof tokenResponse.data === "object" && tokenResponse.data && "token" in tokenResponse.data ? (tokenResponse.data as { token: unknown }).token : null;
  const token = typeof tokenValue === "string" ? tokenValue : "";
  if (tokenResponse.status !== 200 || !token) {
    return { urlPath: "token/token.php", result: tokenResponse };
  }
  let path = item.path;
  if (item.eventSearchPath) {
    const absolute = joinUrl(rugbyvizDirect(), item.eventSearchPath);
    const join = path.includes("?") ? "&" : "?";
    path = `${path}${join}eventSearchUrl=${encodeURIComponent(absolute)}`;
  }
  return {
    urlPath: path,
    result: await request(joinUrl(auth.base, path), { ApiKey: auth.key, Authorization: basic, Token: token }),
  };
}

export async function callUpstream(item: UpstreamCall, authorization: string | null): Promise<UpstreamCallResult> {
  const token = idToken(authorization);
  if (item.channel === "xeatre") {
    const called = await callXeatre(item);
    return { channel: item.channel, source: item.source, path: called.urlPath, ...called.result };
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = token;

  let url: string;
  if (item.channel === "rugbyviz") url = joinUrl(ovalProxy(), item.path);
  else if (item.channel === "aws") url = joinUrl(gateway(), item.path);
  else {
    url = joinUrl(rugbyvizDirect(), item.path);
    const user = process.env.RUGBYVIZ_BASIC_USER;
    const password = process.env.RUGBYVIZ_BASIC_PASSWORD;
    if (user && password) headers["Authorization"] = `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
  }

  const result = await request(url, headers);
  return { channel: item.channel, source: item.source, path: item.path, ...result };
}
