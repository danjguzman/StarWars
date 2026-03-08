import { type ReactNode } from "react";
import { Group, Stack, Title } from "@mantine/core";

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
                <Title order={3} className="app-page-title">
                    {title}
                </Title>
            </Group>

            {/* Page Contents. */}
            {children}
            
        </Stack>
    );
}
