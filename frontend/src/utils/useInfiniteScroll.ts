import { useCallback, useEffect, useRef } from "react";

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
    const lastTriggeredLengthRef = useRef<number | null>(null);
    const previousContentLengthRef = useRef<number | null>(null);
    const requiresScrollAfterShrinkRef = useRef(false);

    /* Pause auto-loading when the list shrinks until the user scrolls again. */
    useEffect(() => {
        const previousContentLength = previousContentLengthRef.current;

        if (
            previousContentLength !== null
            && contentLength !== undefined
            && contentLength < previousContentLength
        ) {
            requiresScrollAfterShrinkRef.current = true;
        }

        previousContentLengthRef.current = contentLength ?? null;
    }, [contentLength]);

    /* Re-enable auto-loading once the user scrolls after a shrink/reset. */
    useEffect(() => {
        if (!requiresScrollAfterShrinkRef.current) return;

        const handleScroll = () => {
            requiresScrollAfterShrinkRef.current = false;
        };

        const scrollRoot = document.getElementById("app-main-scroll");

        window.addEventListener("scroll", handleScroll, { passive: true });
        scrollRoot?.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
            scrollRoot?.removeEventListener("scroll", handleScroll);
        };
    }, [contentLength]);

    /* Reset the load trigger guard when the list length changes. */
    useEffect(() => {
        lastTriggeredLengthRef.current = null;
    }, [contentLength]);

    /* Trigger one load-more request per rendered content length. */
    const triggerLoadMore = useCallback(() => {
        const requestKey = contentLength ?? -1;
        if (lastTriggeredLengthRef.current === requestKey) return;
        if (requiresScrollAfterShrinkRef.current) return;
        lastTriggeredLengthRef.current = requestKey;
        onLoadMore();
    }, [contentLength, onLoadMore]);

    /* Use an IntersectionObserver to load more when the sentinel enters the view area. */
    useEffect(() => {

        /* Stop early when infinite scroll is turned off or there is nothing left to load. */
        if (disabled || !hasMore || contentLength === 0) return;

        /* Read the current sentinel element that sits at the end of the list || stop. */
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        /* Watch the sentinel and trigger more loading once it enters the observer area. */
        const observer = new IntersectionObserver(
            (entries) => {
                const firstEntry = entries[0];

                /* Ask for more items when the sentinel is visible. */
                if (firstEntry?.isIntersecting) {
                    triggerLoadMore();
                }
            },
            { rootMargin }
        );

        observer.observe(sentinel);

        /* Disconnect the observer when the effect is cleaned up. */
        return () => {
            observer.disconnect();
        };
    }, [contentLength, disabled, hasMore, rootMargin, triggerLoadMore]);

    /* Run one immediate viewport check in case the list is already short on first render. */
    useEffect(() => {

        /* Stop early when infinite scroll is turned off or there is nothing left to load. */
        if (disabled || !hasMore || contentLength === 0) return;

        /* Read the current sentinel element that sits at the end of the list || stop. */
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        /* Check the sentinel position right away after render. */
        const rect = sentinel.getBoundingClientRect();
        const isNearViewport = rect.top <= window.innerHeight + 300;

        /* Load more immediately when the sentinel is already close to the viewport. */
        if (isNearViewport) triggerLoadMore();
    }, [contentLength, disabled, hasMore, triggerLoadMore]);

    return sentinelRef;
}
