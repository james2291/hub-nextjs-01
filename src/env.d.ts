declare namespace NodeJS {
  interface ProcessEnv {
    // Read through serverEnv() in src/server/env.ts, which validates these at start-up.
    /** Fixed "now" for the hub clock, e.g. 2026-05-16T14:30:00+01:00. Unset = real time. */
    HUB_NOW?: string;
    /** Signs the User Pinned cookie. Required in production, at least 32 characters. */
    HUB_COOKIE_SECRET?: string;
    /** "1" (default) = bundled 2025/26 demo data, labelled as such. "0" once live data is wired. */
    HUB_DEMO?: "0" | "1";
    /** "none" (default) or "cognito". Cognito sign-in is not built yet; see proxy.ts. */
    AUTH_MODE?: "none" | "cognito";
    /** "1" lets OVAL_UPSTREAM_AUTHORIZATION be used in production (private previews only). */
    ALLOW_SHARED_UPSTREAM_TOKEN?: "0" | "1";
    /** Base URL of the AWS Oval Insights API, e.g. https://insights.example.com. Unset = temporary placeholder mode. */
    INSIGHTS_API_URL?: string;
    /** API Gateway key for the Oval Insights API (sent as x-api-key). Server-only. */
    INSIGHTS_API_KEY?: string;
    /** Oval Hub v2 API Gateway base, without a trailing slash. RugbyViz is called at {base}/oval-proxy/. */
    OVAL_API_GATEWAY_URL?: string;
    /** Optional full oval-proxy base. Defaults to {OVAL_API_GATEWAY_URL}/oval-proxy. */
    OVAL_PROXY_URL?: string;
    /** Direct RugbyViz base for alleventsearch, for example https://api.rugbyviz.com/rugby/v1. */
    RUGBYVIZ_API_URL?: string;
    /** Optional basic auth for the direct RugbyViz base. Oval-proxy does not use this. */
    RUGBYVIZ_BASIC_USER?: string;
    RUGBYVIZ_BASIC_PASSWORD?: string;
    /** Cognito id token used when the incoming request has no Authorization header. Development only unless ALLOW_SHARED_UPSTREAM_TOKEN=1. */
    OVAL_UPSTREAM_AUTHORIZATION?: string;
    /** Xeatre video API. Defaults to the v2 host when unset. */
    XEATRE_API_URL?: string;
    XEATRE_API_USER?: string;
    XEATRE_API_PASSWORD?: string;
    XEATRE_API_KEY?: string;
  }
}
