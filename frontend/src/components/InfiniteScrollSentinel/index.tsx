import { type ReactNode, type RefObject } from "react";
import styles from "./index.module.css";

interface InfiniteScrollSentinelProps {
    sentinelRef: RefObject<HTMLDivElement | null>;
    hasItems: boolean;
    hasMore: boolean;
    loadingMore: boolean;
    showDone: boolean;
    loadingIndicator: ReactNode;
    doneIndicator: ReactNode;
    doneClassName?: string;
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
    onDoneClick,
    doneAriaLabel = "Done",
}: InfiniteScrollSentinelProps) {
    return (
        <>

            {/* Sentinal trigger element. */}
            <div ref={sentinelRef} className={styles.sentinel} />

            {/* Show loading icon during infinite scroll fetch. */}
            {hasItems && hasMore && (
                <div className={`${styles.statusRow} ${loadingMore ? styles.statusRowVisible : styles.statusRowHidden}`}>
                    <span className={styles.loadingIndicator}>{loadingIndicator}</span>
                </div>
            )}

            {/* Show 'no more fetched items remaining' icon. */}
            {hasItems && (
                <div className={styles.statusRowVisible}>
                    {showDone && (
                        <button
                            type="button"
                            onClick={onDoneClick}
                            aria-label={onDoneClick ? doneAriaLabel : undefined}
                            className={`${styles.doneButton}${doneClassName ? ` ${doneClassName}` : ""}${onDoneClick ? ` ${styles.doneButtonInteractive}` : ""}`}
                            disabled={!onDoneClick}
                        >
                            {doneIndicator}
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
