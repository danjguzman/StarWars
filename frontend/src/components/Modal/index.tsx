import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Box } from "@mantine/core";
import { X } from "phosphor-react";
import styles from "./index.module.css";

export const MODAL_EXIT_DURATION_MS = 1000;

/*
 * This file renders the shared full-screen modal shell.
 * It handles the blurred backdrop, outside-click closing, keyboard navigation,
 * touch gestures, and scroll blocking while the modal is open.
 */

function getEventElement(target: EventTarget | null) {
    return target instanceof HTMLElement
        ? target
        : target instanceof Node
            ? target.parentElement
            : null;
}

function isScrollableElement(element: HTMLElement) {
    const { overflowY } = window.getComputedStyle(element);
    return /(auto|scroll|overlay)/.test(overflowY) && element.scrollHeight > element.clientHeight;
}

function isWithinScrollableArea(target: EventTarget | null) {
    let element = getEventElement(target);

    while (element && element !== document.body) {
        if (isScrollableElement(element)) return true;
        element = element.parentElement;
    }

    return false;
}

/* Check whether the current wheel or touch movement can scroll inside a nested element. */
function canScrollWithin(target: EventTarget | null, deltaY: number) {
    let element = getEventElement(target);

    while (element && element !== document.body) {
        if (isScrollableElement(element)) {
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
    closing?: boolean;
    ariaLabel: string;
    onClose: () => void;
    children: ReactNode;
    onNavigatePrev?: () => void;
    onNavigateNext?: () => void;
    allowInteraction?: boolean;
    lockScroll?: boolean;
    onExitComplete?: () => void;
    zIndex?: number;
}

const overlayLevelClasses = [
    styles.overlayLevel0,
    styles.overlayLevel1,
    styles.overlayLevel2,
    styles.overlayLevel3,
    styles.overlayLevel4,
    styles.overlayLevel5,
    styles.overlayLevel6,
    styles.overlayLevel7,
    styles.overlayLevel8,
    styles.overlayLevel9,
    styles.overlayLevel10,
] as const;

function getOverlayLevelClass(zIndex?: number) {
    if (typeof zIndex !== "number" || Number.isNaN(zIndex)) {
        return overlayLevelClasses[0];
    }

    const normalizedLevel = Math.max(0, Math.min(10, Math.floor((zIndex - 1000) / 10)));
    return overlayLevelClasses[normalizedLevel] ?? overlayLevelClasses[0];
}

export default function Modal({
    opened,
    closing = false,
    ariaLabel,
    onClose,
    children,
    onNavigatePrev,
    onNavigateNext,
    allowInteraction = opened,
    lockScroll,
    onExitComplete,
    zIndex,
}: ModalProps) {
    const isVisible = opened || closing;
    const shouldLockScroll = lockScroll ?? isVisible;
    const blocksPointerEvents = allowInteraction;
    const overlayClassName = `${styles.overlay} ${getOverlayLevelClass(zIndex)} ${blocksPointerEvents ? styles.overlayInteractive : styles.overlayInert}`;
    const backdropClassName = `${styles.backdropCircle} ${closing ? styles.backdropExit : styles.backdropEnter} ${allowInteraction ? styles.backdropInteractive : styles.backdropInert}`;
    const contentMotionClassName = `${styles.contentMotion} ${closing ? styles.contentExit : styles.contentEnter} ${allowInteraction ? styles.contentInteractive : styles.contentInert}`;

    /* Store touch gesture state so scroll drags are not misread as swipe actions. */
    const touchGestureRef = useRef<{
        x: number;
        y: number;
        startedInScrollableArea: boolean;
        scrollGestureDetected: boolean;
    } | null>(null);
    const shouldCloseFromOverlayClickRef = useRef(false);

    useEffect(() => {
        if (!closing || !onExitComplete) return;

        const timeoutId = window.setTimeout(() => {
            onExitComplete();
        }, MODAL_EXIT_DURATION_MS);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [closing, onExitComplete]);

    /* Handle keyboard close and previous/next navigation while the modal is open. */
    useEffect(() => {
        /* Do nothing until the modal is actually open. */
        if (!isVisible || !allowInteraction) return;

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
    }, [allowInteraction, isVisible, onClose, onNavigateNext, onNavigatePrev]);

    /* Block page scrolling while the modal is open, but still allow inner scrollable areas to work. */
    useEffect(() => {
        /* Do nothing until the modal is actually open. */
        if (!isVisible || !shouldLockScroll) return;

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
            const gesture = touchGestureRef.current;

            /* Block touch scrolling when there is not enough touch data to measure movement. */
            if (!touch || !gesture) {
                event.preventDefault();
                return;
            }

            /* Measure the vertical touch movement so we know which way the user is dragging. */
            const deltaX = gesture.x - touch.clientX;
            const deltaY = gesture.y - touch.clientY;

            if (Math.abs(deltaY) > Math.abs(deltaX) && (gesture.startedInScrollableArea || canScrollWithin(event.target, deltaY))) {
                gesture.scrollGestureDetected = true;
            }

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
    }, [isVisible, shouldLockScroll]);

    if (!isVisible || typeof document === "undefined") return null;

    /* Save the first touch point so swipe direction and distance can be calculated. */
    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        if (!allowInteraction) return;

        const touch = event.touches[0];
        if (!touch) return;
        touchGestureRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            startedInScrollableArea: isWithinScrollableArea(event.target),
            scrollGestureDetected: false,
        };
    };

    const clearTouchGesture = () => {
        touchGestureRef.current = null;
    };

    /* Turn touch gestures into modal close, previous, or next actions. */
    const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
        if (!allowInteraction) return;

        const gesture = touchGestureRef.current;
        const touch = event.changedTouches[0];

        /* Clear the saved touch point because this gesture is now finished. */
        clearTouchGesture();

        /* Stop if the gesture did not have both a start and an end point. */
        if (!gesture || !touch) return;

        /* Measure how far the swipe moved horizontally and vertically. */
        const deltaX = touch.clientX - gesture.x;
        const deltaY = touch.clientY - gesture.y;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (absDeltaY > absDeltaX && (gesture.scrollGestureDetected || gesture.startedInScrollableArea)) return;

        shouldCloseFromOverlayClickRef.current = false;

        /* Ignore short swipes and gestures that are more vertical than horizontal. */
        if (absDeltaX < 56 || absDeltaX <= absDeltaY) {
            /* Close the modal when the user swipes upward far enough. */
            if (deltaY <= -72 && absDeltaY > absDeltaX) {
                onClose();
            }

            return;
        }

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
                className={overlayClassName}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                onPointerDown={(event) => {
                    if (!allowInteraction) return;
                    shouldCloseFromOverlayClickRef.current = event.target === event.currentTarget;
                }}
                onClick={(event) => {
                    if (!allowInteraction) return;

                    if (event.target !== event.currentTarget || !shouldCloseFromOverlayClickRef.current) {
                        shouldCloseFromOverlayClickRef.current = false;
                        return;
                    }

                    shouldCloseFromOverlayClickRef.current = false;
                    onClose();
                }}
            >

                {/* Blur and soften the page behind the modal. */}
                <Box className={`${styles.frostLayer} ${closing ? styles.frostExit : styles.frostEnter}`} aria-hidden="true" />

                {/* Keep the decorative circle clickable without letting it close the modal. */}
                <Box
                    className={backdropClassName}
                    onClick={(event) => {
                        event.stopPropagation();
                    }}
                    aria-hidden="true"
                />

                {/* Hold the floating close button and the actual modal content. */}
                <Box className={styles.contentLayer}>

                    {/* Show a floating close button at the top-right of the modal shell. */}
                    {allowInteraction ? (
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
                    ) : null}

                    {/* Render the modal content and keep touch/click events inside the modal. */}
                    <Box
                        className={contentMotionClassName}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={clearTouchGesture}
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
