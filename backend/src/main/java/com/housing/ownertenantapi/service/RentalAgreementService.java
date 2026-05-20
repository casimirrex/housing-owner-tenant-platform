package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.RentalAgreementCreateRequest;
import com.housing.ownertenantapi.dto.RentalAgreementResponse;
import com.housing.ownertenantapi.dto.RentalAgreementSummary;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Rental Agreement — digital lease between owner + tenant.
 *
 * Lifecycle:
 *   DRAFT               — owner is iterating; not yet sent
 *   AWAITING_SIGNATURES — sent; needs both parties to accept
 *   ACTIVE              — both signed; lease is in force
 *   EXPIRED             — lease_end_date passed, no renewal
 *   TERMINATED          — broken early (notice period or mutual)
 *
 * PDF is NOT generated server-side. The htmlBody field in the response can
 * be rendered in any browser and exported via the native print dialog
 * (Cmd+P → Save as PDF). Zero third-party library dependency.
 */
@Service
public class RentalAgreementService {

  private static final Logger log = LoggerFactory.getLogger(RentalAgreementService.class);
  private static final SecureRandom RND = new SecureRandom();
  private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ofPattern("d MMMM yyyy");

  private final JdbcTemplate jdbc;
  private final AuditLogService auditLog;

  public RentalAgreementService(JdbcTemplate jdbc, AuditLogService auditLog) {
    this.jdbc = jdbc;
    this.auditLog = auditLog;
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  @Transactional
  public RentalAgreementResponse create(String ownerUserId, RentalAgreementCreateRequest req) {
    // Owner-side validation: caller must own this listing.
    Boolean ownsListing = jdbc.query(
        "SELECT 1 FROM listings WHERE listing_id = ? AND owner_id = ?",
        (org.springframework.jdbc.core.ResultSetExtractor<Boolean>) rs -> rs.next(),
        req.propertyId(), ownerUserId
    );
    if (!Boolean.TRUE.equals(ownsListing)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          "You do not own this listing.");
    }

    // Tenant must exist + be in TENANT role.
    Boolean tenantOk = jdbc.query(
        "SELECT 1 FROM users WHERE user_id = ? AND role = 'TENANT'",
        (org.springframework.jdbc.core.ResultSetExtractor<Boolean>) rs -> rs.next(),
        req.tenantId()
    );
    if (!Boolean.TRUE.equals(tenantOk)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Tenant not found.");
    }

    if (!req.leaseEndDate().isAfter(req.leaseStartDate())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Lease end date must be after start date.");
    }

    String agreementId = "agr_" + randomHex(12);
    int notice = req.noticePeriodDays() == null ? 60 : req.noticePeriodDays();

    jdbc.update(
        "INSERT INTO rental_agreements ("
            + "  agreement_id, property_id, owner_id, tenant_id, "
            + "  monthly_rent_paise, deposit_paise, lease_start_date, lease_end_date, "
            + "  notice_period_days, status, additional_terms"
            + ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?)",
        agreementId, req.propertyId(), ownerUserId, req.tenantId(),
        req.monthlyRentPaise(), req.depositPaise(),
        java.sql.Date.valueOf(req.leaseStartDate()),
        java.sql.Date.valueOf(req.leaseEndDate()),
        notice, req.additionalTerms()
    );

