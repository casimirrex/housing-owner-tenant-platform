package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Available visit slots response")
public record VisitSlotsResponse(
    @Schema(description = "Available slots")
    List<VisitSlotResponse> slots,
    @Schema(description = "Time zone used for slots", example = "Asia/Kolkata")
    String timeZone,
    @Schema(description = "Rules users should follow for visits")
    List<String> visitRules
) {
}
