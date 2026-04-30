package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Catalog of planned product pages")
public record ProductPageCatalogResponse(
    @Schema(description = "Product pages from the current planning inputs")
    List<ProductPageCatalogItem> pages
) {
}
