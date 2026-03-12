import { type ReactNode } from "react";
import { Box, Group, Stack, Title } from "@mantine/core";
import styles from "./index.module.css";

interface PageTemplateProps {
    title: string;
    headerIcon?: ReactNode;
    headerAside?: ReactNode;
    children: ReactNode;
}

export default function PageTemplate({ title, headerIcon, headerAside, children }: PageTemplateProps) {
    return (
        <Stack gap="md">

            {/* Page Header with Icon and Title. */}
            <Group className={styles.headerRow} justify="space-between" align="center">
                <Group gap="sm" align="center" className={styles.headerTitleRow}>
                    {headerIcon}
                    <Title order={3} className={styles.pageTitle}>
                        {title}
                    </Title>
                </Group>
                {headerAside ? <Box className={styles.headerAside}>{headerAside}</Box> : null}
            </Group>

            {/* Page Contents. */}
            {children}
            
        </Stack>
    );
}
