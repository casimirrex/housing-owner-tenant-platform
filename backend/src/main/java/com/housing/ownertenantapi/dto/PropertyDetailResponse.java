package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Main property detail page payload")
public record PropertyDetailResponse(
    @Schema(description = "Primary property information")
    PropertyCoreResponse property,
    @Schema(description = "Pricing information")
    PropertyPricingResponse pricing,
    @Schema(description = "Property specifications")
    PropertySpecsResponse specs,
    @Schema(description = "Amenities available at the property")
    List<String> amenities,
    @Schema(description = "Trust and verification metadata")
    PropertyTrustSignalsResponse trustSignals,
    @Schema(description = "Owner information")
    PropertyOwnerInfoResponse ownerInfo,
    @Schema(description = "CTA availability flags")
    PropertyCtaFlagsResponse ctaFlags,
    @Schema(description = "Viewer access state for premium gating")
    PropertyViewerAccessResponse viewerAccess
) {
}
