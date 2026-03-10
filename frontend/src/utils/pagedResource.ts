/*
 * This file holds reusable helpers for resource lists that behave like paged data.
 * It helps stores deduplicate items by URL, decide whether a fetch should be skipped,
 * and collect multiple page-shaped chunks until enough items have been loaded.
 */

/* Describe a resource item that can be uniquely identified by its URL. */
export interface UrlResource {
    url: string;
}

/* Describe the final result after collecting one or more page-shaped resource chunks. */
export interface PagedResourceResult<T extends UrlResource> {
    items: T[];
    currentPage: number;
    hasMore: boolean;
}

/* Describe one page-shaped resource result returned by a loader. */
export interface ResourcePage<T extends UrlResource> {
    items: T[];
    hasMore: boolean;
}

/* Describe the options needed to collect paged resources until a target is reached. */
interface CollectPagedResourcesOptions<T extends UrlResource> {
    targetCount?: number;
    loadPage: (page: number) => Promise<ResourcePage<T>>;
}

/* Describe the loading state values used to decide whether a fetch should be skipped. */
interface ShouldSkipFetchOptions {
    nextPage: boolean;
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    currentPage: number;
    itemCount: number;
}

/* Remove incoming items that already exist in the current list by matching their URLs. */
export function filterUniqueResourcesByUrl<T extends UrlResource>(existingItems: T[], incomingItems: T[]) {
    const existingUrls = new Set(existingItems.map((item) => item.url));
    return incomingItems.filter((item) => !existingUrls.has(item.url));
}

/* Decide whether a paged fetch should be skipped based on the current loading state. */
export function shouldSkipFetch({
    nextPage,
    loading,
    loadingMore,
    hasMore,
    currentPage,
    itemCount,
}: ShouldSkipFetchOptions) {
    if (nextPage) return loading || loadingMore || !hasMore;
    return loading || (currentPage > 0 && itemCount > 0);
}

/* Keep loading page-shaped chunks until the target count is reached or no more data exists. */
export async function collectPagedResourcesUntilTarget<T extends UrlResource>({
    targetCount = 0,
    loadPage,
}: CollectPagedResourcesOptions<T>): Promise<PagedResourceResult<T>> {
    
    /* Start from page one and keep track of whether more page data exists. */
    let pageToLoad = 1;
    let hasMore = true;

    /* Build one combined list while also tracking URLs we have already added. */
    const items: T[] = [];
    const seenUrls = new Set<string>();

    /* Keep loading page-shaped chunks until we reach the stop conditions. */
    while (hasMore) {
        const pageData = await loadPage(pageToLoad);

        /* Add only new items so the final list stays unique by URL. */
        for (const item of pageData.items) {
            if (seenUrls.has(item.url)) continue;
            seenUrls.add(item.url);
            items.push(item);
        }

        /* Update paging state after processing the current page. */
        hasMore = pageData.hasMore;
        const enoughItemsLoaded = targetCount > 0 && items.length >= targetCount;

        /* Stop when there is no more data or when the requested target has been reached. */
        if (!hasMore || enoughItemsLoaded || targetCount === 0) break;

        /* Move to the next page when more items are still needed. */
        pageToLoad += 1;
    }

    /* Return the combined items plus the paging state reached by this load. */
    return {
        items,
        currentPage: pageToLoad,
        hasMore,
    };
}
