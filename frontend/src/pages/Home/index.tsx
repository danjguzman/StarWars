import {
    AppShell,
    Container,
    Group,
    Paper,
    Text,
    Title,
} from "@mantine/core";
import { NavLink, Outlet } from "react-router-dom";

export const navItems = [
    { label: "Films", path: "films" },
    { label: "People", path: "people" },
    { label: "Planets", path: "planets" },
    { label: "Species", path: "species" },
    { label: "Vehicles", path: "vehicles" },
    { label: "Starships", path: "starships" },
] as const;

export function HomePage() {
    return (
        <Paper p="xl" radius="md" withBorder bg="dark.7">
            <Text c="dimmed" size="lg">
                Ready...
            </Text>
        </Paper>
    );
}

export function HomeSectionPage({ title }: { title: string }) {
    return (
        <Paper p="xl" radius="md" withBorder bg="dark.7">
            <Title order={3} mb="sm">
                {title}
            </Title>
            <Text c="dimmed">Ready...</Text>
        </Paper>
    );
}

export default function HomeLayout() {
    return (
        <AppShell header={{ height: { base: 112, sm: 64 } }} padding="md">
            <AppShell.Header>
                <Container size="lg" h="100%">
                    <Group h="100%" justify="space-between" wrap="wrap">
                        <Title order={4}>Star Wars Explorer</Title>
                        <Group gap="lg" wrap="wrap" justify="flex-end">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={`/${item.path}`}
                                    style={{ textDecoration: "none" }}
                                >
                                    {({ isActive }) => (
                                        <Text c={isActive ? "yellow.4" : "gray.2"} fw={500}>
                                            {item.label}
                                        </Text>
                                    )}
                                </NavLink>
                            ))}
                        </Group>
                    </Group>
                </Container>
            </AppShell.Header>
            <AppShell.Main>
                <Container size="lg" py="xl">
                    <Outlet />
                </Container>
            </AppShell.Main>
        </AppShell>
    );
}
