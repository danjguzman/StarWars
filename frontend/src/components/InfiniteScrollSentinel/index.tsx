import { type ReactNode, type RefObject } from "react";
import { Box, Center, Transition } from "@mantine/core";

interface InfiniteScrollSentinelProps {
    sentinelRef: RefObject<HTMLDivElement | null>;
    hasItems: boolean;
    hasMore: boolean;
    loadingMore: boolean;
    showDone: boolean;
    loadingIndicator: ReactNode;
    doneIndicator: ReactNode;
    doneClassName?: string;
    indicatorMinHeight?: number;
    onDoneClick?: () => void;
    doneAriaLabel?: string;
}

export default function InfiniteScrollSentinel({
    sentinelRef,
    hasItems,
    hasMore,
    loadingMore,
    showDone,
    loadingIndicator,
    doneIndicator,
    doneClassName,
    indicatorMinHeight = 32,
    onDoneClick,
    doneAriaLabel = "Done",
}: InfiniteScrollSentinelProps) {
    return (
        <>

            {/* Sentinal trigger element. */}
            <Box ref={sentinelRef} h={1} />

            {/* Show loading icon during infinite scroll fetch. */}
            {hasItems && hasMore && (
                <Center style={{ minHeight: loadingMore ? indicatorMinHeight : 0 }}>
                    <Transition
                        mounted={loadingMore}
                        duration={120}
                        exitDuration={500}
                        timingFunction="ease"
                        transition={{
                            in: { opacity: 1, transform: "scale(1)" },
                            out: { opacity: 0, transform: "scale(0.95)" },
                            common: { transformOrigin: "center" },
                            transitionProperty: "opacity, transform",
                        }}
                    >
                        {(transitionStyles) => (
                            <Box style={{ display: "inline-flex", ...transitionStyles }}>
                                {loadingIndicator}
                            </Box>
                        )}
                    </Transition>
                </Center>
            )}

            {/* Show 'no more fetched items remaining' icon. */}
            {hasItems && (
                <Center style={{ minHeight: indicatorMinHeight }}>
                    {showDone && (
                        <Box
                            component={onDoneClick ? "button" : "div"}
                            type={onDoneClick ? "button" : undefined}
                            onClick={onDoneClick}
                            aria-label={onDoneClick ? doneAriaLabel : undefined}
                            className={doneClassName}
                            style={{
                                display: "inline-flex",
                                background: "transparent",
                                border: 0,
                                padding: 0,
                                cursor: onDoneClick ? "pointer" : "default",
                            }}
                        >
                            {doneIndicator}
                        </Box>
                    )}
                </Center>
            )}
        </>
    );
}
