import { type ReactNode } from "react";
import { Box, Title } from "@mantine/core";
import styles from "./index.module.css";

interface PageTemplateProps {
    title: string;
    headerIcon?: ReactNode;
    headerAside?: ReactNode;
    children: ReactNode;
}

export default function PageTemplate({ title, headerIcon, headerAside, children }: PageTemplateProps) {
    return (
        <Box className={styles.root}>

            {/* Page Header with Icon and Title. */}
            <Box className={styles.headerRow}>
                <Box className={styles.headerTitleRow}>
                    {headerIcon}
                    <Title order={3} className={styles.pageTitle}>
                        {title}
                    </Title>
                </Box>
                {headerAside ? <Box className={styles.headerAside}>{headerAside}</Box> : null}
            </Box>

            {/* Page Contents. */}
            {children}

        </Box>
    );
}
