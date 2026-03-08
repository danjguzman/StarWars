import {
    AppShell,
    Box,
    Burger,
    Container,
    Group,
    Menu,
    Paper,
    Text,
    Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { NavLink, Outlet } from "react-router-dom";
import { navItems } from "@pages/Home/constants";
import { HEADER_HEIGHT } from "@utils/layout";

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
    const [opened, { open, close, toggle }] = useDisclosure(false);

    return (
        <AppShell header={{ height: HEADER_HEIGHT }} padding="md">
            <AppShell.Header>
                <Container size="lg" h="100%">
                    <Group h="100%" justify="space-between" wrap="nowrap">
                        <Title order={4}>Star Wars Explorer</Title>
                        <Group gap="lg" justify="flex-end" visibleFrom="sm">
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

                        <Box hiddenFrom="sm">
                            <Menu
                                width={180}
                                shadow="md"
                                opened={opened}
                                onChange={(isOpened) => {
                                    if (isOpened) {
                                        open();
                                        return;
                                    }

                                    close();
                                }}
                            >
                                <Menu.Target>
                                    <Burger
                                        opened={opened}
                                        onClick={toggle}
                                        aria-label="Open navigation menu"
                                        size="sm"
                                    />
                                </Menu.Target>
                                <Menu.Dropdown>
                                    {navItems.map((item) => (
                                        <Menu.Item
                                            key={item.path}
                                            component={NavLink}
                                            to={`/${item.path}`}
                                            onClick={close}
                                        >
                                            {item.label}
                                        </Menu.Item>
                                    ))}
                                </Menu.Dropdown>
                            </Menu>
                        </Box>
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
