import { useEffect, useMemo, useRef, useState } from "react";
import { Box, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { MagnifyingGlass } from "phosphor-react";
import styles from "./index.module.css";

interface HeaderSearchProps<TItem extends { url: string }> {
    items: TItem[];
    labelKey?: keyof TItem & string;
    placeholder: string;
    emptyLabel: string;
    onSelect: (item: TItem) => void;
}

function getItemLabel<TItem extends { url: string }>(item: TItem, labelKey: keyof TItem & string) {
    const value = item[labelKey];
    if (typeof value === "string" && value.trim().length > 0) return value;
    return "Unknown";
}

export default function HeaderSearch<TItem extends { url: string }>({
    items,
    labelKey = "name" as keyof TItem & string,
    placeholder,
    emptyLabel,
    onSelect,
}: HeaderSearchProps<TItem>) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [query, setQuery] = useState("");
    const [opened, setOpened] = useState(false);

    const trimmedQuery = query.trim();
    const [debouncedQuery] = useDebouncedValue(trimmedQuery, 250);
    const matchingItems = useMemo(() => {
        if (!debouncedQuery) return [];

        const normalizedQuery = debouncedQuery.toLowerCase();
        return items.filter((item) => getItemLabel(item, labelKey).toLowerCase().includes(normalizedQuery));
    }, [debouncedQuery, items, labelKey]);
    const shouldShowDropdown = opened && Boolean(trimmedQuery);
    const isUpdating = shouldShowDropdown && debouncedQuery !== trimmedQuery;

    useEffect(() => {
        if (!opened) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (containerRef.current?.contains(event.target as Node)) return;
            setOpened(false);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpened(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [opened]);

    const selectItem = (item: TItem) => {
        onSelect(item);
        setQuery("");
        setOpened(false);
    };

    return (
        <Box className={styles.root} ref={containerRef}>
            <Box className={styles.inputRow}>
                <Box className={styles.iconShell} aria-hidden="true">
                    <MagnifyingGlass size={18} weight="bold" />
                </Box>

                <TextInput
                    value={query}
                    onChange={(event) => {
                        setQuery(event.currentTarget.value);
                        setOpened(true);
                    }}
                    onFocus={() => {
                        if (trimmedQuery) {
                            setOpened(true);
                        }
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !isUpdating && matchingItems.length > 0) {
                            event.preventDefault();
                            const firstMatch = matchingItems[0];
                            if (!firstMatch) return;

                            selectItem(firstMatch);
                        }
                    }}
                    placeholder={placeholder}
                    aria-label={placeholder}
                    classNames={{
                        input: styles.input,
                    }}
                />
            </Box>

            {shouldShowDropdown ? (
                <Box className={styles.dropdown} role="listbox" aria-label={`${placeholder} results`}>
                    {isUpdating ? (
                        <Box className={styles.emptyState}>Updating results...</Box>
                    ) : matchingItems.length > 0 ? matchingItems.map((item) => {
                        const itemLabel = getItemLabel(item, labelKey);

                        return (
                            <button
                                key={item.url}
                                type="button"
                                className={styles.resultButton}
                                onClick={() => {
                                    selectItem(item);
                                }}
                            >
                                {itemLabel}
                            </button>
                        );
                    }) : (
                        <Box className={styles.emptyState}>{emptyLabel}</Box>
                    )}
                </Box>
            ) : null}
        </Box>
    );
}
