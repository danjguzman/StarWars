import { getJson, apiUrl } from "./api";
import { type Person } from "../types/person";

export function fetchPeople() {
    return getJson<Person[]>(apiUrl("/people"));
}

export function fetchPersonById(id: string) {
    return getJson<Person>(apiUrl(`/people/${id}`));
}