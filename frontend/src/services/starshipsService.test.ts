import { fetchStarshipsPage, loadStarships } from '@services/starshipsService';
import { apiUrl, getJson, isSwapiPagedResponse } from '@services/api';
import { getCachedPage, getCachedValue, setCachedValue } from '@utils/clientCache';
import type { Starship } from '@types';

jest.mock('@services/api', () => ({
    apiUrl: jest.fn((path: string) => `https://swapi.info/api${path}`),
    getJson: jest.fn(),
    isSwapiPagedResponse: jest.fn(),
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

function createStarship(id: number, name = `Starship ${id}`): Starship {
    return {
        name,
        model: 'Model Name',
        manufacturer: 'Corellia Inc',
        cost_in_credits: '100000',
        length: '150',
        max_atmosphering_speed: '1050',
        crew: '4',
        passengers: '6',
        cargo_capacity: '50000',
        consumables: '2 months',
        hyperdrive_rating: '2.0',
        MGLT: '70',
        starship_class: 'corvette',
        pilots: [],
        films: [],
        created: '2026-01-01T00:00:00.000Z',
        edited: '2026-01-01T00:00:00.000Z',
        url: `https://swapi.info/api/starships/${id}`,
    };
}

describe('starshipsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('fetchStarshipsPage slices the preloaded starships cache before falling back to the API', async () => {
        const allStarships = [createStarship(1), createStarship(2), createStarship(3), createStarship(4)];
        mockedGetCachedValue.mockReturnValue(allStarships);

        const result = await fetchStarshipsPage(2, 2);
        expect(result).toEqual({
            starships: [allStarships[2], allStarships[3]],
            hasMore: false,
        });
        expect(mockedGetJson).not.toHaveBeenCalled();
    });

    test('fetchStarshipsPage caches full-list API responses and returns the requested page slice', async () => {
        const allStarships = [createStarship(1), createStarship(2), createStarship(3)];
        mockedGetCachedValue.mockReturnValue(null);
        mockedGetJson.mockResolvedValue(allStarships);

        const result = await fetchStarshipsPage(1, 2);
        expect(mockedApiUrl).toHaveBeenCalledWith('/starships?page=1');
        expect(mockedSetCachedValue).toHaveBeenCalledWith('starships:all', allStarships, 300000);
        expect(result).toEqual({
            starships: [allStarships[0], allStarships[1]],
            hasMore: true,
        });
    });

    test('fetchStarshipsPage returns SWAPI paged results when the API responds with a page object', async () => {
        const pageResults = [createStarship(5, 'CR90 corvette')];
        const pagedResponse = {
            count: 36,
            next: 'https://swapi.info/api/starships?page=2',
            previous: null,
            results: pageResults,
        };

        mockedGetCachedValue.mockReturnValue(null);
        mockedGetJson.mockResolvedValue(pagedResponse);
        mockedIsSwapiPagedResponse.mockReturnValue(true);

        const result = await fetchStarshipsPage(1);
        expect(result).toEqual({
            starships: pageResults,
            hasMore: true,
        });
    });

    test('loadStarships unwraps cached page data into the store-friendly shape', async () => {
        mockedGetCachedPage.mockResolvedValue({
            starships: [createStarship(3, 'Star Destroyer')],
            hasMore: false,
        });

        const result = await loadStarships(2);
        expect(result).toEqual({
            items: [createStarship(3, 'Star Destroyer')],
            hasMore: false,
        });
        expect(mockedGetCachedPage).toHaveBeenCalledWith('starships', 2, expect.any(Function), 300000);
    });

    test('fetchStarshipsPage throws when the API response shape is not supported', async () => {
        mockedGetCachedValue.mockReturnValue(null);
        mockedGetJson.mockResolvedValue({ results: 'not-an-array' });
        mockedIsSwapiPagedResponse.mockReturnValue(false);
        await expect(fetchStarshipsPage(1)).rejects.toThrow('Unexpected starships response shape');
    });
});
