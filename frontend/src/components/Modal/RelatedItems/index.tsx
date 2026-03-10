import { type ReactNode } from "react";
import { Box, Menu, Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { type ResolvedResourceItem } from "@utils/resourceResolve";
import { resourceRoutePathFromUrl } from "@utils/swapi";
import styles from "./index.module.css";

/*
 * This file renders one related-resource button at the bottom of a modal.
 * It can stay decorative when there are no items, navigate directly when there
 * is one item, or open a dropdown menu when there are multiple related items.
 */

interface RelatedItemsProps {
    label: string;
    count: number;
    icon: ReactNode;
    items: ResolvedResourceItem[];
}

/* Render one related-resource control for the modal footer. */
export default function RelatedItems({ label, count, icon, items }: RelatedItemsProps) {
    
    /* Use router navigation so related items stay inside the app. */
    const navigate = useNavigate();

    /* Work out how this related-item button should behave. */
    const isEmpty = count === 0;
    const directNavigationPath = count === 1 ? resourceRoutePathFromUrl(items[0]?.url ?? "") : null;
    const hasMenu = count > 1;
    const canNavigateDirectly = directNavigationPath !== null;
    const isInteractive = hasMenu || canNavigateDirectly;

    /* Build the final class list for the outer wrapper. */
    const rootClassName = [
        styles.item,
        isEmpty ? styles.itemEmpty : "",
        isInteractive ? styles.itemInteractive : "",
    ].filter(Boolean).join(" ");

    /* Reuse the same circular bubble markup for all three states. */
    const bubbleMarkup = (
        <span className={styles.bubble}>
            <span className={styles.icon}>{icon}</span>
            <span className={styles.badge}>{count}</span>
        </span>
    );

    return (
        <Box className={rootClassName}>

            {/* Show a dropdown menu when this group has multiple related items. */}
            {hasMenu ? (

                <Menu shadow="md" width={220} position="top" offset={10} withinPortal zIndex={1300}>
                    <Menu.Target>
                        {/* Use the bubble as the menu trigger. */}
                        <button type="button" className={styles.triggerButton} aria-label={`Show ${label}`}>
                            {bubbleMarkup}
                        </button>
                    </Menu.Target>

                    {/* Render one menu row for each related item. */}
                    <Menu.Dropdown className={styles.menuDropdown}>
                        {items.map((item, index) => (
                            <Menu.Item
                                key={`${label}-${item.url}-${index}`}
                                component="button"
                                onClick={() => {
                                    /* Convert the resource URL into an internal app route. */
                                    const routePath = resourceRoutePathFromUrl(item.url);
                                    if (!routePath) return;

                                    /* Navigate to the selected related item. */
                                    navigate(routePath);
                                }}
                                className={styles.menuItem}
                            >
                                <Text component="span" className={styles.menuLabel}>
                                    {item.name}
                                </Text>
                            </Menu.Item>
                        ))}
                    </Menu.Dropdown>
                </Menu>

            ) : canNavigateDirectly ? (

                /* Go straight to the item when this group only has one related resource. */
                <button
                    type="button"
                    className={styles.triggerButton}
                    onClick={() => {
                        /* Navigate directly to the one related item. */
                        navigate(directNavigationPath);
                    }}
                    aria-label={`Open ${label}`}
                >
                    {bubbleMarkup}
                </button>

            ) : (

                /* Keep the bubble decorative only when there are no related items. */
                bubbleMarkup

            )}

            {/* Show the relationship label under the bubble. */}
            <small className={styles.label}>{label}</small>
        </Box>
    );
}
