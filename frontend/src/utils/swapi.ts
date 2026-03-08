export function personUrlFromId(id: string) {
    return `https://swapi.info/api/people/${id}`;
}

export function resourceIdFromUrl(url: string) {
    const match = url.match(/\/(\d+)\/?$/);

    if (!match) {
        return null;
    }

    return match[1];
}

export function personIdFromUrl(url: string) {
    return resourceIdFromUrl(url);
}
