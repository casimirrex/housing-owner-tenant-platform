package com.housing.ownertenantapi.util;

import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class CityCatalog {

  private static final CityDefinition BENGALURU = new CityDefinition(
      "Bengaluru",
      List.of("bengaluru", "bangalore")
  );
  private static final CityDefinition PUNE = new CityDefinition(
      "Pune",
      List.of("pune")
  );
  private static final CityDefinition HYDERABAD = new CityDefinition(
      "Hyderabad",
      List.of("hyderabad")
  );
  private static final CityDefinition CHENNAI = new CityDefinition(
      "Chennai",
      List.of("chennai", "madras")
  );
  private static final CityDefinition NCR_DELHI = new CityDefinition(
      "NCR-Delhi",
      List.of("ncr-delhi", "ncr", "delhi", "new delhi", "gurgaon", "gurugram", "noida", "ghaziabad", "faridabad")
  );

  private static final Map<String, CityDefinition> CITY_BY_ALIAS = Map.ofEntries(
      Map.entry("bengaluru", BENGALURU),
      Map.entry("bangalore", BENGALURU),
      Map.entry("pune", PUNE),
      Map.entry("hyderabad", HYDERABAD),
      Map.entry("chennai", CHENNAI),
      Map.entry("madras", CHENNAI),
      Map.entry("ncr-delhi", NCR_DELHI),
      Map.entry("ncr", NCR_DELHI),
      Map.entry("delhi", NCR_DELHI),
      Map.entry("new delhi", NCR_DELHI),
      Map.entry("gurgaon", NCR_DELHI),
      Map.entry("gurugram", NCR_DELHI),
      Map.entry("noida", NCR_DELHI),
      Map.entry("ghaziabad", NCR_DELHI),
      Map.entry("faridabad", NCR_DELHI)
  );

  private static final Map<String, CityDefinition> CITY_BY_CANONICAL = Map.of(
      BENGALURU.canonical(), BENGALURU,
      PUNE.canonical(), PUNE,
      HYDERABAD.canonical(), HYDERABAD,
      CHENNAI.canonical(), CHENNAI,
      NCR_DELHI.canonical(), NCR_DELHI
  );

  private CityCatalog() {
  }

  public static String canonicalize(String city) {
    if (city == null || city.isBlank()) {
      return null;
    }

    String normalized = city.trim().toLowerCase(Locale.ROOT);
    CityDefinition definition = CITY_BY_ALIAS.get(normalized);
    return definition != null ? definition.canonical() : city.trim();
  }

  public static List<String> aliasesFor(String city) {
    String canonicalCity = canonicalize(city);
    if (canonicalCity == null) {
      return List.of();
    }

    CityDefinition definition = CITY_BY_CANONICAL.get(canonicalCity);
    if (definition != null) {
      return definition.aliases();
    }

    return List.of(canonicalCity.toLowerCase(Locale.ROOT));
  }

  private record CityDefinition(
      String canonical,
      List<String> aliases
  ) {
  }
}
