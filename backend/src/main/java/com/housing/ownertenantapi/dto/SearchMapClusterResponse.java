package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Clustered result for a map search")
public record SearchMapClusterResponse(
    @Schema(description = "Cluster id", example = "cluster_bengaluru_core")
    String clusterId,
    @Schema(description = "Cluster latitude", example = "12.9716")
    double lat,
    @Schema(description = "Cluster longitude", example = "77.5946")
    double lng,
    @Schema(description = "Number of listings in the cluster", example = "3")
    int count,
    @Schema(description = "Cluster label", example = "Central Bengaluru")
    String label
) {
}
