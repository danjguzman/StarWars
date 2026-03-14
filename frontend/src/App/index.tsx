import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "@routes/AppRouter";
import { preloadSwapiData } from "@services/preloadService";
import { buildUserFacingError } from "@utils/errors";
import { waitForMinimumLoading } from "@utils/loading";
import PreloadState from "./PreloadState";
import styles from "./index.module.css";

const APP_PRELOAD_LOADING_MS = 2000;
const LOADING_EXIT_MS = 320;
const APP_BOOTED_FLAG = "__STAR_WARS_APP_BOOTED__";

declare global {
    interface Window {
        __STAR_WARS_APP_BOOTED__?: boolean;
    }
}

/* Detect a warm remount in the same page and mark future mounts as warmed. */
function detectWarmAppRemount() {
    if (typeof window === "undefined") return false;

    const isWarmRemount = window[APP_BOOTED_FLAG] === true;
    window[APP_BOOTED_FLAG] = true;
    return isWarmRemount;
}

export default function App() {
    const isWarmAppRemountRef = useRef(detectWarmAppRemount());
    const [isPreloadComplete, setIsPreloadComplete] = useState(false);
    const [isLoaderExiting, setIsLoaderExiting] = useState(false);
    const [preloadError, setPreloadError] = useState<string | null>(null);
    const [preloadAttempt, setPreloadAttempt] = useState(0);
    const exitTimeoutRef = useRef<number | null>(null);

    const retryPreload = useCallback(() => {
        setPreloadError(null);
        setIsLoaderExiting(false);
        setIsPreloadComplete(false);
        setPreloadAttempt((current) => current + 1);
    }, []);

    useEffect(() => {
        let isMounted = true;
        const loadStartTime = Date.now();
        const preloadMinimumMs = isWarmAppRemountRef.current ? 0 : APP_PRELOAD_LOADING_MS;
        setPreloadError(null);

        preloadSwapiData()
            .then(async () => {
                await waitForMinimumLoading(loadStartTime, preloadMinimumMs);
                if (!isMounted) return;
                setIsLoaderExiting(true);
                exitTimeoutRef.current = window.setTimeout(() => {
                    if (!isMounted) return;
                    setIsPreloadComplete(true);
                }, LOADING_EXIT_MS);
            })
            .catch(async (error) => {
                await waitForMinimumLoading(loadStartTime, preloadMinimumMs);
                if (!isMounted) return;
                setPreloadError(
                    buildUserFacingError(
                        "We couldn't prepare the Star Wars archive",
                        error,
                        "Please try again"
                    )
                );
            });

        return () => {
            isMounted = false;
            if (exitTimeoutRef.current !== null) {
                window.clearTimeout(exitTimeoutRef.current);
            }
        };
    }, [preloadAttempt]);

    if (!isPreloadComplete) {
        return <PreloadState error={preloadError} exiting={isLoaderExiting} onRetry={retryPreload} />;
    }

    return (
        <div className={styles.appReveal}>
            <BrowserRouter>
                <AppRouter />
            </BrowserRouter>
        </div>
    );
}
