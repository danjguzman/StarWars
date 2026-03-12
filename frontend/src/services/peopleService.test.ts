import { fetchPeoplePage, loadPeople } from '@services/peopleService';
import { apiUrl, getJson, isSwapiPagedResponse } from '@services/api';
import { getPreloadedCollection } from '@services/preloadService';
import { getCachedPage, getCachedValue, setCachedValue } from '@utils/clientCache';
import type { Person } from '@types';

jest.mock('@services/api', () => ({
    apiUrl: jest.fn((path: string) => `https://swapi.info/api${path}`),
    getJson: jest.fn(),
    isSwapiPagedResponse: jest.fn(),
}));

jest.mock('@services/preloadService', () => ({
    getPreloadedCollection: jest.fn(),
}));

jest.mock('@utils/clientCache', () => ({
    getCachedPage: jest.fn(),
    getCachedValue: jest.fn(),
    setCachedValue: jest.fn(),
}));

const mockedApiUrl = jest.mocked(apiUrl);
const mockedGetJson = jest.mocked(getJson);
const mockedIsSwapiPagedResponse = jest.mocked(isSwapiPagedResponse);
const mockedGetCachedPage = jest.mocked(getCachedPage);
const mockedGetCachedValue = jest.mocked(getCachedValue);
const mockedSetCachedValue = jest.mocked(setCachedValue);
const mockedGetPreloadedCollection = jest.mocked(getPreloadedCollection);

function createPerson(id: number, name = `Person ${id}`): Person {
    return {
        name,
        height: '172',
        mass: '77',
        hair_color: 'blond',
        skin_color: 'fair',
        eye_color: 'blue',
        birth_year: '19BBY',
        gender: 'male',
        homeworld: 'https://swapi.info/api/planets/1',
        films: [],
        species: [],
        vehicles: [],
        starships: [],
        created: '2026-01-01T00:00:00.000Z',
        edited: '2026-01-01T00:00:00.000Z',
        url: `https://swapi.info/api/people/${id}`,
    };
}

describe('peopleService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetPreloadedCollection.mockReturnValue(null);
    });

    test('fetchPeoplePage slices the preloaded people cache before falling back to the API', async () => {
        const allPeople = [createPerson(1), createPerson(2), createPerson(3), createPerson(4)];
        mockedGetCachedValue.mockReturnValue(allPeople);

        const result = await fetchPeoplePage(2, 2);
        expect(result).toEqual({
            people: [allPeople[2], allPeople[3]],
            hasMore: false,
        });
        expect(mockedGetJson).not.toHaveBeenCalled();
    });

    test('fetchPeoplePage caches full-list API responses and returns the requested page slice', async () => {
        const allPeople = [createPerson(1), createPerson(2), createPerson(3)];
        mockedGetCachedValue.mockReturnValue(null);
        mockedGetJson.mockResolvedValue(allPeople);

        const result = await fetchPeoplePage(1, 2);
        expect(mockedApiUrl).toHaveBeenCalledWith('/people?page=1');
        expect(mockedSetCachedValue).toHaveBeenCalledWith('people:all', allPeople, 300000);
        expect(result).toEqual({
            people: [allPeople[0], allPeople[1]],
            hasMore: true,
        });
    });

    test('fetchPeoplePage repopulates cache from preloaded data when the TTL cache expired', async () => {
        const preloadedPeople = [createPerson(1), createPerson(2), createPerson(3)];
        mockedGetCachedValue.mockReturnValue(null);
        mockedGetPreloadedCollection.mockReturnValue(preloadedPeople);

        const result = await fetchPeoplePage(1, 2);

        expect(result).toEqual({
            people: [preloadedPeople[0], preloadedPeople[1]],
            hasMore: true,
        });
        expect(mockedSetCachedValue).toHaveBeenCalledWith('people:all', preloadedPeople, 300000);
        expect(mockedGetJson).not.toHaveBeenCalled();
    });

    test('fetchPeoplePage returns SWAPI paged results when the API responds with a page object', async () => {
        const pageResults = [createPerson(5, 'Leia Organa')];
        const pagedResponse = {
            count: 82,
            next: 'https://swapi.info/api/people?page=2',
            previous: null,
            results: pageResults,
        };

        mockedGetCachedValue.mockReturnValue(null);
        mockedGetJson.mockResolvedValue(pagedResponse);
        mockedIsSwapiPagedResponse.mockReturnValue(true);

        const result = await fetchPeoplePage(1);
        expect(result).toEqual({
            people: pageResults,
            hasMore: true,
        });
    });

    test('loadPeople unwraps cached page data into the store-friendly shape', async () => {
        mockedGetCachedPage.mockResolvedValue({
            people: [createPerson(7, 'Han Solo')],
            hasMore: false,
        });

        const result = await loadPeople(3);
        expect(result).toEqual({
            items: [createPerson(7, 'Han Solo')],
            hasMore: false,
        });
        expect(mockedGetCachedPage).toHaveBeenCalledWith('people', 3, expect.any(Function), 300000);
    });

    test('fetchPeoplePage throws when the API response shape is not supported', async () => {
        mockedGetCachedValue.mockReturnValue(null);
        mockedGetJson.mockResolvedValue({ results: 'not-an-array' });
        mockedIsSwapiPagedResponse.mockReturnValue(false);
        await expect(fetchPeoplePage(1)).rejects.toThrow('Unexpected people response shape');
    });
});
