package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "A dynamic content section for a web page")
public record WebContentSectionResponse(
    @Schema(description = "Section heading", example = "Search with more context")
    String heading,
    @Schema(description = "Section body copy", example = "Start from city, locality, landmark, office corridor, or lifestyle preference.")
    String body,
    @Schema(description = "Bulleted items within the section")
    List<String> bullets
) {
}
