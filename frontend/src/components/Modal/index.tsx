import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Box } from "@mantine/core";
import styles from "./index.module.css";

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
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (!opened) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" || event.key === "ArrowUp") {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key === "ArrowLeft") {
                if (!onNavigatePrev) return;
                event.preventDefault();
                onNavigatePrev();
                return;
            }

            if (event.key === "ArrowRight") {
                if (!onNavigateNext) return;
                event.preventDefault();
                onNavigateNext();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose, onNavigateNext, onNavigatePrev, opened]);

    useEffect(() => {
        if (!opened) return;

        const lockedScrollY = window.scrollY;
        const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;

        const previousBodyPosition = document.body.style.position;
        const previousBodyTop = document.body.style.top;
        const previousBodyLeft = document.body.style.left;
        const previousBodyRight = document.body.style.right;
        const previousBodyWidth = document.body.style.width;
        const previousBodyPaddingRight = document.body.style.paddingRight;
        const previousBodyOverflow = document.body.style.overflow;
        const previousHtmlOverflow = document.documentElement.style.overflow;
        const previousHtmlOverscrollBehavior = document.documentElement.style.overscrollBehavior;

        document.body.style.position = "fixed";
        document.body.style.top = `-${lockedScrollY}px`;
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.width = "100%";
        if (scrollbarGap > 0) {
            document.body.style.paddingRight = `${scrollbarGap}px`;
        }
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.documentElement.style.overscrollBehavior = "none";

        return () => {
            document.body.style.position = previousBodyPosition;
            document.body.style.top = previousBodyTop;
            document.body.style.left = previousBodyLeft;
            document.body.style.right = previousBodyRight;
            document.body.style.width = previousBodyWidth;
            document.body.style.paddingRight = previousBodyPaddingRight;
            document.body.style.overflow = previousBodyOverflow;
            document.documentElement.style.overflow = previousHtmlOverflow;
            document.documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior;
            window.scrollTo(0, lockedScrollY);
        };
    }, [opened]);

    if (!opened || typeof document === "undefined") return null;

    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        const touch = event.touches[0];
        if (!touch) return;

        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
        const start = touchStartRef.current;
        const touch = event.changedTouches[0];

        touchStartRef.current = null;

        if (!start || !touch) return;

        const deltaX = touch.clientX - start.x;
        const deltaY = touch.clientY - start.y;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (deltaY <= -72 && absDeltaY > absDeltaX) {
            onClose();
            return;
        }

        if (absDeltaX < 56 || absDeltaX <= absDeltaY) return;

        if (deltaX > 0) {
            onNavigatePrev?.();
            return;
        }

        onNavigateNext?.();
    };

    return createPortal(
        <>
            <Box
                className={styles.overlay}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                onClick={onClose}
            >
                <Box className={`${styles.frostLayer} ${styles.frostEnter}`} aria-hidden="true" />

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

                <Box className={styles.contentLayer}>
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
