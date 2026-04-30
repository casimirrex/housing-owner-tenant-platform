package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.BackendLayerResponse;
import com.housing.ownertenantapi.dto.JourneyPhase;
import com.housing.ownertenantapi.dto.PageBlueprintItem;
import com.housing.ownertenantapi.dto.PageBlueprintResponse;
import com.housing.ownertenantapi.dto.ProductPageCatalogItem;
import com.housing.ownertenantapi.dto.ProductPageCatalogResponse;
import com.housing.ownertenantapi.dto.SiteOverviewResponse;
import com.housing.ownertenantapi.dto.SupportEnquiryRequest;
import com.housing.ownertenantapi.dto.SupportEnquiryResponse;
import com.housing.ownertenantapi.dto.WebContentPageResponse;
import com.housing.ownertenantapi.dto.WebContentSectionResponse;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

@Service
public class SiteContentService {

  private static final String OVERVIEW_KEY = "default";

  private final JdbcClient jdbcClient;

  public SiteContentService(JdbcTemplate jdbcTemplate) {
    this.jdbcClient = JdbcClient.create(jdbcTemplate);
  }

  public SiteOverviewResponse getOverview() {
    SiteOverviewResponse base = jdbcClient.sql("""
            SELECT eyebrow, title, description
            FROM site_overview
            WHERE overview_key = :overviewKey
            """)
        .param("overviewKey", OVERVIEW_KEY)
        .query((rs, rowNum) -> new SiteOverviewResponse(
            rs.getString("eyebrow"),
            rs.getString("title"),
            rs.getString("description"),
            List.of(),
            List.of(),
            List.of()
        ))
        .single();

    List<String> launchCities = jdbcClient.sql("""
            SELECT city
            FROM site_overview_launch_city
            WHERE overview_key = :overviewKey
            ORDER BY sort_order
            """)
        .param("overviewKey", OVERVIEW_KEY)
        .query(String.class)
        .list();

    List<JourneyPhase> journeyPhases = jdbcClient.sql("""
            SELECT label, detail
            FROM site_overview_journey_phase
            WHERE overview_key = :overviewKey
            ORDER BY sort_order
            """)
        .param("overviewKey", OVERVIEW_KEY)
        .query((rs, rowNum) -> new JourneyPhase(
            rs.getString("label"),
            rs.getString("detail")
        ))
        .list();

    List<String> shippingNotes = jdbcClient.sql("""
            SELECT note
            FROM site_overview_shipping_note
            WHERE overview_key = :overviewKey
            ORDER BY sort_order
            """)
        .param("overviewKey", OVERVIEW_KEY)
        .query(String.class)
        .list();

    return new SiteOverviewResponse(
        base.eyebrow(),
        base.title(),
        base.description(),
        launchCities,
        journeyPhases,
        shippingNotes
    );
  }

  public PageBlueprintResponse getPageBlueprint() {
    List<PageBlueprintItem> items = jdbcClient.sql("""
            SELECT page, purpose, status
            FROM page_blueprint
            ORDER BY sort_order
            """)
        .query((rs, rowNum) -> new PageBlueprintItem(
            rs.getString("page"),
            rs.getString("purpose"),
            rs.getString("status")
        ))
        .list();

    return new PageBlueprintResponse(items);
  }

  public ProductPageCatalogResponse getProductPages() {
    List<ProductPageCatalogItem> items = jdbcClient.sql("""
            SELECT page, purpose, source
            FROM product_page_catalog
            ORDER BY sort_order
            """)
        .query((rs, rowNum) -> new ProductPageCatalogItem(
            rs.getString("page"),
            rs.getString("purpose"),
            rs.getString("source")
        ))
        .list();

    return new ProductPageCatalogResponse(items);
  }

  public BackendLayerResponse getBackendLayer() {
    return jdbcClient.sql("""
            SELECT layer, recommended_tech_stack, purpose
            FROM backend_layer
            WHERE layer = 'Backend'
            """)
        .query((rs, rowNum) -> new BackendLayerResponse(
            rs.getString("layer"),
            rs.getString("recommended_tech_stack"),
            rs.getString("purpose")
        ))
        .single();
  }

  public WebContentPageResponse getWebContentPage(String slug) {
    WebContentPageResponse base = jdbcClient.sql("""
            SELECT slug, eyebrow, title, description, page_type, cta_label, cta_href, updated_at
            FROM web_content_page
            WHERE slug = :slug
            """)
        .param("slug", slug)
        .query((rs, rowNum) -> new WebContentPageResponse(
            rs.getString("slug"),
            rs.getString("eyebrow"),
            rs.getString("title"),
            rs.getString("description"),
            rs.getString("page_type"),
            rs.getString("cta_label"),
            rs.getString("cta_href"),
            rs.getObject("updated_at", OffsetDateTime.class).toString(),
            List.of()
        ))
        .single();

    Map<Integer, List<String>> bulletsBySection = new LinkedHashMap<>();
    jdbcClient.sql("""
            SELECT section_sort_order, bullet
            FROM web_content_bullet
            WHERE slug = :slug
            ORDER BY section_sort_order, bullet_sort_order
            """)
        .param("slug", slug)
        .query((rs, rowNum) -> Map.entry(rs.getInt("section_sort_order"), rs.getString("bullet")))
        .list()
        .forEach(entry -> bulletsBySection.computeIfAbsent(entry.getKey(), ignored -> new java.util.ArrayList<>()).add(entry.getValue()));

    List<WebContentSectionResponse> sections = jdbcClient.sql("""
            SELECT sort_order, heading, body
            FROM web_content_section
            WHERE slug = :slug
            ORDER BY sort_order
            """)
        .param("slug", slug)
        .query((rs, rowNum) -> new WebContentSectionResponse(
            rs.getString("heading"),
            rs.getString("body"),
            bulletsBySection.getOrDefault(rs.getInt("sort_order"), List.of())
        ))
        .list();

    return new WebContentPageResponse(
        base.slug(),
        base.eyebrow(),
        base.title(),
        base.description(),
        base.pageType(),
        base.ctaLabel(),
        base.ctaHref(),
        base.updatedAt(),
        sections
    );
  }

  public SupportEnquiryResponse submitSupportEnquiry(SupportEnquiryRequest request) {
    String enquiryId = "support_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    OffsetDateTime createdAt = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);

    jdbcClient.sql("""
            INSERT INTO support_enquiry (
              enquiry_id, full_name, email, phone_number, city, message, status, created_at
            )
            VALUES (
              :enquiryId, :fullName, :email, :phoneNumber, :city, :message, 'SUBMITTED', :createdAt
            )
            """)
        .param("enquiryId", enquiryId)
        .param("fullName", request.fullName())
        .param("email", request.email())
        .param("phoneNumber", request.phoneNumber())
        .param("city", request.city())
        .param("message", request.message())
        .param("createdAt", createdAt)
        .update();

    return new SupportEnquiryResponse(
        enquiryId,
        "SUBMITTED",
        "Support enquiry submitted successfully.",
        createdAt.toString()
    );
  }
}
