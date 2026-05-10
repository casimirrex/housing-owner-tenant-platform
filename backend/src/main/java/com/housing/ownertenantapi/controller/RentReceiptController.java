package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.service.CurrentSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Phase 1 — Rent receipt generator.
 *
 * Returns a print-optimised HTML page for a single month's rent receipt.
 * The tenant clicks "Print receipt" and the browser's Save-as-PDF dialog
 * produces a real PDF — zero new dependencies required.
 *
 * The receipt is gated on the lease record so a tenant cannot generate a
 * receipt for a property they never leased. Owner identity, address, rent,
 * and tenant name come from tenant_leases + listings + users.
 *
 * URL: /api/v1/leases/{leaseId}/receipt?month=2026-05
 */
@RestController
@RequestMapping("/api/v1/leases")
@Tag(name = "Rent Receipts", description = "Print-friendly HTML receipts for tax filing")
public class RentReceiptController {

  private final JdbcTemplate jdbcTemplate;
  private final CurrentSessionService currentSessionService;

  public RentReceiptController(JdbcTemplate jdbcTemplate, CurrentSessionService currentSessionService) {
    this.jdbcTemplate = jdbcTemplate;
    this.currentSessionService = currentSessionService;
  }

  @GetMapping(value = "/{leaseId}/receipt", produces = MediaType.TEXT_HTML_VALUE)
  @Operation(summary = "Render a print-friendly rent receipt for one month")
  public ResponseEntity<String> render(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @PathVariable String leaseId,
      @RequestParam String month
  ) {
    String userId = currentSessionService.requireUserId(authorizationHeader);

    YearMonth ym;
    try {
      ym = YearMonth.parse(month);
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "month must be YYYY-MM, e.g. 2026-05");
    }

