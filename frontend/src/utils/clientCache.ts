type CacheEntry<T> = {
    value: T;
    expiresAt: number;
};

/* Store cached values in memory while the app is running. */
const cache = new Map<string, CacheEntry<unknown>>();

/* Use this as the default time before cached data expires. */
export const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

/* Build the cache key for one specific pahe (category) of data. */
function pageCacheKey(cacheName: string, page: number) {
    return `${cacheName}:page:${page}`;
}

/* Read one cached value if it exists and has not expired yet. */
export function getCachedValue<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.value as T;
}

/* Save one value in the cache and set when it should expire. */
export function setCachedValue<T>(key: string, value: T, ttlMs = DEFAULT_CACHE_TTL_MS) {
    cache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
    });
}

/* Get one page from the cache first, or fetch and cache it if needed (for simulating infinite scroll paging). */
export async function getCachedPage<T>(
    cacheName: string,
    page: number,
    fetchPage: (page: number) => Promise<T>,
    ttlMs = DEFAULT_CACHE_TTL_MS
) {
    
    /* Build the cache key for this specific page request. */
    const key = pageCacheKey(cacheName, page);

    /* Check whether this page was already cached earlier. */
    const cachedPage = getCachedValue<T>(key);

    /* Return the cached page right away when it already exists. */
    if (cachedPage) return cachedPage;

    /* Fetch the page because it was not found in the cache. */
    const pageData = await fetchPage(page);

    /* Save the fetched page so the next request can reuse it. */
    setCachedValue(key, pageData, ttlMs);

    /* Give the caller the fresh page data. */
    return pageData;
}

/* Clear all cached pages for one paged data set. */
export function invalidatePageCache(cacheName: string) {
    invalidateCacheByPrefix(`${cacheName}:page:`);
}

/* Clear every cached entry that starts with the given prefix. */
export function invalidateCacheByPrefix(prefix: string) {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key);
        }
    }
}
