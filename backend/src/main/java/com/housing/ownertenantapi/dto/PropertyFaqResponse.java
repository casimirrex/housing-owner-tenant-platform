package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "FAQ block for a property detail page")
public record PropertyFaqResponse(
    @Schema(description = "Frequently asked questions")
    List<PropertyFaqItemResponse> faqItems
) {
}
