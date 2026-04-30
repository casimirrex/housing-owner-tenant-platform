package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "FAQ item for a property")
public record PropertyFaqItemResponse(
    @Schema(description = "Question", example = "Is the property available for families?")
    String question,
    @Schema(description = "Answer", example = "Yes, the owner is open to family tenants.")
    String answer
) {
}
