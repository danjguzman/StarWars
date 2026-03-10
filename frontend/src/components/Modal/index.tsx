import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Box } from "@mantine/core";
import { X } from "phosphor-react";
import styles from "./index.module.css";

/*
 * This file renders the shared full-screen modal shell.
 * It handles the blurred backdrop, outside-click closing, keyboard navigation,
 * touch gestures, and scroll blocking while the modal is open.
 */

/* Check whether the current wheel or touch movement can scroll inside a nested element. */
function canScrollWithin(target: EventTarget | null, deltaY: number) {
    let element = target instanceof HTMLElement
        ? target
        : target instanceof Node
            ? target.parentElement
            : null;

    while (element && element !== document.body) {
        const { overflowY } = window.getComputedStyle(element);
        const isScrollable = /(auto|scroll|overlay)/.test(overflowY) && element.scrollHeight > element.clientHeight;

        if (isScrollable) {
            if (deltaY < 0 && element.scrollTop > 0) return true;
            if (deltaY > 0 && element.scrollTop + element.clientHeight < element.scrollHeight) return true;
        }

        element = element.parentElement;
    }

    return false;
}

/* Check whether the event target is a field where normal typing keys should still work. */
function isTypingTarget(target: EventTarget | null) {
    return target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
        || (target instanceof HTMLElement && target.isContentEditable);
}

interface ModalProps {
    opened: boolean;
    ariaLabel: string;
    onClose: () => void;
    children: ReactNode;
    onNavigatePrev?: () => void;
    onNavigateNext?: () => void;
}

