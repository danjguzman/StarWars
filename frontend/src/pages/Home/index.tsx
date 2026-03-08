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
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import {
    Alien as AlienIcon,
    FlyingSaucer as FlyingSaucerIcon,
    Planet as PlanetIcon,
    TrainRegional as TrainRegionalIcon,
    Users as UsersIcon,
} from "phosphor-react";
import { FilmReel as FilmReelIcon } from "@phosphor-icons/react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { navItems } from "@pages/Home/constants";
import { HEADER_HEIGHT_CSS } from "@utils/layout";

function getMobileMenuIcon(path: string, color: string) {
    if (path === "films") return <FilmReelIcon size={24} weight="duotone" color={color} />;
    if (path === "people") return <UsersIcon size={24} weight="duotone" color={color} />;
    if (path === "planets") return <PlanetIcon size={24} weight="duotone" color={color} />;
    if (path === "species") return <AlienIcon size={24} weight="duotone" color={color} />;
    if (path === "vehicles") return <TrainRegionalIcon size={24} weight="duotone" color={color} />;
    if (path === "starships") return <FlyingSaucerIcon size={24} weight="duotone" color={color} />;

    return null;
}

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
            <Title order={3} mb="sm" className="app-page-title">
                {title}
            </Title>
            <Text c="dimmed">Ready...</Text>
        </Paper>
    );
}

export default function HomeLayout() {
    const [opened, { open, close, toggle }] = useDisclosure(false);
    const useCompactNav = useMediaQuery("(max-width: 906px)");
    const location = useLocation();

    return (
        <AppShell header={{ height: HEADER_HEIGHT_CSS }} padding="md">

            {/* Sticky Header. */}
            <AppShell.Header
                style={{
                    borderBottom: "none",
                    backgroundColor: "#050505",
                    position: "sticky",
                    top: 0,
                    zIndex: 200,
                    overflow: "visible",
                }}
            >
                <Container size="lg" h="100%">
                    <Group h="100%" justify="space-between" align="center" wrap="nowrap">

                        {/* Page Title. */}
                        <Box className="app-header-brand">
                            <Text c="yellow.4" className="app-header-title-line">
                                Star Wars
                            </Text>
                            <Text c="yellow.4" className="app-header-title-line">
                                Explorer
                            </Text>
                        </Box>

                        {/* Nav Links */}
                        {!useCompactNav && (
                            <Group gap="lg" justify="flex-end">
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={`/${item.path}`}
                                        className={({ isActive }) =>
                                            `app-header-nav-item${isActive ? " app-header-nav-item-active" : ""}`
                                        }
                                        style={{ textDecoration: "none" }}
                                    >
                                        {() => (
                                            <Text component="span" fw={500} className="app-menu-link app-header-nav-link">
                                                {item.label}
                                            </Text>
                                        )}
                                    </NavLink>
                                ))}
                            </Group>
                        )}

                        {/* Mobile / Responsive Dropdown Links. */}
                        {useCompactNav && (
                            <Box>
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

                                    {/* Burger Dropdown Menu Launcher. */}
                                    <Menu.Target>
                                        <Burger
                                            opened={opened}
                                            onClick={toggle}
                                            aria-label="Open navigation menu"
                                            size="sm"
                                        />
                                    </Menu.Target>

                                    {/* Mobile Dropdown Menu Display. */}
                                    <Menu.Dropdown className="app-mobile-menu-dropdown">
                                        {navItems.map((item) => {
                                            const isActive = location.pathname === `/${item.path}`;
                                            const iconColor = isActive
                                                ? "var(--mantine-color-yellow-4)"
                                                : "var(--mantine-color-white)";

                                            return (
                                                <Menu.Item
                                                    key={item.path}
                                                    component={NavLink}
                                                    to={`/${item.path}`}
                                                    onClick={close}
                                                    className={`app-mobile-menu-item${isActive ? " app-mobile-menu-item-active" : ""}`}
                                                >
                                                    <Group w="100%" gap="sm" wrap="nowrap" align="center">
                                                        <Box className="app-mobile-menu-icon-slot">
                                                            {getMobileMenuIcon(item.path, iconColor)}
                                                        </Box>
                                                        <Box className="app-mobile-menu-label-slot">
                                                            <Text
                                                                component="span"
                                                                className={`app-menu-link app-mobile-menu-label${isActive ? " app-mobile-menu-label-active" : ""}`}
                                                            >
                                                                {item.label}
                                                            </Text>
                                                        </Box>
                                                    </Group>
                                                </Menu.Item>
                                            );
                                        })}
                                    </Menu.Dropdown>
                                </Menu>
                            </Box>
                        )}
                    </Group>
                </Container>

                {/* Header bottom border. */}
                <Box
                    h={1}
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        pointerEvents: "none",
                        background:
                            "linear-gradient(90deg, rgba(255,183,0,0) 0%, rgba(255,183,0,1) 50%, rgba(255,183,0,0) 100%)",
                    }}
                />

                {/* Header bottom shadow. */}
                <Box
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: -56,
                        height: 56,
                        pointerEvents: "none",
                        background: "linear-gradient(180deg, #050505 0%, rgba(5, 5, 5, 0) 100%)",
                    }}
                />
            </AppShell.Header>

            {/* Main Body Display */}
            <AppShell.Main>
                <Container size="lg" py="xl">
                    <Outlet />
                </Container>
            </AppShell.Main>

            {/* Bottom Gradient Shadow */}
            <Box
                style={{
                    position: "fixed",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 72,
                    pointerEvents: "none",
                    zIndex: 150,
                    background: "linear-gradient(0deg, #050505 0%, rgba(5, 5, 5, 0) 100%)",
                }}
            />
        </AppShell>
    );
}
