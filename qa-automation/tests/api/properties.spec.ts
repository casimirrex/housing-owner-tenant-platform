import { test, expect } from "@playwright/test";
import { ApiClient } from "../../api/client";
import { PropertiesApi } from "../../api/properties.api";

test.describe("API: properties search contract", () => {
  let client: ApiClient;

  test.beforeEach(async ({ request }) => {
    const apiBase = process.env.API_BASE_URL ?? "http://localhost:8080";
    client = new ApiClient(request, apiBase);
  });

  test("/properties/search returns a paged list", async () => {
    const page = await PropertiesApi.search(client, { city: "Bengaluru" });

    expect(page).toMatchObject({
      results: expect.any(Array),
      totalElements: expect.any(Number),
      pageNumber: expect.any(Number),
      pageSize: expect.any(Number)
    });
    expect(page.results.length).toBeGreaterThan(0);

    // Spot-check that each result has the contract shape.
    const sample = page.results[0]!;
    expect(sample).toMatchObject({
      listingId: expect.any(String),
      title: expect.any(String),
      city: expect.any(String),
      rent: expect.any(Number)
    });
  });

  test("/properties/search applies rentMax filter", async () => {
    const cap = 25_000;
    const page = await PropertiesApi.search(client, { rentMax: cap });
    for (const r of page.results) {
      expect(r.rent).toBeLessThanOrEqual(cap);
    }
  });
});
