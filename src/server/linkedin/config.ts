import "server-only";

/**
 * LinkedIn settings — all environment variables (Vercel → Settings →
 * Environment Variables). Client id/secret come from the LinkedIn developer
 * app's Auth tab.
 */
export interface LinkedInConfig {
  /** LINKEDIN_CLIENT_ID */
  clientId: string;
  /** LINKEDIN_CLIENT_SECRET */
  clientSecret: string;
  /** LINKEDIN_ORGANIZATION_ID — numeric page id; optional, default: the first page the connecting admin manages. */
  organizationId?: string;
  /** LINKEDIN_API_VERSION — "YYYYMM" (LinkedIn supports each version ~1 year). */
  apiVersion: string;
  /** LINKEDIN_SCOPES — space separated. */
  scopes: string;
  /** LINKEDIN_REDIRECT_URI — default: https://<this site>/api/linkedin/callback */
  redirectUri?: string;
  /** Overrides for tests (fake LinkedIn). */
  apiUrl: string;
  oauthUrl: string;
  /** How often to call LinkedIn at most (minutes). Development tier allows ~500 calls/day. */
  refreshMinutes: number;
  /** LINKEDIN_PAGE_LABEL — short name in "<label> on LinkedIn" (default: initials, e.g. "CDS"). */
  pageLabel?: string;
}

export const DEFAULT_LINKEDIN_VERSION = "202611";

export function linkedInConfigFromEnv(env: Record<string, string | undefined> = process.env): LinkedInConfig | null {
  const clientId = env.LINKEDIN_CLIENT_ID?.trim();
  const clientSecret = env.LINKEDIN_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    organizationId: env.LINKEDIN_ORGANIZATION_ID?.trim().replace(/^urn:li:organization:/, "") || undefined,
    apiVersion: env.LINKEDIN_API_VERSION?.trim() || DEFAULT_LINKEDIN_VERSION,
    scopes: env.LINKEDIN_SCOPES?.trim() || "r_organization_social rw_organization_admin",
    redirectUri: env.LINKEDIN_REDIRECT_URI?.trim() || undefined,
    apiUrl: (env.LINKEDIN_API_URL?.trim() || "https://api.linkedin.com/rest").replace(/\/$/, ""),
    oauthUrl: (env.LINKEDIN_OAUTH_URL?.trim() || "https://www.linkedin.com/oauth/v2").replace(/\/$/, ""),
    refreshMinutes: Number(env.LINKEDIN_REFRESH_MINUTES) || 30,
    pageLabel: env.LINKEDIN_PAGE_LABEL?.trim() || undefined,
  };
}

/** Store keys */
export const LI_TOKEN_KEY = "linkedin:token";
export const LI_SNAPSHOT_KEY = "linkedin:snapshot";

export interface StoredToken {
  accessToken: string;
  /** Epoch ms */
  expiresAt: number;
  refreshToken?: string;
  refreshExpiresAt?: number;
  scope?: string;
  organizationId: string;
  organizationName: string;
  connectedAt: number;
}
