/**
 * Environment-aware configuration for k6.
 *
 * Picked at run time via:
 *   k6 run -e ENV=local    perf/scenarios/load-search.js
 *   k6 run -e ENV=staging  perf/scenarios/load-search.js
 *
 * Never run perf tests against production unless you've coordinated with ops.
 * The PRODUCTION block deliberately leaves credentials empty so a careless
 * run can't authenticate.
 */

const ENVIRONMENTS = {
  local: {
    apiBase: "http://localhost:8080",
    tenantEmail: "aarav@example.com",
    tenantPassword: "StrongPassword@123"
  },
  ci: {
    apiBase: "http://backend:8080",
    tenantEmail: "aarav@example.com",
    tenantPassword: "StrongPassword@123"
  },
  staging: {
    apiBase: __ENV.STAGING_API_BASE || "https://staging.testition.tech",
    tenantEmail: __ENV.STAGING_TENANT_EMAIL || "aarav@example.com",
    tenantPassword: __ENV.STAGING_TENANT_PASSWORD || "StrongPassword@123"
  },
  production: {
    apiBase: "https://testition.tech",
    // Intentionally empty — perf tests against production must set these
    // explicitly via -e flags and coordinate with the on-call team.
    tenantEmail: __ENV.PROD_TENANT_EMAIL || "",
    tenantPassword: __ENV.PROD_TENANT_PASSWORD || ""
  }
};

export function getEnv() {
  const name = __ENV.ENV || "local";
  const env = ENVIRONMENTS[name];
  if (!env) {
    throw new Error(
      `Unknown ENV "${name}". Valid: ${Object.keys(ENVIRONMENTS).join(", ")}`
    );
  }
  return Object.assign({ name }, env);
}
