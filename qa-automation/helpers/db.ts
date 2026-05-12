/**
 * DB helpers — direct postgres access for seeding & teardown.
 *
 * Use SPARINGLY. Prefer the API for state setup; only reach for the DB when:
 *   - You need to promote a user to ADMIN (no public endpoint for that)
 *   - You need to wipe rows created by a previous flaky run
 *   - You need to deterministically set fraud_score / featured_until / etc.
 *
 * Requires `pg` to be installed: `npm i -D pg @types/pg`
 * (Not in the default package.json — uncomment + install if you need DB access.)
 */
// import { Client } from "pg";

export type DbConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
};

export function dbConfigFromEnv(): DbConfig {
  return {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? "housing_owner_tenant",
    user: process.env.DB_USER ?? "housing",
    password: process.env.DB_PASSWORD ?? "housing"
  };
}

/**
 * Example helpers — wire up after `npm i pg`.
 *
 *   export async function promoteToAdmin(email: string): Promise<void> {
 *     const client = new Client(dbConfigFromEnv());
 *     await client.connect();
 *     try {
 *       await client.query("UPDATE users SET role = 'ADMIN' WHERE email = $1", [email]);
 *     } finally {
 *       await client.end();
 *     }
 *   }
 *
 *   export async function deleteUsersWithPrefix(prefix: string): Promise<void> {
 *     const client = new Client(dbConfigFromEnv());
 *     await client.connect();
 *     try {
 *       await client.query("DELETE FROM users WHERE email LIKE $1", [`${prefix}%`]);
 *     } finally {
 *       await client.end();
 *     }
 *   }
 */
export const DbHelper = {
  // Placeholder. Add real methods when pg dep is installed.
};
