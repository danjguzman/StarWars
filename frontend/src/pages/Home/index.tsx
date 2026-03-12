import { useLayoutEffect, useRef } from "react";
import {
    AppShell,
    Box,
    Burger,
    Container,
    Group,
    Menu,
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
import { FilmReelIcon } from "@phosphor-icons/react";
import { NavLink, useLocation, useOutlet, type Location } from "react-router-dom";
import { HEADER_HEIGHT_CSS, NAV_ITEMS } from "@utils/consts";
import styles from "./index.module.css";

interface ModalRouteState {
    backgroundLocation?: Location;
}

function pageTransitionKeyFromPath(pathname: string) {
    const [firstSegment] = pathname.split("/").filter(Boolean);
    return firstSegment ?? "home";
}

function scrollPageToTop() {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    if (document.scrollingElement) {
        document.scrollingElement.scrollTop = 0;
        document.scrollingElement.scrollLeft = 0;
    }
}

function getDisplayedLocation(location: Location) {
    const state = location.state as ModalRouteState | null;
    return state?.backgroundLocation ?? location;
}

function RouteTransitionOutlet() {
    const location = useLocation();
    const outlet = useOutlet();
    const displayedLocation = getDisplayedLocation(location);
    const transitionKey = pageTransitionKeyFromPath(displayedLocation.pathname);
    const previousTransitionKeyRef = useRef(transitionKey);

    useLayoutEffect(() => {
        const previousTransitionKey = previousTransitionKeyRef.current;
        previousTransitionKeyRef.current = transitionKey;

        if (previousTransitionKey !== transitionKey) {
            scrollPageToTop();
        }
    }, [transitionKey]);

    if (!outlet) return null;

    return (
        <Box className={styles.routeTransitionShell}>
            <Box key={transitionKey} className={styles.routePage}>
                {outlet}
            </Box>
        </Box>
    );
}

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
        <div className={styles.statusCard}>
            <Text size="lg" className={styles.statusText}>
                Ready...
            </Text>
        </div>
    );
}

export function HomeSectionPage({ title }: { title: string }) {
    return (
        <div className={styles.statusCard}>
            <Title order={3} className={`${styles.pageTitle} ${styles.statusTitle}`}>
                {title}
            </Title>
            <Text className={styles.statusText}>Ready...</Text>
        </div>
    );
}

export default function HomeLayout() {
    const [opened, { open, close, toggle }] = useDisclosure(false);
    const useCompactNav = useMediaQuery("(max-width: 906px)");
    const location = useLocation();
    const displayedLocation = getDisplayedLocation(location);

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
                        <NavLink to="/films" className={styles.headerBrandLink} aria-label="Go to Films">
                            <Box className={styles.headerBrand}>
                                <Text c="yellow.4" className={styles.headerTitleLine}>
                                    Star Wars
                                </Text>
                                <Text c="yellow.4" className={styles.headerTitleLine}>
                                    Explorer
                                </Text>
                            </Box>
                        </NavLink>

                        {/* Nav Links. */}
                        {!useCompactNav && (
                            <Group gap="lg" justify="flex-end">
                                {NAV_ITEMS.map((item) => {
                                    const isActive = displayedLocation.pathname === `/${item.path}`
                                        || displayedLocation.pathname.startsWith(`/${item.path}/`);

                                    return (
                                    <NavLink
                                        key={item.path}
                                        to={`/${item.path}`}
                                        className={`${styles.headerNavItem}${isActive ? ` ${styles.headerNavItemActive}` : ""}`}
                                    >
                                        {() => (
                                            <Text component="span" fw={500} className={`${styles.menuLink} ${styles.headerNavLink}`}>
                                                {item.label}
                                            </Text>
                                        )}
                                    </NavLink>
                                    );
                                })}
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
                                    <Menu.Dropdown className={styles.mobileMenuDropdown}>
                                        {NAV_ITEMS.map((item) => {
                                            const isActive = displayedLocation.pathname === `/${item.path}`
                                                || displayedLocation.pathname.startsWith(`/${item.path}/`);
                                            const iconColor = isActive
                                                ? "var(--mantine-color-yellow-4)"
                                                : "var(--mantine-color-white)";

                                            return (
                                                <Menu.Item
                                                    key={item.path}
                                                    component={NavLink}
                                                    to={`/${item.path}`}
                                                    onClick={close}
                                                    className={styles.mobileMenuItem}
                                                >
                                                    <Group w="100%" gap="sm" wrap="nowrap" align="center">
                                                        <Box className={styles.mobileMenuIconSlot}>
                                                            {getMobileMenuIcon(item.path, iconColor)}
                                                        </Box>
                                                        <Box className={styles.mobileMenuLabelSlot}>
                                                            <Text
                                                                component="span"
                                                                className={`${styles.menuLink} ${styles.mobileMenuLabel}${isActive ? ` ${styles.mobileMenuLabelActive}` : ""}`}
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
            <AppShell.Main pt={0}>
                <Container size="lg" py="xl">
                    <RouteTransitionOutlet />
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
