import { Button, Center, Stack, Text } from "@mantine/core";
import { CircleNotch } from "phosphor-react";
import styles from "./index.module.css";

interface PreloadStateProps {
    error?: string | null;
    exiting?: boolean;
    onRetry?: () => void;
}

export default function PreloadState({ error = null, exiting = false, onRetry }: PreloadStateProps) {
    return (
        <Center className={styles.loaderShell}>
            <Stack gap="xs" align="center" className={exiting ? styles.loaderExit : undefined} role="status" aria-live="polite">
                {!error ? (
                    <span className={styles.spinner} aria-hidden="true">
                        <CircleNotch size={40} weight="duotone" color="currentColor" />
                    </span>
                ) : null}
                <Text className={styles.label}>{error ? "Unable to Load Galactic Archives" : "Loading Galactic Archives"}</Text>
                {error ? (
                    <>
                        <Text c="red.4" ta="center" className={styles.errorText}>{error}</Text>
                        {onRetry ? (
                            <Button color="yellow" variant="light" onClick={onRetry}>
                                Retry
                            </Button>
                        ) : null}
                    </>
                ) : null}
            </Stack>
        </Center>
    );
}
