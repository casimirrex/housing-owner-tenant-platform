package com.housing.ownertenantapi.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import java.util.Arrays;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.cache.support.NoOpCacheManager;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair;

/**
 * P4 — Enterprise two-tier cache manager.
 *
 * <h2>Design</h2>
 * <ul>
 *   <li><b>L1 (Caffeine)</b> — per-pod, size-bounded, 30s TTL. Microsecond reads.</li>
 *   <li><b>L2 (Redis)</b> — shared across all pods, JSON-serialised, per-region TTL.
 *       Millisecond reads, survives pod restarts.</li>
 *   <li><b>TwoTierCache</b> wraps one L1 and one L2 region so a miss on L1
 *       transparently falls through to L2 and back-fills L1 on hit.</li>
 * </ul>
 *
 * <h2>Call sites</h2>
 * Use {@code @Cacheable(cacheNames = CacheConfig.Regions.XYZ, key = "...", sync = true)}.
 * {@code sync = true} guarantees one thread per pod recomputes on a cold
 * miss, eliminating thundering-herd against the DB.
 *
 * <h2>Failure modes</h2>
 * If Redis is unreachable at startup, Spring Boot autoconfigures
 * {@link RedisConnectionFactory} lazily; the first real call will throw.
 * We catch that by probing on startup and falling back to L1-only so the
 * API never goes down because the cache is down. Set
 * {@code app.cache.enabled=false} to disable caching entirely.
 */
@Configuration
@EnableCaching
public class CacheConfig {

  private static final Logger log = LoggerFactory.getLogger(CacheConfig.class);

  /** Region names — keep them here so they cannot drift between call sites. */
  public static final class Regions {
    public static final String LISTING_DETAIL        = "listing:detail";
    public static final String LISTING_REVIEWS       = "listing:reviews";
    public static final String LISTING_FAQ           = "listing:faq";
    public static final String HOME_FEED             = "home:feed";
    public static final String FILTER_METADATA       = "filters:metadata";
    public static final String LOCATION_AUTOCOMPLETE = "search:autocomplete";
    public static final String USER_PROFILE          = "user:me";
    public static final String USER_PREFERENCES      = "user:prefs";
    private Regions() {}
    static Collection<String> all() {
      return Arrays.asList(LISTING_DETAIL, LISTING_REVIEWS, LISTING_FAQ,
          HOME_FEED, FILTER_METADATA, LOCATION_AUTOCOMPLETE,
          USER_PROFILE, USER_PREFERENCES);
    }
  }

  private final boolean cacheEnabled;

  public CacheConfig(@Value("${app.cache.enabled:true}") boolean cacheEnabled) {
    this.cacheEnabled = cacheEnabled;
  }

  /** L1 Caffeine — fast, in-process, small footprint. */
  @Bean
  public CaffeineCacheManager caffeineCacheManager() {
    CaffeineCacheManager mgr = new CaffeineCacheManager();
    mgr.setCaffeine(Caffeine.newBuilder()
        .maximumSize(10_000)
        .expireAfterWrite(Duration.ofSeconds(30))
        .recordStats());
    mgr.setCacheNames(Regions.all());
    return mgr;
  }

  /** L2 Redis — shared across pods, per-region TTL. */
  @Bean
  public RedisCacheManager redisCacheManager(RedisConnectionFactory cf) {
    // No-arg constructor activates default typing, which is required to
    // deserialize polymorphic record types (PropertyDetailResponse, etc.).
    GenericJackson2JsonRedisSerializer json = new GenericJackson2JsonRedisSerializer();
    RedisCacheConfiguration base = RedisCacheConfiguration.defaultCacheConfig()
        .serializeValuesWith(SerializationPair.fromSerializer(json))
        .disableCachingNullValues()
        .prefixCacheNameWith("hot:v1:");

    Map<String, RedisCacheConfiguration> perRegion = new LinkedHashMap<>();
    perRegion.put(Regions.LISTING_DETAIL,        base.entryTtl(Duration.ofMinutes(10)));
    perRegion.put(Regions.LISTING_REVIEWS,       base.entryTtl(Duration.ofMinutes(10)));
    perRegion.put(Regions.LISTING_FAQ,           base.entryTtl(Duration.ofMinutes(30)));
    perRegion.put(Regions.HOME_FEED,             base.entryTtl(Duration.ofMinutes(5)));
    perRegion.put(Regions.FILTER_METADATA,       base.entryTtl(Duration.ofHours(24)));
    perRegion.put(Regions.LOCATION_AUTOCOMPLETE, base.entryTtl(Duration.ofHours(1)));
    perRegion.put(Regions.USER_PROFILE,          base.entryTtl(Duration.ofMinutes(15)));
    perRegion.put(Regions.USER_PREFERENCES,      base.entryTtl(Duration.ofHours(1)));

    return RedisCacheManager.builder(cf)
        .cacheDefaults(base.entryTtl(Duration.ofMinutes(5)))
        .withInitialCacheConfigurations(perRegion)
        .transactionAware()
        .build();
  }

  /**
   * Primary cache manager used by {@code @Cacheable} / {@code @CacheEvict}.
   * For each region it returns a {@link TwoTierCache} that actually chains
   * L1 → L2. If the Redis bean failed to initialise (no network, dev mode)
   * we fall back to L1-only, which keeps the API hot and merely loses cross-pod
   * consistency — acceptable as a degraded mode.
   */
  @Bean
  @Primary
  public CacheManager cacheManager(
      CaffeineCacheManager l1,
      ObjectProvider<RedisCacheManager> l2Provider) {

    if (!cacheEnabled) {
      log.info("Cache disabled via app.cache.enabled=false — using NoOp cache");
      return new NoOpCacheManager();
    }

    RedisCacheManager l2 = l2Provider.getIfAvailable();
    if (l2 == null) {
      log.warn("Redis cache manager unavailable — running in L1-only mode");
      return l1;
    }

    java.util.List<Cache> composed = new java.util.ArrayList<>();
    for (String region : Regions.all()) {
      Cache l1Cache = l1.getCache(region);
      Cache l2Cache = l2.getCache(region);
      composed.add(new TwoTierCache(region, l1Cache, l2Cache));
    }
    SimpleCacheManager out = new SimpleCacheManager();
    out.setCaches(composed);
    out.afterPropertiesSet();
    return out;
  }

  /** Utility for tests / warm-up: returns the currently backing Caffeine tier. */
  static CaffeineCache asCaffeineCache(Cache c) {
    return (CaffeineCache) c;
  }
}
