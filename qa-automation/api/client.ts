/**
 * ApiClient — thin wrapper around Playwright's request fixture.
 *
 * Why a wrapper:
 *   - Single place to add JWT, timeouts, retry policy
 *   - Typed return values per endpoint (see api/*.api.ts)
 *   - Consistent error messages on non-2xx
 *   - One log line per request → easy CI debugging
 */
import type { APIRequestContext, APIResponse } from "@playwright/test";

export type RequestOptions = {
  token?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  expectedStatus?: number; // default 200
  headers?: Record<string, string>;
};

export class ApiClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string
  ) {}

  private buildUrl(path: string, query?: RequestOptions["query"]): string {
    const url = new URL(path, this.baseUrl);
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
      });
    }
    return url.toString();
  }

  private buildHeaders(opts?: RequestOptions): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(opts?.headers ?? {})
    };
    if (opts?.token) h.Authorization = `Bearer ${opts.token}`;
    return h;
  }

  private async assertStatus(response: APIResponse, expected: number): Promise<void> {
    if (response.status() === expected) return;
    const body = await response.text().catch(() => "<no body>");
    throw new Error(
      `Expected HTTP ${expected} from ${response.url()}, got ${response.status()}. Body: ${body.slice(0, 500)}`
    );
  }

  async get<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
    const res = await this.request.get(this.buildUrl(path, opts.query), {
      headers: this.buildHeaders(opts)
    });
    await this.assertStatus(res, opts.expectedStatus ?? 200);
    return res.json() as Promise<T>;
  }

  async post<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
    const res = await this.request.post(this.buildUrl(path, opts.query), {
      headers: this.buildHeaders(opts),
      data: opts.body
    });
    await this.assertStatus(res, opts.expectedStatus ?? 200);
    return res.json() as Promise<T>;
  }

  async put<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
    const res = await this.request.put(this.buildUrl(path, opts.query), {
      headers: this.buildHeaders(opts),
      data: opts.body
    });
    await this.assertStatus(res, opts.expectedStatus ?? 200);
    return res.json() as Promise<T>;
  }

  async delete(path: string, opts: RequestOptions = {}): Promise<void> {
    const res = await this.request.delete(this.buildUrl(path, opts.query), {
      headers: this.buildHeaders(opts)
    });
    await this.assertStatus(res, opts.expectedStatus ?? 204);
  }

  /** Raw access for tests that need to assert on a specific non-2xx response. */
  async raw(method: "get" | "post" | "put" | "delete", path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.request[method](this.buildUrl(path, opts.query), {
      headers: this.buildHeaders(opts),
      data: opts.body
    });
  }
}
