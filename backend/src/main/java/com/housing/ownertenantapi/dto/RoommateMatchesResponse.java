package com.housing.ownertenantapi.dto;

import java.util.List;

public record RoommateMatchesResponse(
    List<RoommateProfile> items,
    int totalCount
) {
}
