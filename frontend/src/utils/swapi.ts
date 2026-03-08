export function personUrlFromId(id: string) {
    return `https://swapi.info/api/people/${id}`;
}

export function personIdFromUrl(url: string) {
    const match = url.match(/\/(\d+)\/?$/);

    if (!match) {
        return null;
    }

    return match[1];
}
