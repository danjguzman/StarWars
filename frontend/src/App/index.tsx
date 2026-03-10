import { useEffect, useRef, useState } from "react";
import { Center, Stack, Text } from "@mantine/core";
import { CircleNotch } from "phosphor-react";
import { BrowserRouter, Routes } from "react-router-dom";
import { homeRoutes } from "@pages/Home/routes";
import { preloadSwapiData } from "@services/preloadService";
import { waitForMinimumLoading } from "@utils/loading";
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
        return (
            <Center className={styles.loaderShell}>
                <Stack gap="xs" align="center" className={isLoaderExiting ? styles.loaderExit : undefined}>
                    <span className={styles.spinner} aria-hidden="true">
                        <CircleNotch size={40} weight="duotone" color="currentColor" />
                    </span>
                    <Text className={styles.label}>Loading Galactic Archives</Text>
                    {preloadError && <Text c="red.4">{preloadError}</Text>}
                </Stack>
            </Center>
        );
    }

    return (
        <div className={styles.appReveal}>
            <BrowserRouter>
                <Routes>{homeRoutes}</Routes>
            </BrowserRouter>
        </div>
    );
}
