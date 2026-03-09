export function formatDisplayValue(value?: string | null) {
    if (!value || value === "n/a" || value === "unknown") return "Unknown";
    return value;
}