export default function Modal({
    opened,
    ariaLabel,
    onClose,
    children,
    onNavigatePrev,
    onNavigateNext,
}: ModalProps) {
    /* Store the first touch position so swipe gestures can be measured later. */
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    /* Handle keyboard close and previous/next navigation while the modal is open. */
    useEffect(() => {
        /* Do nothing until the modal is actually open. */
        if (!opened) return;

        /* Watch modal keyboard shortcuts and block keys that would scroll the page. */
        const handleKeyDown = (event: KeyboardEvent) => {
            /* Block scroll keys so the page behind the modal does not move. */
            if (event.key === " " || event.key === "PageDown" || event.key === "PageUp" || event.key === "Home" || event.key === "End" || event.key === "ArrowDown") {
                /* Let typing fields keep their normal keyboard behavior. */
                if (isTypingTarget(event.target)) return;
                event.preventDefault();
                return;
            }

            /* Close the modal from the keyboard. */
            if (event.key === "Escape" || event.key === "ArrowUp") {
                event.preventDefault();
                onClose();
                return;
            }

            /* Move to the previous item when that action exists. */
            if (event.key === "ArrowLeft") {
                if (!onNavigatePrev) return;
                event.preventDefault();
                onNavigatePrev();
                return;
            }

            /* Move to the next item when that action exists. */
            if (event.key === "ArrowRight") {
                if (!onNavigateNext) return;
                event.preventDefault();
                onNavigateNext();
            }
        };

        /* Start listening for modal keyboard input. */
        window.addEventListener("keydown", handleKeyDown);

        /* Stop listening when the modal closes or the effect is replaced. */
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose, onNavigateNext, onNavigatePrev, opened]);

    /* Block page scrolling while the modal is open, but still allow inner scrollable areas to work. */
    useEffect(() => {
        /* Do nothing until the modal is actually open. */
        if (!opened) return;

        /* Measure the scrollbar gap so layout does not shift when scroll is blocked. */
        const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;

        /* Remember document styles so they can be restored on close. */
        const previousBodyPaddingRight = document.body.style.paddingRight;
        const previousHtmlOverscrollBehavior = document.documentElement.style.overscrollBehavior;

        /* Block wheel scrolling unless the pointer is inside a scrollable modal child. */
        const handleWheel = (event: WheelEvent) => {
            /* Allow the scroll when a nested modal area can handle it. */
            if (canScrollWithin(event.target, event.deltaY)) return;

            /* Otherwise stop the page behind the modal from scrolling. */
            event.preventDefault();
        };

        /* Block touch scrolling unless the gesture can scroll inside a modal child. */
        const handleTouchMove = (event: TouchEvent) => {
            const touch = event.touches[0];
            const start = touchStartRef.current;

            /* Block touch scrolling when there is not enough touch data to measure movement. */
            if (!touch || !start) {
                event.preventDefault();
                return;
            }

            /* Measure the vertical touch movement so we know which way the user is dragging. */
            const deltaY = start.y - touch.clientY;

            /* Only allow the gesture when a nested modal area can scroll in that direction. */
            if (!canScrollWithin(event.target, deltaY)) {
                event.preventDefault();
            }
        };

        /* Add padding when needed so hiding the scrollbar does not shift the layout. */
        if (scrollbarGap > 0) {
            document.body.style.paddingRight = `${scrollbarGap}px`;
        }

        /* Disable root overscroll and start blocking wheel/touch page scrolling. */
        document.documentElement.style.overscrollBehavior = "none";
        document.addEventListener("wheel", handleWheel, { passive: false });
        document.addEventListener("touchmove", handleTouchMove, { passive: false });

        /* Restore document scroll behavior when the modal closes. */
        return () => {
            document.removeEventListener("wheel", handleWheel);
            document.removeEventListener("touchmove", handleTouchMove);
            document.body.style.paddingRight = previousBodyPaddingRight;
            document.documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior;
        };
    }, [opened]);

    if (!opened || typeof document === "undefined") return null;

    /* Save the first touch point so swipe direction and distance can be calculated. */
    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        const touch = event.touches[0];
        if (!touch) return;
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    /* Turn touch gestures into modal close, previous, or next actions. */
    const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
        const start = touchStartRef.current;
        const touch = event.changedTouches[0];

        /* Clear the saved touch point because this gesture is now finished. */
        touchStartRef.current = null;

        /* Stop if the gesture did not have both a start and an end point. */
        if (!start || !touch) return;

        /* Measure how far the swipe moved horizontally and vertically. */
        const deltaX = touch.clientX - start.x;
        const deltaY = touch.clientY - start.y;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        /* Close the modal when the user swipes upward far enough. */
        if (deltaY <= -72 && absDeltaY > absDeltaX) {
            onClose();
            return;
        }

        /* Ignore short swipes and gestures that are more vertical than horizontal. */
        if (absDeltaX < 56 || absDeltaX <= absDeltaY) return;

        /* Swipe right goes to the previous item. */
        if (deltaX > 0) {
            onNavigatePrev?.();
            return;
        }

        /* Swipe left goes to the next item. */
        onNavigateNext?.();
    };

    return createPortal(
        <>
            {/* Render the full-screen modal overlay into document.body. */}
            <Box
                className={styles.overlay}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                onClick={onClose}
            >

                {/* Blur and soften the page behind the modal. */}
                <Box className={`${styles.frostLayer} ${styles.frostEnter}`} aria-hidden="true" />

                {/* Keep the decorative circle clickable without letting it close the modal. */}
                <Box
                    className={`${styles.backdropCircle} ${styles.backdropEnter}`}
                    style={{
                        pointerEvents: "auto",
                    }}
                    onClick={(event) => {
                        event.stopPropagation();
                    }}
                    aria-hidden="true"
                />

                {/* Hold the floating close button and the actual modal content. */}
                <Box className={styles.contentLayer}>

                    {/* Show a floating close button at the top-right of the modal shell. */}
                    <button
                        type="button"
                        className={styles.floatingCloseButton}
                        onClick={(event) => {
                            event.stopPropagation();
                            onClose();
                        }}
                        aria-label="Close modal"
                    >
                        <X size={20} weight="bold" />
                    </button>

                    {/* Render the modal content and keep touch/click events inside the modal. */}
                    <Box
                        className={`${styles.contentMotion} ${styles.contentEnter}`}
                        style={{ pointerEvents: "auto" }}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onClick={(event) => event.stopPropagation()}
                    >
                        {children}
                    </Box>
                </Box>
            </Box>
        </>,
        document.body,
    );
}
