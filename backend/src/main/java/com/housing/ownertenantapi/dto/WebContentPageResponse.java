package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Dynamic content model for a production web page")
public record WebContentPageResponse(
    @Schema(description = "Page slug", example = "how-it-works")
    String slug,
    @Schema(description = "Eyebrow label", example = "Trust journey")
    String eyebrow,
    @Schema(description = "Page title", example = "How discovery becomes a reliable rental workflow")
    String title,
    @Schema(description = "Page description", example = "This Phase 1 page is driven by backend content.")
    String description,
    @Schema(description = "Page type", example = "INFORMATIONAL")
    String pageType,
    @Schema(description = "Primary CTA label", example = "Start search")
    String ctaLabel,
    @Schema(description = "Primary CTA href", example = "/search")
    String ctaHref,
    @Schema(description = "Last update timestamp", example = "2026-04-09T12:00:00Z")
    String updatedAt,
    @Schema(description = "Page sections")
    List<WebContentSectionResponse> sections
) {
}
