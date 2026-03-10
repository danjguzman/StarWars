import { type ReactNode } from "react";
import { Group, Stack, Title } from "@mantine/core";
import styles from "./index.module.css";

interface PageTemplateProps {
    title: string;
    headerIcon?: ReactNode;
    children: ReactNode;
}

export default function PageTemplate({ title, headerIcon, children }: PageTemplateProps) {
    return (
        <Stack gap="md">

            {/* Page Header with Icon and Title. */}
            <Group gap="sm" align="center">
                {headerIcon}
                <Title order={3} className={styles.pageTitle}>
                    {title}
                </Title>
            </Group>

            {/* Page Contents. */}
            {children}
            
        </Stack>
    );
}
