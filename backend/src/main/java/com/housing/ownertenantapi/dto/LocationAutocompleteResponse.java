package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Location autocomplete response")
public record LocationAutocompleteResponse(
    @Schema(description = "Suggested areas, landmarks, and offices")
    List<LocationSuggestionResponse> suggestions
) {
}
