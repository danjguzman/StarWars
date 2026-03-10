import { type SwapiPagedResponse } from "@types";

/*
 * This file holds the basic SWAPI API helpers used across the app.
 * It defines the paged response shape, checks response data shape,
 * fetches JSON data, and builds full API URLs from relative paths.
 */

const API_BASE = "https://swapi.info/api";

/* Check whether unknown data looks like a paged SWAPI response. */
export function isSwapiPagedResponse<T>(data: unknown): data is SwapiPagedResponse<T> {
    if (!data || typeof data !== "object") return false;
    const candidate = data as Partial<SwapiPagedResponse<T>>;
    return (
        Array.isArray(candidate.results) &&
        (typeof candidate.next === "string" || candidate.next === null)
    );
}

/* Fetch JSON data from a URL and throw an error if the request fails. */
export async function getJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    return response.json();
}

/* Build a full SWAPI API URL from a relative path. */
export function apiUrl(path: string) {
    return `${API_BASE}${path}`;
}
