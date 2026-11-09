declare namespace NodeJS {
  interface ProcessEnv {
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
    /** Cognito id token used when the incoming request has no Authorization header. */
    OVAL_UPSTREAM_AUTHORIZATION?: string;
    /** Xeatre video API. Defaults to the v2 host when unset. */
    XEATRE_API_URL?: string;
    XEATRE_API_USER?: string;
    XEATRE_API_PASSWORD?: string;
    XEATRE_API_KEY?: string;
  }
}
