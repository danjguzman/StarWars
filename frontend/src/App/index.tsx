import { useEffect, useState } from "react";
import { Center, Stack, Text } from "@mantine/core";
import { BrowserRouter, Routes } from "react-router-dom";
import { homeRoutes } from "@pages/Home/routes";
import { preloadSwapiData } from "@services/preloadService";

export default function App() {
    const [isPreloadComplete, setIsPreloadComplete] = useState(false);
    const [preloadError, setPreloadError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        preloadSwapiData()
            .then(() => {
                if (!isMounted) return;
                setIsPreloadComplete(true);
            })
            .catch(() => {
                if (!isMounted) return;
                setPreloadError("Failed to preload Star Wars data.");
            });

        return () => {
            isMounted = false;
        };
    }, []);

    if (!isPreloadComplete) {
        return (
            <Center mih="100vh">
                <Stack gap="xs" align="center">
                    <Text>Loading galactic archives...</Text>
                    {preloadError && <Text c="red.4">{preloadError}</Text>}
                </Stack>
            </Center>
        );
    }

    return (
        <BrowserRouter>
            <Routes>{homeRoutes}</Routes>
        </BrowserRouter>
    );
}
