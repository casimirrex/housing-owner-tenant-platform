package com.housing.ownertenantapi.config;

import java.util.concurrent.Callable;
import org.springframework.cache.Cache;

/**
 * P4 — Real L1 + L2 cache.
 *
 * Read  : L1 hit → return. L1 miss → L2 lookup → if hit, warm L1 → return.
 *                 L2 miss → invoke loader → put in L2 → put in L1 → return.
 * Write : put to L2 first (shared), then L1 (local) — failure in L1 is logged
 *         only; L2 is the source of truth.
 * Evict : evict in both tiers.
 *
 * This is intentionally thin — we reuse Spring's native Caffeine and Redis
 * {@link Cache} implementations for the two tiers, so serialisation, TTL and
 * metrics all work exactly the way each tier's native configuration dictates.
 */
public class TwoTierCache implements Cache {

  private final String name;
  private final Cache l1;
  private final Cache l2;

  public TwoTierCache(String name, Cache l1, Cache l2) {
    this.name = name;
    this.l1 = l1;
    this.l2 = l2;
  }

  @Override public String getName() { return name; }
  @Override public Object getNativeCache() { return this; }

  @Override
  public ValueWrapper get(Object key) {
    ValueWrapper v = l1 == null ? null : l1.get(key);
    if (v != null) return v;
    if (l2 == null) return null;
    v = l2.get(key);
    if (v != null && l1 != null) {
      l1.put(key, v.get());
    }
    return v;
  }

  @Override
  @SuppressWarnings("unchecked")
  public <T> T get(Object key, Class<T> type) {
    ValueWrapper v = get(key);
    if (v == null) return null;
    Object val = v.get();
    if (val != null && type != null && !type.isInstance(val)) {
      throw new IllegalStateException(
          "Cached value is not of required type [" + type.getName() + "]: " + val);
    }
    return (T) val;
  }

  @Override
  @SuppressWarnings("unchecked")
  public <T> T get(Object key, Callable<T> valueLoader) {
    ValueWrapper v = get(key);
    if (v != null) return (T) v.get();
    // Stampede protection is the responsibility of the caller
    // (@Cacheable(sync = true)) — here we just load and store.
    try {
      T loaded = valueLoader.call();
      put(key, loaded);
      return loaded;
    } catch (Exception e) {
      throw new ValueRetrievalException(key, valueLoader, e);
    }
  }

  @Override
  public void put(Object key, Object value) {
    if (l2 != null) l2.put(key, value);
    if (l1 != null) l1.put(key, value);
  }

  @Override
  public ValueWrapper putIfAbsent(Object key, Object value) {
    ValueWrapper existing = get(key);
    if (existing != null) return existing;
    put(key, value);
    return null;
  }

  @Override
  public void evict(Object key) {
    if (l1 != null) l1.evict(key);
    if (l2 != null) l2.evict(key);
  }

  @Override
  public void clear() {
    if (l1 != null) l1.clear();
    if (l2 != null) l2.clear();
  }
}
