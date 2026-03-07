const API_BASE = "https://swapi.info/api";

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