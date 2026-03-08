import { useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
    hasMore: boolean;
    onLoadMore: () => void;
    disabled?: boolean;
    rootMargin?: string;
    contentLength?: number;
}

export function useInfiniteScroll({
    hasMore,
    onLoadMore,
    disabled = false,
    rootMargin = "300px 0px",
    contentLength,
}: UseInfiniteScrollOptions) {
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (disabled || !hasMore) return;

        const sentinel = sentinelRef.current;

        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const firstEntry = entries[0];

                if (firstEntry?.isIntersecting) {
                    onLoadMore();
                }
            },
            { rootMargin }
        );

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
        };
    }, [disabled, hasMore, onLoadMore, rootMargin, contentLength]);

    useEffect(() => {
        if (disabled || !hasMore) return;

        const sentinel = sentinelRef.current;

        if (!sentinel) return;

        const frame = window.requestAnimationFrame(() => {
            const rect = sentinel.getBoundingClientRect();
            const isNearViewport = rect.top <= window.innerHeight + 300;

            if (isNearViewport) {
                onLoadMore();
            }
        });

        return () => {
            window.cancelAnimationFrame(frame);
        };
    }, [disabled, hasMore, onLoadMore, contentLength]);

    return sentinelRef;
}
