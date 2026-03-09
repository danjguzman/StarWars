import { type ReactNode } from "react";
import { Box, Menu, Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { type ResolvedResourceItem } from "@utils/resourceResolve";
import { resourceRoutePathFromUrl } from "@utils/swapi";
import styles from "./index.module.css";

interface RelatedItemsProps {
    label: string;
    count: number;
    icon: ReactNode;
    items: ResolvedResourceItem[];
}

export default function RelatedItems({ label, count, icon, items }: RelatedItemsProps) {
    const navigate = useNavigate();
    const isEmpty = count === 0;
    const directNavigationPath = count === 1 ? resourceRoutePathFromUrl(items[0]?.url ?? "") : null;
    const hasMenu = count > 1;
    const canNavigateDirectly = directNavigationPath !== null;
    const isInteractive = hasMenu || canNavigateDirectly;

    const rootClassName = [
        styles.item,
        isEmpty ? styles.itemEmpty : "",
        isInteractive ? styles.itemInteractive : "",
    ].filter(Boolean).join(" ");

    const bubbleMarkup = (
        <span className={styles.bubble}>
            <span className={styles.icon}>{icon}</span>
            <span className={styles.badge}>{count}</span>
        </span>
    );

    return (
        <Box className={rootClassName}>
            {hasMenu ? (
                <Menu shadow="md" width={220} position="top" offset={10} withinPortal zIndex={1300}>
                    <Menu.Target>
                        <button type="button" className={styles.triggerButton} aria-label={`Show ${label}`}>
                            {bubbleMarkup}
                        </button>
                    </Menu.Target>

                    <Menu.Dropdown className={`app-mobile-menu-dropdown ${styles.menuDropdown}`}>
                        {items.map((item, index) => (
                            <Menu.Item
                                key={`${label}-${item.url}-${index}`}
                                component="button"
                                onClick={() => {
                                    const routePath = resourceRoutePathFromUrl(item.url);
                                    if (!routePath) return;
                                    navigate(routePath);
                                }}
                                className={`app-mobile-menu-item ${styles.menuItem}`}
                            >
                                <Text component="span" className={`app-mobile-menu-label ${styles.menuLabel}`}>
                                    {item.name}
                                </Text>
                            </Menu.Item>
                        ))}
                    </Menu.Dropdown>
                </Menu>
            ) : canNavigateDirectly ? (
                <button
                    type="button"
                    className={styles.triggerButton}
                    onClick={() => {
                        navigate(directNavigationPath);
                    }}
                    aria-label={`Open ${label}`}
                >
                    {bubbleMarkup}
                </button>
            ) : bubbleMarkup}

            <small className={styles.label}>{label}</small>
        </Box>
    );
}
