package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.BackendLayerResponse;
import com.housing.ownertenantapi.dto.PageBlueprintResponse;
import com.housing.ownertenantapi.dto.ProductPageCatalogResponse;
import com.housing.ownertenantapi.dto.SiteOverviewResponse;
import com.housing.ownertenantapi.dto.SupportEnquiryRequest;
import com.housing.ownertenantapi.dto.SupportEnquiryResponse;
import com.housing.ownertenantapi.dto.WebContentPageResponse;
import com.housing.ownertenantapi.service.SiteContentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(
    name = "Site Content",
    description = "Endpoints that provide dynamic website blueprint and backend stack data"
)
public class SiteContentController {

  private final SiteContentService siteContentService;

  public SiteContentController(SiteContentService siteContentService) {
    this.siteContentService = siteContentService;
  }

  @GetMapping("/site-overview")
  @Operation(
      summary = "Get site overview",
      description = "Returns the hero content, launch cities, user journey phases, and shipping notes"
  )
  public SiteOverviewResponse getSiteOverview() {
    return siteContentService.getOverview();
  }

  @GetMapping("/site-pages")
  @Operation(
      summary = "Get page blueprint",
      description = "Returns the required and recommended pages for the owner-tenant website"
  )
  public PageBlueprintResponse getSitePages() {
    return siteContentService.getPageBlueprint();
  }

  @GetMapping("/product-pages")
  @Operation(
      summary = "Get product page catalog",
      description = "Returns the detailed product page inventory with page name, purpose, and planning source"
  )
  public ProductPageCatalogResponse getProductPages() {
    return siteContentService.getProductPages();
  }

  @GetMapping("/tech-stack/backend")
  @Operation(
      summary = "Get backend layer recommendation",
      description = "Returns the backend layer, recommended tech stack, and its purpose"
  )
  public BackendLayerResponse getBackendLayer() {
    return siteContentService.getBackendLayer();
  }

  @GetMapping("/web-content/{slug}")
  @Operation(
      summary = "Get a dynamic web content page",
      description = "Returns backend-driven content for informational, support, legal, or authentication web pages"
  )
  public WebContentPageResponse getWebContentPage(@PathVariable String slug) {
    return siteContentService.getWebContentPage(slug);
  }

  @PostMapping("/support/enquiries")
  @Operation(
      summary = "Submit a support enquiry",
      description = "Captures a contact or support enquiry from the web application"
  )
  public SupportEnquiryResponse submitSupportEnquiry(@Valid @RequestBody SupportEnquiryRequest request) {
    return siteContentService.submitSupportEnquiry(request);
  }
}
