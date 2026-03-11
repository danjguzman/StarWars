import { type SwapiPagedResponse } from "@types";
import { buildUserFacingError } from "@utils/errors";

/*
 * This file holds the basic SWAPI API helpers used across the app.
 * It defines the paged response shape, checks response data shape,
 * fetches JSON data, and builds full API URLs from relative paths.
 */

const API_BASE = "https://swapi.info/api";

function describeRequestTarget(url: string) {
    try {
        const parsedUrl = new URL(url);
        const normalizedPath = parsedUrl.pathname.replace(/^\/api\//, "").replace(/^\//, "");
        return normalizedPath || "the requested data";
    } catch {
        return "the requested data";
    }
}

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
    try {
        const response = await fetch(url);

        if (!response.ok) {
            const statusText = response.statusText.trim();
            throw new Error(
                `The Star Wars API returned ${response.status}${statusText ? ` ${statusText}` : ""} while loading ${describeRequestTarget(url)}`
            );
        }

        try {
            return await response.json() as T;
        } catch {
            throw new Error(`The Star Wars API returned unreadable data for ${describeRequestTarget(url)}`);
        }
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            throw new Error(`The request for ${describeRequestTarget(url)} was interrupted`);
        }

        if (error instanceof TypeError) {
            throw new Error("The Star Wars API is currently unreachable. Check your connection and try again.");
        }

        throw new Error(buildUserFacingError("We couldn't load data from the Star Wars API", error));
    }
}

/* Build a full SWAPI API URL from a relative path. */
export function apiUrl(path: string) {
    return `${API_BASE}${path}`;
}
