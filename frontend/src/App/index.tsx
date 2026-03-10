import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes } from "react-router-dom";
import { homeRoutes } from "@pages/Home/routes";
import { preloadSwapiData } from "@services/preloadService";
import { waitForMinimumLoading } from "@utils/loading";
import PreloadState from "./PreloadState";
import styles from "./index.module.css";

const APP_PRELOAD_LOADING_MS = 3000;
const LOADING_EXIT_MS = 320;

export default function App() {
    const [isPreloadComplete, setIsPreloadComplete] = useState(false);
    const [isLoaderExiting, setIsLoaderExiting] = useState(false);
    const [preloadError, setPreloadError] = useState<string | null>(null);
    const exitTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        let isMounted = true;
        const loadStartTime = Date.now();

        preloadSwapiData()
            .then(async () => {
                await waitForMinimumLoading(loadStartTime, APP_PRELOAD_LOADING_MS);
                if (!isMounted) return;
                setIsLoaderExiting(true);
                exitTimeoutRef.current = window.setTimeout(() => {
                    if (!isMounted) return;
                    setIsPreloadComplete(true);
                }, LOADING_EXIT_MS);
            })
            .catch(async () => {
                await waitForMinimumLoading(loadStartTime, APP_PRELOAD_LOADING_MS);
                if (!isMounted) return;
                setPreloadError("Failed to preload Star Wars data.");
            });

        return () => {
            isMounted = false;
            if (exitTimeoutRef.current !== null) {
                window.clearTimeout(exitTimeoutRef.current);
            }
        };
    }, []);

    if (!isPreloadComplete) {
        return <PreloadState error={preloadError} exiting={isLoaderExiting} />;
    }

    return (
        <div className={styles.appReveal}>
            <BrowserRouter>
                <Routes>{homeRoutes}</Routes>
            </BrowserRouter>
        </div>
    );
}
