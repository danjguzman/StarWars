import { useEffect, useRef } from "react";

/*
 * This file holds a reusable hook for simple infinite-scroll behavior.
 * It watches a sentinel element near the end of a list and calls `onLoadMore`
 * when that sentinel enters or gets close to the viewport.
 */

/* Describe the options used to control infinite-scroll loading behavior. */
interface UseInfiniteScrollOptions {
    hasMore: boolean;
    onLoadMore: () => void;
    disabled?: boolean;
    rootMargin?: string;
    contentLength?: number;
}

/* Return a sentinel ref that triggers loading more items when it nears the viewport. */
export function useInfiniteScroll({
    hasMore,
    onLoadMore,
    disabled = false,
    rootMargin = "300px 0px",
    contentLength,
}: UseInfiniteScrollOptions) {

    /* Store the sentinel element watched by the hook. */
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    /* Use an IntersectionObserver to load more when the sentinel enters the view area. */
    useEffect(() => {

        /* Stop early when infinite scroll is turned off or there is nothing left to load. */
        if (disabled || !hasMore) return;

        /* Read the current sentinel element that sits at the end of the list || stop. */
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        /* Watch the sentinel and trigger more loading once it enters the observer area. */
        const observer = new IntersectionObserver(
            (entries) => {
                const firstEntry = entries[0];

                /* Ask for more items when the sentinel is visible. */
                if (firstEntry?.isIntersecting) {
                    onLoadMore();
                }
            },
            { rootMargin }
        );

        observer.observe(sentinel);

        /* Disconnect the observer when the effect is cleaned up. */
        return () => {
            observer.disconnect();
        };
    }, [disabled, hasMore, onLoadMore, rootMargin, contentLength]);

    /* Run one immediate viewport check in case the list is already short on first render. */
    useEffect(() => {

        /* Stop early when infinite scroll is turned off or there is nothing left to load. */
        if (disabled || !hasMore) return;

        /* Read the current sentinel element that sits at the end of the list || stop. */
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        /* Check the sentinel position right away after render. */
        const rect = sentinel.getBoundingClientRect();
        const isNearViewport = rect.top <= window.innerHeight + 300;

        /* Load more immediately when the sentinel is already close to the viewport. */
        if (isNearViewport) onLoadMore();
    }, [disabled, hasMore, onLoadMore, contentLength]);

    return sentinelRef;
}
