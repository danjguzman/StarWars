import { Center, Stack, Text } from "@mantine/core";
import { CircleNotch } from "phosphor-react";
import styles from "./index.module.css";

interface PreloadStateProps {
    error?: string | null;
    exiting?: boolean;
}

export default function PreloadState({ error = null, exiting = false }: PreloadStateProps) {
    return (
        <Center className={styles.loaderShell}>
            <Stack gap="xs" align="center" className={exiting ? styles.loaderExit : undefined}>
                <span className={styles.spinner} aria-hidden="true">
                    <CircleNotch size={40} weight="duotone" color="currentColor" />
                </span>
                <Text className={styles.label}>Loading Galactic Archives</Text>
                {error && <Text c="red.4">{error}</Text>}
            </Stack>
        </Center>
    );
}