    java.util.Map<String, Object> row;
    try {
      row = jdbcTemplate.queryForMap("""
              SELECT l.lease_id, l.tenant_id, l.owner_id, l.monthly_rent,
                     l.start_date, l.end_date,
                     COALESCE(li.title, '')   AS listing_title,
                     COALESCE(li.address, '') AS listing_address,
                     COALESCE(li.locality,'') AS listing_locality,
                     COALESCE(li.city, '')    AS listing_city,
                     COALESCE(t.full_name, '') AS tenant_name,
                     COALESCE(o.full_name, '') AS owner_name,
                     COALESCE(o.email, '')     AS owner_email,
                     COALESCE(o.pan_card_number, '') AS owner_pan
              FROM tenant_leases l
              LEFT JOIN listings li ON li.listing_id = l.listing_id
              LEFT JOIN users t ON t.user_id = l.tenant_id
              LEFT JOIN users o ON o.user_id = l.owner_id
              WHERE l.lease_id = ?
              """, leaseId);
    } catch (EmptyResultDataAccessException none) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lease not found.");
    }

    String tenantId = (String) row.get("tenant_id");
    String ownerId = (String) row.get("owner_id");
    if (!userId.equals(tenantId) && !userId.equals(ownerId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          "Only the tenant or owner of this lease can fetch the receipt.");
    }

    long monthlyRent = ((Number) row.get("monthly_rent")).longValue();
    LocalDate periodEnd = ym.atEndOfMonth();
    LocalDate periodStart = ym.atDay(1);

    String html = buildReceiptHtml(
        leaseId, ym,
        (String) row.get("tenant_name"),
        (String) row.get("listing_title"),
        (String) row.get("listing_address"),
        (String) row.get("listing_locality"),
        (String) row.get("listing_city"),
        (String) row.get("owner_name"),
        (String) row.get("owner_pan"),
        monthlyRent,
        periodStart, periodEnd
    );

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_TYPE, "text/html; charset=utf-8")
        .header("Cache-Control", "no-store")
        .body(html);
  }

  private String buildReceiptHtml(
      String leaseId,
      YearMonth month,
      String tenantName,
      String listingTitle,
      String address,
      String locality,
      String city,
      String ownerName,
      String ownerPan,
      long rentRupees,
      LocalDate periodStart,
      LocalDate periodEnd
  ) {
    String monthLabel = month.format(DateTimeFormatter.ofPattern("MMMM yyyy"));
    String today = LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy"));
    String receiptNo = "RR-" + leaseId.toUpperCase() + "-" + month.toString().replace("-", "");
    String safeAddress = address == null || address.isBlank()
        ? (locality + ", " + city)
        : address;
    String panLine = ownerPan == null || ownerPan.isBlank()
        ? ""
        : "<p>PAN of owner: <strong>" + escape(ownerPan) + "</strong></p>";

    String inWords = numberToWordsRupees(rentRupees);
    String formattedRent = String.format("%,d", rentRupees);

    return """
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Rent Receipt — %s</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', system-ui, sans-serif;
              color: #1a1a1a;
              margin: 0;
              padding: 32px;
              background: #f8f6f2;
            }
            .sheet {
              max-width: 720px;
              margin: 0 auto;
              background: #fff;
              padding: 48px 56px;
              box-shadow: 0 8px 24px rgba(0,0,0,0.08);
              border-radius: 8px;
            }
            h1 {
              margin: 0 0 4px;
              font-size: 26px;
              letter-spacing: -0.01em;
            }
            .brand {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.18em;
              color: #c97b4a;
              font-weight: 700;
            }
            .meta {
              display: flex; justify-content: space-between;
              border-top: 1px solid #eee; border-bottom: 1px solid #eee;
              padding: 16px 0; margin: 24px 0;
              font-size: 13px;
            }
            table {
              width: 100%%; border-collapse: collapse;
              margin: 16px 0 24px;
            }
            th, td { padding: 10px 8px; text-align: left; font-size: 14px; }
            tr { border-bottom: 1px solid #eee; }
            th { background: #faf7f2; }
            .amount {
              font-size: 30px; font-weight: 700; color: #1f4339;
              text-align: right;
            }
            .signature {
              margin-top: 56px; display: flex; justify-content: space-between;
            }
            .sig-block {
              width: 220px; border-top: 1px solid #999; padding-top: 8px;
              font-size: 12px; text-align: center;
            }
            .footer {
              margin-top: 40px; padding-top: 16px; border-top: 1px dashed #ccc;
              font-size: 11px; color: #777; text-align: center;
            }
            @media print {
              body { background: #fff; padding: 0; }
              .sheet { box-shadow: none; padding: 32px; }
              .print-bar { display: none !important; }
            }
            .print-bar {
              text-align: center; margin-bottom: 16px;
            }
            .print-bar button {
              background: #1f4339; color: #fff; border: 0;
              padding: 10px 20px; border-radius: 999px; font-weight: 700;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <div class="print-bar">
            <button onclick="window.print()">🖨 Print / Save as PDF</button>
          </div>
          <div class="sheet">
            <p class="brand">Rent and Beyond — Trust-first rentals</p>
            <h1>Rent Receipt</h1>
            <p style="color:#666;margin:4px 0 0;font-size:13px;">For tax / HRA filing purposes</p>

            <div class="meta">
              <div><strong>Receipt no:</strong> %s</div>
              <div><strong>Issued:</strong> %s</div>
            </div>

            <table>
              <tr><th>Tenant</th><td>%s</td></tr>
              <tr><th>Property</th><td>%s</td></tr>
              <tr><th>Address</th><td>%s</td></tr>
              <tr><th>Period</th><td>%s — %s</td></tr>
              <tr><th>Owner / Landlord</th><td>%s</td></tr>
            </table>

            %s

            <p style="margin:32px 0 4px;font-size:14px;">Received the sum of</p>
            <p style="font-size:18px;color:#1f4339;font-weight:600;margin:0 0 4px;">
              ₹ %s only
            </p>
            <p style="color:#666;font-size:13px;margin:0 0 16px;">(%s)</p>
            <p class="amount">₹ %s</p>
            <p style="text-align:right;color:#666;font-size:12px;margin-top:-12px;">
              towards rent for %s
            </p>

            <div class="signature">
              <div class="sig-block">Tenant signature<br/>%s</div>
              <div class="sig-block">Owner signature<br/>%s</div>
            </div>

            <div class="footer">
              Lease id %s · Generated on testition.tech · This receipt is system-generated for the period above.
            </div>
          </div>
        </body>
        </html>
        """.formatted(
            monthLabel,
            escape(receiptNo),
            today,
            escape(tenantName),
            escape(listingTitle.isBlank() ? "Rented property" : listingTitle),
            escape(safeAddress),
            periodStart.format(DateTimeFormatter.ofPattern("dd MMM yyyy")),
            periodEnd.format(DateTimeFormatter.ofPattern("dd MMM yyyy")),
            escape(ownerName),
            panLine,
            formattedRent,
            inWords,
            formattedRent,
            monthLabel,
            escape(tenantName),
            escape(ownerName),
            escape(leaseId)
        );
  }

  private String escape(String s) {
    if (s == null) return "";
    return s
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;");
  }

  /** Very simple INR-in-words for receipts. Handles up to 99,99,99,999. */
  private String numberToWordsRupees(long amount) {
    if (amount <= 0) return "Zero rupees";
    String[] ones = {"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"};
    String[] tens = {"", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"};

    java.util.function.LongFunction<String> twoDigits = (long n) -> {
      if (n < 20) return ones[(int) n];
      return (tens[(int) (n / 10)] + (n % 10 == 0 ? "" : " " + ones[(int) (n % 10)])).trim();
    };
    java.util.function.LongFunction<String> threeDigits = (long n) -> {
      String s = "";
      if (n >= 100) {
        s += ones[(int) (n / 100)] + " Hundred";
        n %= 100;
        if (n > 0) s += " ";
      }
      if (n > 0) s += twoDigits.apply(n);
      return s;
    };

    long crore = amount / 10000000;
    long lakh = (amount / 100000) % 100;
    long thousand = (amount / 1000) % 100;
    long rest = amount % 1000;

    StringBuilder out = new StringBuilder();
    if (crore > 0) out.append(twoDigits.apply(crore)).append(" Crore ");
    if (lakh > 0) out.append(twoDigits.apply(lakh)).append(" Lakh ");
    if (thousand > 0) out.append(twoDigits.apply(thousand)).append(" Thousand ");
    if (rest > 0) out.append(threeDigits.apply(rest));
    out.append(" Rupees only");
    return out.toString().replaceAll("\\s+", " ").trim();
  }
}
