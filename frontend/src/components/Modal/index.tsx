import { type AnimationEvent, type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Box } from "@mantine/core";
import styles from "./index.module.css";

function getBackdropDiameter() {
    if (typeof window === "undefined") return 1125;
    return Math.round(window.innerHeight * 1.25);
}

interface ModalProps {
    opened: boolean;
    ariaLabel: string;
    onClose: () => void;
    children: ReactNode;
}

export default function Modal({ opened, ariaLabel, onClose, children }: ModalProps) {
    const [isPresent, setIsPresent] = useState(opened);
    const [backdropDiameter, setBackdropDiameter] = useState<number>(() => getBackdropDiameter());

    useEffect(() => {
        if (!opened) return;

        const frameId = window.requestAnimationFrame(() => {
            setBackdropDiameter(getBackdropDiameter());
            setIsPresent(true);
        });

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [opened]);

    const handleBackdropAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
        if (opened || event.target !== event.currentTarget || event.pseudoElement) return;
        setIsPresent(false);
    };

    useEffect(() => {
        if (!opened) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            onClose();
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [opened, onClose]);

    if (!isPresent || typeof document === "undefined") return null;

    return createPortal(
        <>
            <Box
                className={styles.overlay}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                onClick={onClose}
                style={{
                    pointerEvents: opened ? "auto" : "none",
                }}
            >
                <Box className={`${styles.frostLayer} ${opened ? styles.frostEnter : styles.frostExit}`} aria-hidden="true" />

                <Box
                    className={`${styles.backdropCircle} ${opened ? styles.backdropEnter : styles.backdropExit}`}
                    style={{
                        width: `${backdropDiameter}px`,
                        height: `${backdropDiameter}px`,
                        minWidth: `${backdropDiameter}px`,
                        maxWidth: `${backdropDiameter}px`,
                        minHeight: `${backdropDiameter}px`,
                        maxHeight: `${backdropDiameter}px`,
                        pointerEvents: opened ? "auto" : "none",
                    }}
                    onClick={(event) => {
                        event.stopPropagation();
                    }}
                    onAnimationEnd={handleBackdropAnimationEnd}
                    aria-hidden="true"
                />

                <Box className={styles.contentLayer}>
                    <Box
                        className={`${styles.contentMotion} ${opened ? styles.contentEnter : styles.contentExit}`}
                        style={{
                            pointerEvents: opened ? "auto" : "none",
                        }}
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
