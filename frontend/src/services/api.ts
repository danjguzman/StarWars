const API_BASE = "https://swapi.info/api";

export interface SwapiPagedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export function isSwapiPagedResponse<T>(data: unknown): data is SwapiPagedResponse<T> {
    if (!data || typeof data !== "object") {
        return false;
    }

    const candidate = data as Partial<SwapiPagedResponse<T>>;

    return (
        Array.isArray(candidate.results) &&
        (typeof candidate.next === "string" || candidate.next === null)
    );
}

export async function getJson<T>(url: string): Promise<T> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
}

export function apiUrl(path: string) {
    return `${API_BASE}${path}`;
}
