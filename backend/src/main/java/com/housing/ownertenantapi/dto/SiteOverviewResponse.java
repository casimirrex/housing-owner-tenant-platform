package com.housing.ownertenantapi.dto;

import java.util.List;

public record SiteOverviewResponse(
    String eyebrow,
    String title,
    String description,
    List<String> launchCities,
    List<JourneyPhase> journeyPhases,
    List<String> shippingNotes
) {
}
