import {
    apiUrl,
    getJson,
    isSwapiPagedResponse,
    type SwapiPagedResponse,
} from "@services/api";
import { type Person } from "@types";

export interface PeoplePage {
    people: Person[];
    hasMore: boolean;
}

const FALLBACK_PAGE_SIZE = 12;

export async function fetchPeoplePage(page: number, pageSize = FALLBACK_PAGE_SIZE) {
    const data = await getJson<Person[] | SwapiPagedResponse<Person>>(
        apiUrl(`/people?page=${page}`)
    );

    if (Array.isArray(data)) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;

        return {
            people: data.slice(start, end),
            hasMore: end < data.length,
        } satisfies PeoplePage;
    }

    if (isSwapiPagedResponse(data)) {
        return {
            people: data.results,
            hasMore: Boolean(data.next),
        } satisfies PeoplePage;
    }

    throw new Error("Unexpected people response shape");
}

export function fetchPeople() {
    return getJson<Person[]>(apiUrl("/people"));
}

export function fetchPersonById(id: string) {
    return getJson<Person>(apiUrl(`/people/${id}`));
}
