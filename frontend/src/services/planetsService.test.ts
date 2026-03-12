import { fetchPlanetsPage, loadPlanets } from '@services/planetsService';
import { apiUrl, getJson, isSwapiPagedResponse } from '@services/api';
import { getPreloadedCollection } from '@services/preloadService';
import { getCachedPage, getCachedValue, setCachedValue } from '@utils/clientCache';
import type { Planet } from '@types';

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

function createPlanet(id: number, name = `Planet ${id}`): Planet {
    return {
        name,
        rotation_period: '24',
        orbital_period: '364',
        diameter: '10465',
        climate: 'temperate',
        gravity: '1 standard',
        terrain: 'grasslands, mountains',
        surface_water: '40',
        population: '200000',
        residents: [],
        films: [],
        created: '2026-01-01T00:00:00.000Z',
        edited: '2026-01-01T00:00:00.000Z',
        url: `https://swapi.info/api/planets/${id}`,
    };
}

describe('planetsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetPreloadedCollection.mockReturnValue(null);
    });

    test('fetchPlanetsPage slices the preloaded planets cache before falling back to the API', async () => {
        const allPlanets = [createPlanet(1), createPlanet(2), createPlanet(3), createPlanet(4)];
        mockedGetCachedValue.mockReturnValue(allPlanets);

        const result = await fetchPlanetsPage(2, 2);
        expect(result).toEqual({
            planets: [allPlanets[2], allPlanets[3]],
            hasMore: false,
        });
        expect(mockedGetJson).not.toHaveBeenCalled();
    });

    test('fetchPlanetsPage caches full-list API responses and returns the requested page slice', async () => {
        const allPlanets = [createPlanet(1), createPlanet(2), createPlanet(3)];
        mockedGetCachedValue.mockReturnValue(null);
        mockedGetJson.mockResolvedValue(allPlanets);

        const result = await fetchPlanetsPage(1, 2);
        expect(mockedApiUrl).toHaveBeenCalledWith('/planets?page=1');
        expect(mockedSetCachedValue).toHaveBeenCalledWith('planets:all', allPlanets, 300000);
        expect(result).toEqual({
            planets: [allPlanets[0], allPlanets[1]],
            hasMore: true,
        });
    });

    test('fetchPlanetsPage repopulates cache from preloaded data when the TTL cache expired', async () => {
        const preloadedPlanets = [createPlanet(1), createPlanet(2), createPlanet(3)];
        mockedGetCachedValue.mockReturnValue(null);
        mockedGetPreloadedCollection.mockReturnValue(preloadedPlanets);

        const result = await fetchPlanetsPage(1, 2);

        expect(result).toEqual({
            planets: [preloadedPlanets[0], preloadedPlanets[1]],
            hasMore: true,
        });
        expect(mockedSetCachedValue).toHaveBeenCalledWith('planets:all', preloadedPlanets, 300000);
        expect(mockedGetJson).not.toHaveBeenCalled();
    });

    test('fetchPlanetsPage returns SWAPI paged results when the API responds with a page object', async () => {
        const pageResults = [createPlanet(5, 'Hoth')];
        const pagedResponse = {
            count: 60,
            next: 'https://swapi.info/api/planets?page=2',
            previous: null,
            results: pageResults,
        };

        mockedGetCachedValue.mockReturnValue(null);
        mockedGetJson.mockResolvedValue(pagedResponse);
        mockedIsSwapiPagedResponse.mockReturnValue(true);

        const result = await fetchPlanetsPage(1);
        expect(result).toEqual({
            planets: pageResults,
            hasMore: true,
        });
    });

    test('loadPlanets unwraps cached page data into the store-friendly shape', async () => {
        mockedGetCachedPage.mockResolvedValue({
            planets: [createPlanet(7, 'Endor')],
            hasMore: false,
        });

        const result = await loadPlanets(3);
        expect(result).toEqual({
            items: [createPlanet(7, 'Endor')],
            hasMore: false,
        });
        expect(mockedGetCachedPage).toHaveBeenCalledWith('planets', 3, expect.any(Function), 300000);
    });

    test('fetchPlanetsPage throws when the API response shape is not supported', async () => {
        mockedGetCachedValue.mockReturnValue(null);
        mockedGetJson.mockResolvedValue({ results: 'not-an-array' });
        mockedIsSwapiPagedResponse.mockReturnValue(false);
        await expect(fetchPlanetsPage(1)).rejects.toThrow('Unexpected planets response shape');
    });
});