    auditLog.record(ownerUserId, "OWNER", "rental_agreement.created",
        "rental_agreement", agreementId, null);
    return loadById(agreementId, ownerUserId);
  }

  // ─── Read ─────────────────────────────────────────────────────────────────

  public RentalAgreementResponse loadById(String agreementId, String viewerUserId) {
    RentalAgreementResponse r = jdbc.query(
        rowSql() + " WHERE a.agreement_id = ?",
        (org.springframework.jdbc.core.ResultSetExtractor<RentalAgreementResponse>)
        rs -> rs.next() ? mapRow(rs) : null,
        agreementId
    );
    if (r == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Agreement not found.");
    }
    if (!r.ownerId().equals(viewerUserId) && !r.tenantId().equals(viewerUserId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorised for this agreement.");
    }
    return r;
  }

  public List<RentalAgreementSummary> listForUser(String userId, String role) {
    String filter = "OWNER".equals(role)
        ? "a.owner_id = ?"
        : "a.tenant_id = ?";
    String counterpartyJoin = "OWNER".equals(role)
        ? "JOIN users uc ON uc.user_id = a.tenant_id "
        : "JOIN users uc ON uc.user_id = a.owner_id ";
    String counterpartyRole = "OWNER".equals(role) ? "TENANT" : "OWNER";

    return jdbc.query(
        "SELECT a.agreement_id, a.property_id, l.title AS property_title, "
            + "       uc.full_name AS counterparty_name, "
            + "       a.monthly_rent_paise, a.lease_start_date, a.lease_end_date, "
            + "       a.status, a.created_at "
            + "  FROM rental_agreements a "
            + "  JOIN listings l ON l.listing_id = a.property_id "
            + "  " + counterpartyJoin
            + " WHERE " + filter
            + " ORDER BY a.created_at DESC",
        (rs, i) -> new RentalAgreementSummary(
            rs.getString("agreement_id"),
            rs.getString("property_id"),
            rs.getString("property_title"),
            rs.getString("counterparty_name"),
            counterpartyRole,
            rs.getLong("monthly_rent_paise"),
            rs.getDate("lease_start_date").toLocalDate(),
            rs.getDate("lease_end_date").toLocalDate(),
            rs.getString("status"),
            toOffset(rs.getTimestamp("created_at"))
        ),
        userId
    );
  }

  // ─── State transitions ─────────────────────────────────────────────────────

  @Transactional
  public RentalAgreementResponse send(String agreementId, String ownerUserId) {
    RentalAgreementResponse current = loadById(agreementId, ownerUserId);
    if (!current.ownerId().equals(ownerUserId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner can send for signatures.");
    }
    if (!"DRAFT".equals(current.status())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Agreement is not a draft.");
    }
    jdbc.update("UPDATE rental_agreements SET status = 'AWAITING_SIGNATURES', updated_at = now() "
            + "WHERE agreement_id = ?", agreementId);
    auditLog.record(ownerUserId, "OWNER", "rental_agreement.sent",
        "rental_agreement", agreementId, null);
    return loadById(agreementId, ownerUserId);
  }

  @Transactional
  public RentalAgreementResponse accept(String agreementId, String userId) {
    RentalAgreementResponse current = loadById(agreementId, userId);
    if (!"AWAITING_SIGNATURES".equals(current.status())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Agreement is not awaiting signatures.");
    }
    boolean isOwner = current.ownerId().equals(userId);
    boolean isTenant = current.tenantId().equals(userId);
    if (!isOwner && !isTenant) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a party to this agreement.");
    }
    String column = isOwner ? "owner_accepted_at" : "tenant_accepted_at";
    jdbc.update("UPDATE rental_agreements SET " + column + " = now(), updated_at = now() "
            + "WHERE agreement_id = ?", agreementId);

    // If both sides accepted → ACTIVE.
    RentalAgreementResponse afterUpdate = loadById(agreementId, userId);
    if (afterUpdate.ownerAcceptedAt() != null && afterUpdate.tenantAcceptedAt() != null) {
      jdbc.update("UPDATE rental_agreements SET status = 'ACTIVE', updated_at = now() "
              + "WHERE agreement_id = ?", agreementId);
      afterUpdate = loadById(agreementId, userId);
    }
    auditLog.record(userId, isOwner ? "OWNER" : "TENANT",
        "rental_agreement.accepted", "rental_agreement", agreementId, null);
    return afterUpdate;
  }

  @Transactional
  public RentalAgreementResponse terminate(String agreementId, String userId) {
    RentalAgreementResponse current = loadById(agreementId, userId);
    if (!"ACTIVE".equals(current.status())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Only active agreements can be terminated.");
    }
    boolean isOwner = current.ownerId().equals(userId);
    jdbc.update("UPDATE rental_agreements SET status = 'TERMINATED', updated_at = now() "
            + "WHERE agreement_id = ?", agreementId);
    auditLog.record(userId, isOwner ? "OWNER" : "TENANT",
        "rental_agreement.terminated", "rental_agreement", agreementId, null);
    return loadById(agreementId, userId);
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private static String rowSql() {
    return "SELECT a.agreement_id, a.property_id, l.title AS property_title, "
        + "       l.locality AS property_locality, l.city AS property_city, "
        + "       a.owner_id, uo.full_name AS owner_name, "
        + "       a.tenant_id, ut.full_name AS tenant_name, "
        + "       a.monthly_rent_paise, a.deposit_paise, "
        + "       a.lease_start_date, a.lease_end_date, a.notice_period_days, "
        + "       a.status, a.owner_accepted_at, a.tenant_accepted_at, "
        + "       a.additional_terms, a.created_at, a.updated_at "
        + "  FROM rental_agreements a "
        + "  JOIN listings l ON l.listing_id = a.property_id "
        + "  JOIN users uo ON uo.user_id = a.owner_id "
        + "  JOIN users ut ON ut.user_id = a.tenant_id ";
  }

  private RentalAgreementResponse mapRow(java.sql.ResultSet rs) throws java.sql.SQLException {
    String agreementId = rs.getString("agreement_id");
    String propertyTitle = rs.getString("property_title");
    String propertyLocality = rs.getString("property_locality");
    String propertyCity = rs.getString("property_city");
    String ownerName = rs.getString("owner_name");
    String tenantName = rs.getString("tenant_name");
    long rent = rs.getLong("monthly_rent_paise");
    long deposit = rs.getLong("deposit_paise");
    LocalDate start = rs.getDate("lease_start_date").toLocalDate();
    LocalDate end = rs.getDate("lease_end_date").toLocalDate();
    int notice = rs.getInt("notice_period_days");
    String status = rs.getString("status");
    OffsetDateTime ownerAccepted = toOffset(rs.getTimestamp("owner_accepted_at"));
    OffsetDateTime tenantAccepted = toOffset(rs.getTimestamp("tenant_accepted_at"));
    String additional = rs.getString("additional_terms");
    OffsetDateTime created = toOffset(rs.getTimestamp("created_at"));
    OffsetDateTime updated = toOffset(rs.getTimestamp("updated_at"));

    String html = renderHtml(
        agreementId, propertyTitle, propertyLocality, propertyCity,
        ownerName, tenantName, rent, deposit, start, end, notice,
        additional, ownerAccepted, tenantAccepted, status
    );

    return new RentalAgreementResponse(
        agreementId, rs.getString("property_id"), propertyTitle, propertyLocality, propertyCity,
        rs.getString("owner_id"), ownerName,
        rs.getString("tenant_id"), tenantName,
        rent, deposit, start, end, notice, status,
        ownerAccepted, tenantAccepted, additional, created, updated, html
    );
  }

  /**
   * Render the agreement as static HTML. Browser's native print dialog
   * (Cmd+P / Ctrl+P) handles PDF export — zero server-side PDF dependency.
   */
  private static String renderHtml(
      String agreementId, String propertyTitle, String locality, String city,
      String ownerName, String tenantName, long rentPaise, long depositPaise,
      LocalDate start, LocalDate end, int noticeDays,
      String additionalTerms,
      OffsetDateTime ownerAccepted, OffsetDateTime tenantAccepted,
      String status
  ) {
    String rentInr = formatInr(rentPaise);
    String depositInr = formatInr(depositPaise);
    String startStr = start.format(DAY_FMT);
    String endStr = end.format(DAY_FMT);
    String ownerSig = ownerAccepted != null ? ownerName + " — accepted " + ownerAccepted.toLocalDate() : "[ pending ]";
    String tenantSig = tenantAccepted != null ? tenantName + " — accepted " + tenantAccepted.toLocalDate() : "[ pending ]";

    return """
      <!doctype html><html><head><meta charset="utf-8"/>
      <title>Rental Agreement %s</title>
      <style>
        body { font: 14px/1.55 'Manrope', 'Helvetica Neue', sans-serif; color: #0F1B2D; max-width: 760px; margin: 32px auto; padding: 0 24px; }
        h1 { font-family: 'Libre Baskerville', serif; font-size: 28px; margin-bottom: 8px; }
        h2 { font-size: 16px; margin-top: 28px; }
        .meta { color: #4a5568; font-size: 12px; margin-bottom: 24px; }
        .signers { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .sig { border-top: 1px solid #cbd5e0; padding-top: 8px; font-size: 12px; }
        @media print { body { margin: 0; padding: 12mm; } .no-print { display: none; } }
      </style></head>
      <body>
        <h1>Rental Agreement</h1>
        <p class="meta">Agreement ID: %s · Status: %s</p>

        <p>This agreement is made between <strong>%s</strong> ("Owner") and
        <strong>%s</strong> ("Tenant") for the rental of the property described below.</p>

        <h2>1. Property</h2>
        <p>%s, %s, %s.</p>

        <h2>2. Term</h2>
        <p>The lease commences on <strong>%s</strong> and ends on <strong>%s</strong>,
        unless terminated earlier per Section 5.</p>

        <h2>3. Rent and Deposit</h2>
        <p>Monthly rent: <strong>%s</strong>, payable on or before the 5th of each month.</p>
        <p>Security deposit: <strong>%s</strong>, refundable within 30 days of vacation,
        less any agreed deductions.</p>

        <h2>4. Notice Period</h2>
        <p>Either party may terminate with <strong>%d days</strong> written notice.</p>

        <h2>5. Termination</h2>
        <p>Early termination requires the notice period in Section 4 OR mutual written
        consent. Owner may terminate without notice in case of unpaid rent over 30 days
        or material breach of property covenants.</p>

        <h2>6. Maintenance</h2>
        <p>Owner is responsible for structural, plumbing, and electrical repairs.
        Tenant is responsible for day-to-day upkeep and any damage beyond fair use.</p>

        %s

        <div class="signers">
          <div class="sig"><strong>Owner</strong><br/>%s</div>
          <div class="sig"><strong>Tenant</strong><br/>%s</div>
        </div>

        <p class="meta" style="margin-top:32px">Generated by Testition · Rent Beyond. To save as PDF, use your browser's Print dialog (Cmd+P / Ctrl+P) and choose "Save as PDF".</p>
      </body></html>
    """.formatted(
        escape(agreementId), escape(agreementId), escape(status),
        escape(ownerName), escape(tenantName),
        escape(propertyTitle), escape(locality), escape(city),
        startStr, endStr,
        rentInr, depositInr,
        noticeDays,
        additionalTerms == null || additionalTerms.isBlank()
            ? ""
            : "<h2>7. Additional Terms</h2><p>" + escape(additionalTerms) + "</p>",
        escape(ownerSig), escape(tenantSig)
    );
  }

  private static String formatInr(long paise) {
    long rupees = paise / 100;
    long subRupee = paise % 100;
    String body = String.format("%,d", rupees);
    return subRupee == 0
        ? "Rs " + body
        : "Rs " + body + "." + String.format("%02d", subRupee);
  }

  private static String escape(String s) {
    return s == null ? "" : s
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;");
  }

  private static OffsetDateTime toOffset(Timestamp ts) {
    return ts == null ? null : ts.toInstant().atOffset(ZoneOffset.UTC);
  }

  private static String randomHex(int byteCount) {
    byte[] buf = new byte[byteCount];
    RND.nextBytes(buf);
    return HexFormat.of().formatHex(buf);
  }
}
