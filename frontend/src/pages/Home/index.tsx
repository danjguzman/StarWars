import { useLayoutEffect, useRef } from "react";
import {
    AppShell,
    Box,
    Burger,
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
import AppModalHost from "@pages/_shared/AppModalHost";
import { NavLink, useLocation, useOutlet } from "react-router-dom";
import { HEADER_HEIGHT_CSS, NAV_ITEMS } from "@utils/consts";
import styles from "./index.module.css";

function pageTransitionKeyFromPath(pathname: string) {
    const [firstSegment] = pathname.split("/").filter(Boolean);
    return firstSegment ?? "home";
}

function scrollPageToTop() {
    const scrollRoot = document.getElementById("app-main-scroll");

    if (scrollRoot && typeof scrollRoot.scrollTo === "function") {
        scrollRoot.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    if (document.scrollingElement) {
        document.scrollingElement.scrollTop = 0;
        document.scrollingElement.scrollLeft = 0;
    }
}

function RouteTransitionOutlet() {
    const location = useLocation();
    const outlet = useOutlet();
    const transitionKey = pageTransitionKeyFromPath(location.pathname);
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
            <Text className={`${styles.statusText} ${styles.statusTextLarge}`}>
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

    return (
        <AppShell header={{ height: HEADER_HEIGHT_CSS }} mode="static" className={styles.shell}>

            {/* Sticky Header. */}
            <AppShell.Header className={styles.appHeader}>
                <div className={styles.headerContainer}>
                    <div className={styles.headerRow}>

                        {/* Page Title. */}
                        <NavLink to="/films" className={styles.headerBrandLink} aria-label="Go to Films">
                            <Box className={styles.headerBrand}>
                                <Text className={styles.headerTitleLine}>
                                    Star Wars
                                </Text>
                                <Text className={styles.headerTitleLine}>
                                    Explorer
                                </Text>
                            </Box>
                        </NavLink>

                        {/* Nav Links. */}
                        {!useCompactNav && (
                            <div className={styles.desktopNav}>
                                {NAV_ITEMS.map((item) => {
                                    const isActive = location.pathname === `/${item.path}`
                                        || location.pathname.startsWith(`/${item.path}/`);

                                    return (
                                    <NavLink
                                        key={item.path}
                                        to={`/${item.path}`}
                                        className={`${styles.headerNavItem}${isActive ? ` ${styles.headerNavItemActive}` : ""}`}
                                    >
                                        {() => (
                                            <Text component="span" className={`${styles.menuLink} ${styles.headerNavLink} ${styles.headerNavText}`}>
                                                {item.label}
                                            </Text>
                                        )}
                                    </NavLink>
                                    );
                                })}
                            </div>
                        )}

                        {/* Mobile / Responsive Dropdown Links. */}
                        {useCompactNav && (
                            <Box>
                                <Menu
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
                                        />
                                    </Menu.Target>

                {/* Mobile Dropdown Menu Display. */}
                                    <Menu.Dropdown className={styles.mobileMenuDropdown}>
                                        {NAV_ITEMS.map((item) => {
                                            const isActive = location.pathname === `/${item.path}`
                                                || location.pathname.startsWith(`/${item.path}/`);
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
                                                    <div className={styles.mobileMenuRow}>
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
                                                    </div>
                                                </Menu.Item>
                                            );
                                        })}
                                    </Menu.Dropdown>
                                </Menu>
                            </Box>
                        )}
                    </div>
                </div>

                {/* Header bottom border. */}
                <Box className={styles.headerBottomBorder} />

                {/* Header bottom shadow. */}
                <Box className={styles.headerBottomShadow} />
            </AppShell.Header>

            {/* Main Body Display */}
            <AppShell.Main id="app-main-scroll" className={styles.mainScroll}>
                <div className={styles.mainContainer}>
                    <RouteTransitionOutlet />
                </div>
            </AppShell.Main>

            <AppModalHost />

            {/* Bottom Gradient Shadow */}
            <Box className={styles.pageBottomShadow} />
        </AppShell>
    );
}
