/* Turn empty or placeholder API values into a cleaner label for the UI. */
export function formatDisplayValue(value?: string | null) {
    if (!value || value === "n/a" || value === "unknown") return "Unknown";
    return value;
}
