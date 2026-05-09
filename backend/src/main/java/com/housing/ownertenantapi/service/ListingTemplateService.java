package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.ListingTemplateCreate;
import com.housing.ownertenantapi.dto.ListingTemplateItem;
import com.housing.ownertenantapi.dto.ListingTemplateListResponse;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Tier 2 — Listing templates. Owner saves a JSON snapshot of common
 * listing fields and re-uses it via the create-listing form.
 */
@Service
public class ListingTemplateService {

  private static final Logger log = LoggerFactory.getLogger(ListingTemplateService.class);

  private final JdbcTemplate jdbcTemplate;
  private final CurrentSessionService currentSessionService;

  public ListingTemplateService(
      JdbcTemplate jdbcTemplate, CurrentSessionService currentSessionService
  ) {
    this.jdbcTemplate = jdbcTemplate;
    this.currentSessionService = currentSessionService;
  }

  @Transactional
  public ListingTemplateItem create(String authorizationHeader, ListingTemplateCreate request) {
    String ownerId = currentSessionService.requireUserId(authorizationHeader);
    String templateId = "tpl_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    jdbcTemplate.update(
        "INSERT INTO listing_templates (template_id, owner_id, name, payload_json) " +
            "VALUES (?, ?, ?, ?)",
        templateId, ownerId, request.name(), request.payloadJson()
    );
    log.info("listing template saved: id={} owner={}", templateId, ownerId);
    return fetch(templateId, ownerId);
  }

  public ListingTemplateListResponse list(String authorizationHeader) {
    String ownerId = currentSessionService.requireUserId(authorizationHeader);
    List<ListingTemplateItem> items = jdbcTemplate.query(
        "SELECT template_id, owner_id, name, payload_json, " +
            "to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') AS created_at " +
            "FROM listing_templates WHERE owner_id = ? ORDER BY created_at DESC",
        (rs, rowNum) -> new ListingTemplateItem(
            rs.getString("template_id"),
            rs.getString("owner_id"),
            rs.getString("name"),
            rs.getString("payload_json"),
            rs.getString("created_at")
        ),
        ownerId
    );
    return new ListingTemplateListResponse(items, items.size());
  }

  @Transactional
  public void delete(String authorizationHeader, String templateId) {
    String ownerId = currentSessionService.requireUserId(authorizationHeader);
    int rows = jdbcTemplate.update(
        "DELETE FROM listing_templates WHERE template_id = ? AND owner_id = ?",
        templateId, ownerId
    );
    if (rows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Template not found or you don't own it.");
    }
  }

  private ListingTemplateItem fetch(String templateId, String ownerId) {
    try {
      return jdbcTemplate.queryForObject(
          "SELECT template_id, owner_id, name, payload_json, " +
              "to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') AS created_at " +
              "FROM listing_templates WHERE template_id = ? AND owner_id = ?",
          (rs, rowNum) -> new ListingTemplateItem(
              rs.getString("template_id"),
              rs.getString("owner_id"),
              rs.getString("name"),
              rs.getString("payload_json"),
              rs.getString("created_at")
          ),
          templateId, ownerId
      );
    } catch (EmptyResultDataAccessException none) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Template not found");
    }
  }
}
